# Milous Project — NGO ERP & Field Operations Platform

> **GitHub Description:** An enterprise-grade NGO project management platform featuring multi-donor budget burn rate tracking, M&E indicator analytics, AI risk analysis, PWA offline field sync, and hands-free voice dictation.

---

## 🌍 Overview

**Milous Project** is an enterprise-grade ERP and field operations platform engineered specifically for non-governmental organizations (NGOs), humanitarian missions, and international development agencies. It unifies project lifecycles, donor compliance, financial auditing, Monitoring & Evaluation (M&E), inventory procurement, and field timesheets into a single responsive application.

Built with **React 19**, **TypeScript**, **Tailwind CSS**, **Recharts**, **Firebase/Firestore**, and **Express.js**, the platform features server-side **Google Gemini AI** for risk analysis and automated donor compliance checks, alongside **PWA Offline capabilities** and **Voice-to-Text field dictation** for remote field staff operating in low-connectivity regions.

---

## ✨ Key Features

### 📊 1. Financial Management & Multi-Donor Burn Rates
- **Burn Rate Visualizations:** Recharts dashboard analyzing budget consumption across major institutional donors (USAID, EU, UNHCR, Global Fund).
- **Multi-Currency Support:** Instant currency conversion supporting USD, EUR, GBP, GHS, KES, SLL, NGN, and UGX.
- **Audit-Ready Reporting:** Single-click PDF and Excel export for donor audits and financial compliance checks.
- **Vendor Management:** Verified supplier registry with rating metrics, contract compliance status, and procurement histories.

### 📈 2. Monitoring & Evaluation (M&E) Indicators
- **LogFrame & Progress Metrics:** Track milestone targets, baselines, and actual field measurements in real time.
- **Voice Dictation Integration:** M&E officers can dictate field verification notes hands-free using the built-in Web Speech API integration.

### 🛰️ 3. Progressive Web App (PWA) & Offline Field Sync
- **Remote Connectivity:** Full Service Worker precaching (`vite-plugin-pwa`) and IndexedDB persistence (`idb-keyval`) for seamless operation in disconnected field sites.
- **Installable Desktop/Mobile App:** Native PWA install prompt (`beforeinstallprompt`) for mobile devices and tablets.
- **Live Sync Queue:** Offline banner indicating real-time connection status and queued operations awaiting connection recovery.

### 🤖 4. AI Intelligence (Google Gemini API)
- **Server-Side Security:** Secure proxy routes (`/api/*`) utilizing `@google/genai` to prevent exposure of API keys.
- **Automated Risk Analysis:** Smart project risk scoring, grant proposal evaluations, and automated donor compliance summaries.

### 🔍 5. Global Search (`⌘K` / `Ctrl+K`)
- **Instant Universal Lookup:** Search across projects, grant documents, verified vendors, and deliverable tasks.
- **Categorized Filtering & Keyboard Navigation:** Quick filter tabs (`Projects`, `Documents`, `Vendors`, `Tasks`) with keyboard navigation (`↑`, `↓`, `Enter`).

### ⏱️ 6. Timesheets & Field Activity Reporting
- **Activity Logs:** Drag-and-drop task timelines (`@dnd-kit`) with multi-step approval workflows (PM, Director, Auditor).
- **Voice Field Reports:** Hands-free voice dictation embedded directly into timesheet forms.

### 📦 7. Logistics, Inventory & Maintenance
- **Stock Management:** Monitor warehouse inventory, approve usage requests, and maintain equipment service records.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion (Framer Motion)
- **Data Visualization:** Recharts, D3
- **State & Backend:** Express.js (Node runtime), Firebase Auth, Cloud Firestore (Multi-tab offline cache)
- **AI Engine:** Google Gemini API (`@google/genai`)
- **Offline / PWA:** Workbox, `vite-plugin-pwa`, Web Speech API
- **Bundler & Build Tooling:** Vite 6, esbuild, `tsx`

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/milous-project.git
   cd milous-project
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env` and provide your credentials:
   ```bash
   cp .env.example .env
   ```

   In `.env`:
   ```env
   # Required for AI Features
   GEMINI_API_KEY="your_gemini_api_key_here"

   # App Base URL
   APP_URL="http://localhost:3000"

   # Optional Firebase Client Override
   VITE_FIREBASE_API_KEY="your_firebase_api_key"
   VITE_FIREBASE_AUTH_DOMAIN="your_project.firebaseapp.com"
   VITE_FIREBASE_PROJECT_ID="your_project_id"
   VITE_FIREBASE_STORAGE_BUCKET="your_project.firebasestorage.app"
   VITE_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
   VITE_FIREBASE_APP_ID="your_app_id"
   ```

4. **Seed Sample Firestore / Local Data (Optional):**
   ```bash
   npm run seed
   ```

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 📦 Deployment

### Production Build
To create a production-ready bundle with bundled CommonJS backend (`dist/server.cjs`):
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Deploying to Render
1. Create a **New Web Service** on [Render](https://render.com/).
2. Connect your GitHub repository.
3. Set the build configuration:
   - **Runtime:** `Node`
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
4. Under **Environment Variables**, add `GEMINI_API_KEY` and any custom `VITE_FIREBASE_*` keys.

---

## 🔒 Security & Best Practices

- **Zero Client-Exposed API Keys:** All Gemini AI calls are strictly routed through server-side Express handlers (`/api/*`).
- **Role-Based Access Control (RBAC):** Granular user permissions enforced across Program Managers, Financial Auditors, Field Officers, and Executives.
- **PWA HTTPS Compliance:** Full service worker and speech recognition compatibility when served over TLS/HTTPS.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
