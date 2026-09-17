"""
Milous Project - AI Risk Extraction Pipeline
Google Cloud Function (Python) triggered by Google Cloud Storage uploads.
Uses modern google-genai SDK with Vertex AI to extract project risks from multimodal documents.
Saves structured risk assessments to Firestore collection '/project_risks'.
"""

import os
import logging
from enum import Enum
from typing import List, Optional
from datetime import datetime, timezone

import functions_framework
from cloudevents.http import CloudEvent
from pydantic import BaseModel, Field, ValidationError

from google import genai
from google.genai import types
from google.cloud import firestore

# Configure structured logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai_risk_pipeline")

# ==============================================================================
# 1. Pydantic Schemas (Strict Output Contract)
# ==============================================================================

class RiskCategory(str, Enum):
    """Specific categories of operational risks for NGO field missions."""
    FINANCIAL = "Financial"
    OPERATIONAL = "Operational"
    COMMUNITY = "Community"
    SUPPLY_CHAIN = "Supply Chain"
    WEATHER = "Weather"


class ExtractedRisk(BaseModel):
    """Individual project risk extracted from the uploaded document."""
    title: str = Field(
        ...,
        description="Concise, descriptive title summarizing the specific risk identified.",
    )
    category: RiskCategory = Field(
        ...,
        description="Classification of the risk into Financial, Operational, Community, Supply Chain, or Weather.",
    )
    severity_score: int = Field(
        ...,
        ge=1,
        le=5,
        description="Severity rating on a scale of 1 to 5 (1 = Low/Negligible, 3 = Moderate, 5 = Critical/Emergency).",
    )
    evidence: str = Field(
        ...,
        description="Direct quote, observational citation, or empirical evidence extracted verbatim or derived from the document.",
    )


class RiskReport(BaseModel):
    """Aggregated risk report containing all risks detected within a field document."""
    risks: List[ExtractedRisk] = Field(
        default_factory=list,
        description="List of all extracted project risks found in the document.",
    )


# ==============================================================================
# 2. Clients Initialization (Lazy / Global Singletons)
# ==============================================================================

_genai_client: Optional[genai.Client] = None
_firestore_client: Optional[firestore.Client] = None


def get_genai_client() -> genai.Client:
    """Initialize or return the cached google-genai Client configured for Vertex AI."""
    global _genai_client
    if _genai_client is None:
        project_id = os.getenv("GOOGLE_CLOUD_PROJECT") or os.getenv("GCP_PROJECT")
        location = os.getenv("GOOGLE_CLOUD_LOCATION") or os.getenv("GOOGLE_CLOUD_REGION", "us-central1")

        logger.info("Initializing google-genai Client for Vertex AI (project=%s, location=%s)", project_id, location)
        _genai_client = genai.Client(
            vertexai=True,
            project=project_id,
            location=location,
        )
    return _genai_client


def get_firestore_client() -> firestore.Client:
    """Initialize or return the cached Firestore Client."""
    global _firestore_client
    if _firestore_client is None:
        _firestore_client = firestore.Client()
    return _firestore_client


# ==============================================================================
# 3. Helper Functions
# ==============================================================================

def parse_project_id(data: dict) -> str:
    """
    Extracts the projectId from GCS custom object metadata or file path hierarchy.
    Examples:
      - Custom metadata: {'projectId': 'proj-gh-wash-2025'}
      - Object name: 'projects/proj-gh-wash-2025/reports/tamale-audit.pdf' -> 'proj-gh-wash-2025'
      - Object name: 'proj-gh-wash-2025/tamale-audit.pdf' -> 'proj-gh-wash-2025'
    """
    metadata = data.get("metadata") or {}
    if "projectId" in metadata:
        return metadata["projectId"]
    if "project_id" in metadata:
        return metadata["project_id"]

    file_name = data.get("name", "")
    parts = file_name.strip("/").split("/")

    if len(parts) >= 2:
        if parts[0] in ("projects", "missions", "project") and len(parts) >= 3:
            return parts[1]
        return parts[0]

    return "GLOBAL_MISSION_GENERAL"


def resolve_mime_type(data: dict) -> str:
    """Determines the MIME type of the uploaded file, falling back based on file extension."""
    content_type = data.get("contentType")
    if content_type and content_type != "application/octet-stream":
        return content_type

    name = data.get("name", "").lower()
    if name.endswith(".pdf"):
        return "application/pdf"
    elif name.endswith(".png"):
        return "image/png"
    elif name.endswith(".jpg") or name.endswith(".jpeg"):
        return "image/jpeg"
    elif name.endswith(".webp"):
        return "image/webp"
    elif name.endswith(".tif") or name.endswith(".tiff"):
        return "image/tiff"
    
    return "application/pdf"


# ==============================================================================
# 4. Cloud Function Trigger Entry Point (GCS Finalized)
# ==============================================================================

@functions_framework.cloud_event
def extract_risks_from_document(cloud_event: CloudEvent) -> None:
    """
    Cloud Function triggered by GCS object finalized events
    (google.cloud.storage.object.v1.finalized).

    Extracts operational & compliance risks from scanned handwritten reports and PDFs
    using Gemini 2.5 Flash via Vertex AI and stores results into Firestore collection '/project_risks'.
    """
    event_data = cloud_event.data
    bucket_name = event_data.get("bucket")
    file_name = event_data.get("name")

    if not bucket_name or not file_name:
        logger.error("Invalid CloudEvent payload: missing 'bucket' or 'name'. Data: %s", event_data)
        return

    # Skip directory placeholders or transient temporary files
    if file_name.endswith("/") or file_name.startswith(".tmp_"):
        logger.info("Ignoring non-document or directory placeholder: %s", file_name)
        return

    source_file_uri = f"gs://{bucket_name}/{file_name}"
    content_type = resolve_mime_type(event_data)
    project_id = parse_project_id(event_data)

    logger.info(
        "Initiating risk extraction for '%s' (MIME: %s, ProjectId: %s)",
        source_file_uri,
        content_type,
        project_id,
    )

    client = get_genai_client()
    db = get_firestore_client()

    # Pass the GCS URI directly to the model as a Part
    document_part = types.Part.from_uri(
        file_uri=source_file_uri,
        mime_type=content_type,
    )

    prompt = (
        "You are an expert NGO Internal Auditor and Monitoring & Evaluation (M&E) Specialist "
        "for the Milous Project. Analyze the attached field document (which may include handwritten field notes, "
        "scanned supplier receipts, community feedback logs, or donor compliance reports). "
        "Thoroughly extract all identifiable project risks and classify each risk under one of the predefined "
        "categories (Financial, Operational, Community, Supply Chain, Weather) with a severity score from 1 to 5 "
        "and concrete evidence cited directly from the document."
    )

    try:
        # Call gemini-2.5-flash with structured response_schema and low temperature
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[document_part, prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=RiskReport,
                temperature=0.1,
            ),
        )

        logger.info("Received Gemini response for %s. Parsing RiskReport...", source_file_uri)

        # Parse JSON output conforming to RiskReport
        if response.parsed and isinstance(response.parsed, RiskReport):
            risk_report = response.parsed
        elif response.parsed and isinstance(response.parsed, dict):
            risk_report = RiskReport.model_validate(response.parsed)
        elif response.text:
            risk_report = RiskReport.model_validate_json(response.text)
        else:
            raise ValueError("Empty or invalid structured response returned by Gemini model.")

        extracted_risks_dict = [risk.model_dump() for risk in risk_report.risks]
        total_risks = len(extracted_risks_dict)
        max_severity = max([r.severity_score for r in risk_report.risks], default=1) if risk_report.risks else 0

        logger.info(
            "Extracted %d risks from %s (Max Severity: %d)",
            total_risks,
            source_file_uri,
            max_severity,
        )

        # Write to Firestore collection '/project_risks'
        now_utc = datetime.now(timezone.utc)
        doc_ref = db.collection("project_risks").document()

        firestore_payload = {
            "id": doc_ref.id,
            "projectId": project_id,
            "sourceFileUri": source_file_uri,
            "fileName": file_name,
            "bucketName": bucket_name,
            "contentType": content_type,
            "extractedRisks": extracted_risks_dict,
            "totalRisks": total_risks,
            "highestSeverity": max_severity,
            "status": "COMPLETED",
            "modelUsed": "gemini-2.5-flash",
            "timestamp": firestore.SERVER_TIMESTAMP,
            "createdAt": now_utc.isoformat(),
            "generationMetadata": {
                "temperature": 0.1,
                "sdk": "google-genai (Vertex AI)",
            },
        }

        doc_ref.set(firestore_payload)

        logger.info(
            "Successfully persisted Risk Report to Firestore: /project_risks/%s for Project %s",
            doc_ref.id,
            project_id,
        )

    except ValidationError as ve:
        logger.error("Pydantic validation failure on Gemini output for %s: %s", source_file_uri, ve)
        # Record error document in Firestore for auditability
        db.collection("project_risks").add({
            "projectId": project_id,
            "sourceFileUri": source_file_uri,
            "status": "VALIDATION_FAILED",
            "error": str(ve),
            "timestamp": firestore.SERVER_TIMESTAMP,
        })
        raise

    except Exception as exc:
        logger.error("Unhandled error processing document %s: %s", source_file_uri, exc, exc_info=True)
        # Record failure document in Firestore for operational triage
        db.collection("project_risks").add({
            "projectId": project_id,
            "sourceFileUri": source_file_uri,
            "status": "PROCESSING_FAILED",
            "error": str(exc),
            "timestamp": firestore.SERVER_TIMESTAMP,
        })
        raise
