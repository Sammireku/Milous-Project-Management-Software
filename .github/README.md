# GitHub Actions CI/CD Secrets & Setup Guide

This guide describes how to configure GitHub Repository Secrets to support automated Pull Request preview channels, Production Firebase Hosting deployments, and Cloud Functions deployment pipelines for the **Milous Project**.

---

## 🔑 Required GitHub Repository Secrets

Navigate to your GitHub Repository -> **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**.

Add the following required secrets:

### 1. Firebase Service Account Credentials (MANDATORY)

| Secret Name | Description | How to Obtain |
| :--- | :--- | :--- |
| `FIREBASE_SERVICE_ACCOUNT_MILOUS_PROJECT` | JSON Key content for a GCP Service Account with `Firebase Hosting Admin` and `Cloud Functions Developer` roles. | GCP Console -> **IAM & Admin** -> **Service Accounts** -> Create Key -> Copy full JSON string. |
| `FIREBASE_TOKEN` | Continuous Integration deployment token for Firebase CLI. | Run `firebase login:ci` in terminal -> Copy generated token token string. |

### 2. Frontend Build Environment Variables (Vite)

| Secret Name | Example Value | Description |
| :--- | :--- | :--- |
| `VITE_FIREBASE_API_KEY` | `AIzaSyDemoMilousKey...` | Firebase Web API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `milous-project-ngo.firebaseapp.com` | Firebase Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | `milous-project-ngo` | Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | `milous-project-ngo.appspot.com` | Storage Bucket URI |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `153144584157` | Cloud Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | `1:153144584157:web:abc123` | Firebase App ID |

---

## 🛠️ Service Account Permissions Setup

Ensure the service account associated with `FIREBASE_SERVICE_ACCOUNT_MILOUS_PROJECT` has the following IAM Roles assigned in Google Cloud Console / Firebase Console:

1. **Firebase Hosting Admin** (`roles/firebasehosting.admin`)
2. **Cloud Functions Admin** (`roles/cloudfunctions.admin`)
3. **Service Account User** (`roles/iam.serviceAccountUser`)
4. **Cloud Storage Admin** (`roles/storage.admin`)

---

## 🚀 Workflows Overview

- **`firebase-hosting-pull-request.yml`**: Triggers on pull requests to `main`. Runs `npm ci`, `npm run lint`, `npm run build`, and deploys a 7-day temporary preview URL to Firebase Hosting Preview Channels.
- **`firebase-hosting-merge.yml`**: Triggers when code is pushed or merged to `main`. Builds the production dist, deploys to the live Firebase Hosting channel, and deploys Cloud Functions (`firebase deploy --only functions,firestore:rules`).
