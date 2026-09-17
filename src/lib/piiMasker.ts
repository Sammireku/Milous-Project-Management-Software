/**
 * Server-Side PII (Personally Identifiable Information) Masking Utility
 * Ensures GDPR and Donor Compliance (USAID, EU, UN Data Privacy Standards)
 * before passing Firestore documents to external AI model endpoints (Gemini API).
 */

export interface PIIMaskResult {
  cleanText: string;
  count: number;
  redactionsSummary: {
    emails: number;
    phones: number;
    names: number;
    govtIds: number;
    financials: number;
  };
}

/**
 * Mask sensitive string patterns in raw text.
 */
export function maskPIIInText(text: string): PIIMaskResult {
  if (!text || typeof text !== 'string') {
    return {
      cleanText: text || '',
      count: 0,
      redactionsSummary: { emails: 0, phones: 0, names: 0, govtIds: 0, financials: 0 },
    };
  }

  let count = 0;
  const summary = { emails: 0, phones: 0, names: 0, govtIds: 0, financials: 0 };
  let cleanText = text;

  // 1. Mask Email Addresses
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  cleanText = cleanText.replace(emailRegex, () => {
    count++;
    summary.emails++;
    return '[EMAIL_REDACTED]';
  });

  // 2. Mask Phone Numbers (Local & International)
  const phoneRegex = /\b(?:\+\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/g;
  cleanText = cleanText.replace(phoneRegex, (match) => {
    const digitCount = match.replace(/\D/g, '').length;
    if (digitCount >= 7 && digitCount <= 15) {
      count++;
      summary.phones++;
      return '[PHONE_REDACTED]';
    }
    return match;
  });

  // 3. Mask Government IDs (e.g. Ghana Card GHA-123456789-0, SSN, National IDs)
  const govtIdRegex = /\b(GHA-\d{9}-\d|SSN:\s*\d{3}-\d{2}-\d{4}|ID:\s*[A-Z0-9]{6,12})\b/gi;
  cleanText = cleanText.replace(govtIdRegex, () => {
    count++;
    summary.govtIds++;
    return '[GOVT_ID_REDACTED]';
  });

  // 4. Mask Honorific Full Personal Names (e.g., Mr. Kwaku Mensah, Mrs. Amina Mahama)
  const nameRegex = /\b(Mr\.|Mrs\.|Ms\.|Dr\.|Chief|Hon\.|Officer)\s+[A-Z][a-z]+\s+[A-Z][a-z]+\b/g;
  cleanText = cleanText.replace(nameRegex, () => {
    count++;
    summary.names++;
    return '[BENEFICIARY_NAME_REDACTED]';
  });

  // 5. Mask Financial Account & Credit Card Numbers
  const cardRegex = /\b(?:\d[ -]*?){13,16}\b/g;
  cleanText = cleanText.replace(cardRegex, (match) => {
    if (match.replace(/\D/g, '').length >= 13) {
      count++;
      summary.financials++;
      return '[FINANCIAL_ACCOUNT_REDACTED]';
    }
    return match;
  });

  return {
    cleanText,
    count,
    redactionsSummary: summary,
  };
}

/**
 * Recursively scrub PII across Firestore Data Objects before sending to Gemini API context window.
 */
export function maskPIIInFirestoreObject<T>(data: T): { cleanData: T; totalScrubbed: number } {
  let totalScrubbed = 0;

  function recursiveScrub(val: any): any {
    if (val === null || val === undefined) return val;

    if (typeof val === 'string') {
      const { cleanText, count } = maskPIIInText(val);
      totalScrubbed += count;
      return cleanText;
    }

    if (Array.isArray(val)) {
      return val.map((item) => recursiveScrub(item));
    }

    if (typeof val === 'object') {
      const scrubbedObj: Record<string, any> = {};
      const sensitiveKeyNames = ['email', 'phone', 'telephone', 'beneficiaryName', 'nationalId', 'ssn', 'accountNumber'];

      for (const [key, value] of Object.entries(val)) {
        if (sensitiveKeyNames.includes(key.toLowerCase()) && typeof value === 'string') {
          scrubbedObj[key] = `[${key.toUpperCase()}_REDACTED]`;
          totalScrubbed++;
        } else {
          scrubbedObj[key] = recursiveScrub(value);
        }
      }
      return scrubbedObj;
    }

    return val;
  }

  const cleanData = recursiveScrub(data) as T;
  return { cleanData, totalScrubbed };
}
