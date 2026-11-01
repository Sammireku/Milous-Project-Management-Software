# Deploying Milous Project to Render 🚀

This guide provides step-by-step instructions to deploy the **Milous Project Enterprise Workstation** to [Render](https://render.com).

---

## 🏗️ Architecture Overview

The application uses a full-stack Node.js Express server + React SPA bundle:
- **Frontend**: React 19 + TypeScript + Tailwind CSS (bundled via Vite)
- **Backend API**: Node.js + Express (`server.ts`, bundled via `esbuild` to `dist/server.cjs`)
- **API Health Check**: `/api/health`
- **Port**: Default `3000` (configurable via `PORT` environment variable)

---

## ⚡ Option 1: One-Click Render Blueprint Deployment (Recommended)

1. **Push Repository to GitHub or GitLab**.
2. Log into your **[Render Dashboard](https://dashboard.render.com)**.
3. Click **New +** in the top right and select **Blueprint**.
4. Connect your repository containing the `render.yaml` file.
5. Render will automatically detect the configuration:
   - **Service Name**: `milous-project-app`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
6. Add your optional **`GEMINI_API_KEY`** in the Environment Variables section if using Google Gemini AI features.
7. Click **Apply**. Render will build and deploy your application automatically!

---

## 🛠️ Option 2: Manual Web Service Setup

If you prefer to configure the Web Service manually on Render:

1. Go to **[Render Dashboard](https://dashboard.render.com)**.
2. Click **New +** → **Web Service**.
3. Select **Build and deploy from a Git repository** and pick your repo.
4. Fill out the service settings:
   - **Name**: `milous-project-app` (or your preferred app name)
   - **Region**: Choose the region closest to your primary users (e.g., Oregon, Frankfurt, Singapore)
   - **Branch**: `main`
   - **Root Directory**: Leave blank (root)
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (or `Starter` for production workloads)

5. **Configure Environment Variables**:
   Click **Advanced** → **Add Environment Variable**:
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Sets Node environment mode |
   | `PORT` | `3000` | Web server listening port |
   | `GEMINI_API_KEY` | `AIzaSy...` | *(Optional)* Google Gemini AI API Key |

6. **Configure Health Check**:
   - Set **Health Check Path**: `/api/health`

7. Click **Create Web Service**.

---

## 🔄 Verify Your Deployment

Once Render completes the build process:
1. Open the generated Render URL (e.g., `https://milous-project-app.onrender.com`).
2. Test the `/api/health` endpoint to ensure the Express backend is running (`{"status":"ok"}`).
3. Test `Cmd+K` global command palette search across tasks, projects, and documents.
4. Open the **Projects** page and click **Timeline Gantt** to explore critical path visualization!

---

## 🐞 Troubleshooting

- **Build Failures**: Check build logs in Render. Ensure `npm run build` succeeds locally first by running `npm run build`.
- **Port Binding Error**: Render sets the `PORT` environment variable dynamically. The app automatically reads `process.env.PORT || 3000`.
- **API Key Missing**: If AI document drafting or summarizer uses fallback local templates, ensure `GEMINI_API_KEY` is saved in your Render Environment settings.
