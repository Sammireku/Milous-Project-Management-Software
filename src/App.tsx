import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FirestoreProvider } from './context/FirestoreContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';

// Page Components
import { Login } from './pages/Login';
import { Unauthorized } from './pages/Unauthorized';
import { Dashboard } from './pages/Dashboard';
import { KanbanBoard } from './pages/KanbanBoard';
import { Financials } from './pages/Financials';
import { Indicators } from './pages/Indicators';
import { Projects } from './pages/Projects';
import { AiRisks } from './pages/AiRisks';
import { SyncHealth } from './pages/SyncHealth';
import { DocumentHub } from './pages/DocumentHub';
import { Vendors } from './pages/Vendors';
import { Donors } from './pages/Donors';
import { MyTodoPage } from './pages/MyTodoPage';
import { CreatedByMePage } from './pages/CreatedByMePage';
import { CalendarsPage } from './pages/CalendarsPage';
import { StreamPage } from './pages/StreamPage';
import { StarredPage } from './pages/StarredPage';
import { ReportsPage } from './pages/ReportsPage';
import { ProjectsDashboardPage } from './pages/ProjectsDashboardPage';
import { TimesheetsPage } from './pages/TimesheetsPage';
import { TeamWorkloadPage } from './pages/TeamWorkloadPage';
import { WhiteboardPage } from './pages/WhiteboardPage';
import { AdminPanelPage } from './pages/AdminPanelPage';
import { ImpactAnalysisPage } from './pages/ImpactAnalysisPage';
import { ProposalDatabasePage } from './pages/ProposalDatabasePage';
import { MaintenancePage } from './pages/MaintenancePage';
import { StocksPage } from './pages/StocksPage';
import { SkillsManager } from './pages/SkillsManager';
import { PublicVerify } from './pages/PublicVerify';

export default function App() {
  return (
    <AuthProvider>
      <FirestoreProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/verify" element={<PublicVerify />} />
            <Route path="/verify/:certId" element={<PublicVerify />} />

            {/* Default Dashboard (My dashboard) */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Dashboard Alias */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Projects Dashboard */}
            <Route
              path="/projects-dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProjectsDashboardPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* My to-do */}
            <Route
              path="/my-todo"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MyTodoPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Created by me */}
            <Route
              path="/created-by-me"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CreatedByMePage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Calendars */}
            <Route
              path="/calendars"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CalendarsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Activity Stream */}
            <Route
              path="/stream"
              element={
                <ProtectedRoute>
                  <Layout>
                    <StreamPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Starred Tasks */}
            <Route
              path="/starred"
              element={
                <ProtectedRoute>
                  <Layout>
                    <StarredPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Reports & Summaries */}
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ReportsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Timesheets for M&E and Lower Team Members to fill and PM/Admin to approve */}
            <Route
              path="/timesheets"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TimesheetsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Team Workload & Capacity */}
            <Route
              path="/workload"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TeamWorkloadPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Whiteboard with Klaxoon, Stickies, Google Docs/Slides/Sheets */}
            <Route
              path="/whiteboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <WhiteboardPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Admin Panel for assigning logins, authorizations and roles */}
            <Route path="/admin" element={<Navigate to="/admin-panel" replace />} />
            <Route
              path="/admin-panel"
              element={
                <ProtectedRoute allowedRoles={['admin', 'ceo', 'System Admin', 'system admin']}>
                  <Layout>
                    <AdminPanelPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Tasks / Kanban Board */}
            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <Layout>
                    <KanbanBoard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            {/* Kanban Alias */}
            <Route
              path="/kanban"
              element={
                <ProtectedRoute>
                  <Layout>
                    <KanbanBoard />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Multi-Donor Financials & Grant Auditing (Allowed: admin, finance_officer, ceo, project_manager) */}
            <Route
              path="/financials"
              element={
                <ProtectedRoute allowedRoles={['admin', 'finance_officer', 'ceo', 'project_manager']}>
                  <Layout>
                    <Financials />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Vendor Procurement Database */}
            <Route
              path="/vendors"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Vendors />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Institutional Donor Directory */}
            <Route
              path="/donors"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Donors />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* M&E Indicators (Allowed: admin, project_manager, me_officer) */}
            <Route path="/indicators" element={<Navigate to="/me-indicators" replace />} />
            <Route
              path="/me-indicators"
              element={
                <ProtectedRoute allowedRoles={['admin', 'project_manager', 'me_officer']}>
                  <Layout>
                    <Indicators />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Projects & Grants Portfolio */}
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Projects />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Vertex AI Multimodal Document Risks */}
            <Route
              path="/ai-risks"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AiRisks />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Generative AI Document Drafter & Document Hub */}
            <Route
              path="/doc-hub"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DocumentHub />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Offline Sync Telemetry & Audit */}
            <Route
              path="/sync-health"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SyncHealth />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Impact Analysis & Data Collection */}
            <Route
              path="/impact-analysis"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ImpactAnalysisPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Skills Academy & Impact Manager */}
            <Route
              path="/skills-manager"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SkillsManager />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Grant Proposal Database */}
            <Route
              path="/proposals"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProposalDatabasePage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Maintenance & Equipment Tracking */}
            <Route
              path="/maintenance"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MaintenancePage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Stocks & Inventory */}
            <Route
              path="/stocks"
              element={
                <ProtectedRoute>
                  <Layout>
                    <StocksPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </FirestoreProvider>
    </AuthProvider>
  );
}
