# Milous Project - Multimodal AI Risk Extraction Cloud Function

Automated Cloud Function triggered by Google Cloud Storage uploads that extracts operational, financial, community, supply chain, and weather risks from field reports (scanned PDFs, handwritten field notes) using **Gemini 2.5 Flash** on **Vertex AI** via the modern `google-genai` Python SDK.

## Architecture

1. **Trigger:** `google.cloud.storage.object.v1.finalized` on the field uploads GCS bucket (`gs://<YOUR_FIELD_UPLOADS_BUCKET>`).
2. **AI Processing:** GCS URI (`gs://bucket/file`) is passed directly to `gemini-2.5-flash` using `types.Part.from_uri`.
3. **Structured Extraction:** Constrained by Pydantic schemas (`RiskReport` with `ExtractedRisk` list and `RiskCategory` enum).
4. **Persistence:** Extracted risks and metadata (`projectId`, `sourceFileUri`, `timestamp`) are persisted to Firestore in `/project_risks`.

## Deployment via gcloud CLI

```bash
gcloud functions deploy extract_risks_from_document \
    --gen2 \
    --runtime=python311 \
    --region=us-central1 \
    --source=./functions/ai_risk_extractor \
    --entry-point=extract_risks_from_document \
    --trigger-event-filters="type=google.cloud.storage.object.v1.finalized" \
    --trigger-event-filters="bucket=YOUR_GCS_FIELD_UPLOADS_BUCKET" \
    --set-env-vars="GOOGLE_CLOUD_LOCATION=us-central1"
```

## Local Testing with Functions Framework

```bash
# Install dependencies
pip install -r requirements.txt

# Run the function locally
functions-framework --target=extract_risks_from_document --signature-type=cloudevent
```
