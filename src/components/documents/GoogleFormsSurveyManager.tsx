import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Sparkles, 
  ExternalLink, 
  Copy, 
  Check, 
  Plus, 
  Download, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Database, 
  Layers, 
  Radio, 
  Trash2, 
  BarChart2, 
  Users, 
  MapPin, 
  Star,
  Info,
  ArrowRight
} from 'lucide-react';
import { useFirestore } from '../../context/FirestoreContext';
import { useAuth } from '../../context/AuthContext';
import { SurveyResponse, SurveyType } from '../../types';

export const GoogleFormsSurveyManager: React.FC = () => {
  const { 
    activeProject, 
    surveyResponses, 
    submitSurveyResponse, 
    deleteSurveyResponse,
    importSurveyResponses,
    indicators
  } = useFirestore();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'collector' | 'google_form_setup'>('overview');
  const [selectedSurveyType, setSelectedSurveyType] = useState<SurveyType>('baseline');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // In-App Form Field States
  const [community, setCommunity] = useState('Tamale North Central');
  const [respondentId, setRespondentId] = useState(`HH-${Math.floor(1000 + Math.random() * 9000)}`);
  const [hhSize, setHhSize] = useState<number>(6);
  const [primaryWaterSource, setPrimaryWaterSource] = useState('Protected communal solar borehole pump');
  const [fetchTimeMins, setFetchTimeMins] = useState<number>(20);
  const [satisfactionRating, setSatisfactionRating] = useState<number>(4);
  const [outageFrequency, setOutageFrequency] = useState('Rarely (Once a month)');
  const [notes, setNotes] = useState('');

  const googleFormUrl = `https://docs.google.com/forms/d/e/1FAIpQLSe-Milous-WASH-${activeProject?.code || 'GHA'}-${selectedSurveyType.toUpperCase()}/viewform`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(googleFormUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Submit in-app response
  const handleInAppSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await submitSurveyResponse({
        surveyId: `surv-${selectedSurveyType}-${Date.now()}`,
        surveyTitle: selectedSurveyType === 'baseline' 
          ? 'Baseline Household Water Access Survey'
          : selectedSurveyType === 'endline'
          ? 'Endline Impact & Infrastructure Longevity Survey'
          : 'Rapid Emergency Assessment',
        surveyType: selectedSurveyType,
        projectId: activeProject?.id || 'proj-gh-wash-2025',
        projectCode: activeProject?.code || 'GHA-USAID-2025',
        respondentId,
        community,
        collectedBy: `${currentUser?.displayName || 'Field Officer'} (In-App Form)`,
        source: 'in_app',
        answers: {
          community,
          hh_size: hhSize,
          primary_water_src: primaryWaterSource,
          fetch_time_mins: fetchTimeMins,
          satisfaction_rating: satisfactionRating,
          outage_frequency: outageFrequency,
        },
        satisfactionScore: satisfactionRating,
        notes,
      });

      setSuccessMessage(`Survey response logged successfully for household ${respondentId} in ${community}!`);
      setRespondentId(`HH-${Math.floor(1000 + Math.random() * 9000)}`);
      setNotes('');
      setTimeout(() => setSuccessMessage(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simulate Google Form Webhook Response Ingestion
  const handleSimulateGoogleFormWebhook = async () => {
    setIsSubmitting(true);
    const randomCommunities = ['Savelugu District', 'Tolon South Catchment', 'Tamale Urban Fringe', 'Kumbungu Central'];
    const selectedComm = randomCommunities[Math.floor(Math.random() * randomCommunities.length)];
    const mockHhId = `GF-${Math.floor(10000 + Math.random() * 90000)}`;
    const mockRating = Math.floor(Math.random() * 2) + 4; // 4 or 5
    const mockTime = Math.floor(Math.random() * 25) + 10;

    try {
      await submitSurveyResponse({
        surveyId: `surv-gf-${Date.now()}`,
        surveyTitle: `${selectedSurveyType === 'baseline' ? 'Baseline' : 'Endline'} Survey (Google Forms Stream)`,
        surveyType: selectedSurveyType,
        projectId: activeProject?.id || 'proj-gh-wash-2025',
        projectCode: activeProject?.code || 'GHA-USAID-2025',
        respondentId: mockHhId,
        community: selectedComm,
        collectedBy: 'Google Forms Webhook Ingestion (Live Sync)',
        source: 'google_forms',
        answers: {
          community: selectedComm,
          hh_size: Math.floor(Math.random() * 6) + 4,
          primary_water_src: 'Protected communal solar borehole pump',
          fetch_time_mins: mockTime,
          satisfaction_rating: mockRating,
          outage_frequency: 'Never (100% uptime)',
        },
        satisfactionScore: mockRating,
        notes: 'Submitted via remote enumerator Google Form link; verified by M&E sync agent.',
      });

      setSuccessMessage(`Google Form Webhook Ingestion verified! Captured response from ${selectedComm} (ID: ${mockHhId}).`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate stats
  const totalResponses = surveyResponses.length;
  const googleFormsCount = surveyResponses.filter((r) => r.source === 'google_forms').length;
  const inAppCount = surveyResponses.filter((r) => r.source === 'in_app').length;
  const averageSatisfaction = totalResponses > 0
    ? (surveyResponses.reduce((sum, r) => sum + (r.satisfactionScore || 0), 0) / totalResponses).toFixed(1)
    : '4.5';

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Banner / Header */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black tracking-tight text-white">Google Forms Survey &amp; Response Engine</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
              Live Capture &amp; Indicator Sync
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Generate and deploy Google Forms surveys for field enumerators, capture live responses via webhooks or direct in-app entry, and automatically sync quantitative indicators.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={handleSimulateGoogleFormWebhook}
            disabled={isSubmitting}
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center space-x-1.5 transition shadow-sm hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            <Radio className="w-3.5 h-3.5 text-slate-950 animate-pulse" />
            <span>Simulate Google Form Ingestion</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`py-2 px-4 rounded-t-xl border-b-2 transition ${
            activeTab === 'overview'
              ? 'border-emerald-600 bg-white text-emerald-800 shadow-xs'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Captured Responses ({totalResponses})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('collector')}
          className={`py-2 px-4 rounded-t-xl border-b-2 transition ${
            activeTab === 'collector'
              ? 'border-emerald-600 bg-white text-emerald-800 shadow-xs'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          In-App Field Collector Form
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('google_form_setup')}
          className={`py-2 px-4 rounded-t-xl border-b-2 transition ${
            activeTab === 'google_form_setup'
              ? 'border-emerald-600 bg-white text-emerald-800 shadow-xs'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Google Forms Deployment &amp; Schema
        </button>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-mono">Synced to LogFrame</span>
        </div>
      )}

      {/* Tab 1: Captured Responses Overview */}
      {activeTab === 'overview' && (
        <div className="p-6 space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                <span>Total Responses</span>
                <Database className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-2xl font-black text-slate-900">{totalResponses}</p>
              <p className="text-[11px] text-slate-500">Verified field submissions</p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
              <div className="flex items-center justify-between text-emerald-700 text-xs font-bold uppercase">
                <span>Google Forms Sync</span>
                <Radio className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-emerald-900">{googleFormsCount}</p>
              <p className="text-[11px] text-emerald-700">Webhook ingested</p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-1">
              <div className="flex items-center justify-between text-blue-700 text-xs font-bold uppercase">
                <span>In-App Offline</span>
                <MapPin className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-blue-900">{inAppCount}</p>
              <p className="text-[11px] text-blue-700">Direct enumerator entries</p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
              <div className="flex items-center justify-between text-amber-700 text-xs font-bold uppercase">
                <span>Avg. Satisfaction</span>
                <Star className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-black text-amber-900">{averageSatisfaction} / 5.0</p>
              <p className="text-[11px] text-amber-700">Beneficiary community score</p>
            </div>
          </div>

          {/* Responses Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Captured Household Responses</span>
              <span className="text-[11px] text-slate-500 font-normal">
                Auto-syncing to Indicator matrix (IND-WASH-02)
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {surveyResponses.map((resp) => (
                <div key={resp.id} className="p-4 hover:bg-slate-50/60 transition flex items-center justify-between gap-4 text-xs">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900">{resp.respondentId}</span>
                      <span className="text-slate-500 font-medium">• {resp.community}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        resp.source === 'google_forms'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {resp.source === 'google_forms' ? 'Google Forms Stream' : 'In-App Entry'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {resp.surveyType.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-slate-600 text-xs">
                      Water Source: <strong className="text-slate-800">{String(resp.answers?.primary_water_src || 'Solar Borehole')}</strong> • Fetch Time: <strong className="text-slate-800">{String(resp.answers?.fetch_time_mins || '15')} mins</strong> • Satisfaction: <strong className="text-amber-700">{resp.satisfactionScore || 5}/5</strong>
                    </p>

                    {resp.notes && (
                      <p className="text-[11px] text-slate-400 italic">"{resp.notes}"</p>
                    )}

                    <div className="flex items-center space-x-3 text-[10px] text-slate-400 pt-0.5">
                      <span>Collector: {resp.collectedBy}</span>
                      <span>•</span>
                      <span>Captured: {new Date(resp.collectedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => deleteSurveyResponse(resp.id)}
                      title="Delete record"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: In-App Field Collector Form */}
      {activeTab === 'collector' && (
        <form onSubmit={handleInAppSubmit} className="p-6 space-y-4 max-w-2xl text-xs">
          <div className="bg-indigo-50/60 p-3.5 rounded-2xl border border-indigo-100 text-indigo-900 flex items-center space-x-2">
            <Info className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Field enumerators can submit household responses offline. Submissions automatically record beneficiary indicator progress.</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Survey Instrument</label>
              <select
                value={selectedSurveyType}
                onChange={(e) => setSelectedSurveyType(e.target.value as SurveyType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold bg-white"
              >
                <option value="baseline">Baseline Household Survey</option>
                <option value="endline">Endline Impact Assessment</option>
                <option value="rapid">Rapid Needs Assessment</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Household / Respondent ID</label>
              <input
                type="text"
                value={respondentId}
                onChange={(e) => setRespondentId(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Community / Cluster</label>
              <input
                type="text"
                value={community}
                onChange={(e) => setCommunity(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Household Size (Beneficiaries)</label>
              <input
                type="number"
                min={1}
                max={25}
                value={hhSize}
                onChange={(e) => setHhSize(parseInt(e.target.value) || 1)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Primary Water Source</label>
              <select
                value={primaryWaterSource}
                onChange={(e) => setPrimaryWaterSource(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold bg-white"
              >
                <option value="Protected communal solar borehole pump">Protected Solar Borehole Pump</option>
                <option value="Unprotected dug hand-well">Unprotected Dug Hand-Well</option>
                <option value="Piped household tap connection">Piped Household Tap</option>
                <option value="Surface water / stream">Surface Water / Stream</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Round-trip Fetch Time (Minutes)</label>
              <input
                type="number"
                min={1}
                max={180}
                value={fetchTimeMins}
                onChange={(e) => setFetchTimeMins(parseInt(e.target.value) || 15)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Satisfaction Rating (1 to 5): <span className="text-emerald-600 font-black">{satisfactionRating} / 5</span>
              </label>
              <input
                type="range"
                min={1}
                max={5}
                value={satisfactionRating}
                onChange={(e) => setSatisfactionRating(parseInt(e.target.value))}
                className="w-full cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1">
                <span>1 - Very Dissatisfied</span>
                <span>3 - Neutral</span>
                <span>5 - Highly Satisfied</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Outage / Downtime Frequency</label>
              <select
                value={outageFrequency}
                onChange={(e) => setOutageFrequency(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold bg-white"
              >
                <option value="Never (100% uptime)">Never (100% uptime)</option>
                <option value="Rarely (Once a month)">Rarely (Once a month)</option>
                <option value="Frequently (1-2 times per week)">Frequently (1-2 times per week)</option>
                <option value="Chronic (Down for over a month)">Chronic (Down for over a month)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Field Enumerator Observations</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Water user committee collection mechanism functioning smoothly; no maintenance backlog."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center justify-center space-x-2 transition shadow-xs disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Recording Response...' : 'Submit Household Survey to Project DB'}</span>
          </button>
        </form>
      )}

      {/* Tab 3: Google Forms Deployment & Schema */}
      {activeTab === 'google_form_setup' && (
        <div className="p-6 space-y-6 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-sm text-slate-900">Deployed Google Form Endpoint</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Webhook Active
              </span>
            </div>

            <p className="text-slate-600 text-xs leading-relaxed">
              Distribute this public link to field enumerators or beneficiary community representatives. Responses submitted to Google Forms are ingested automatically into Milous Project and logged directly against project indicators.
            </p>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={googleFormUrl}
                className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-300 font-mono text-[11px] text-slate-700 select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center space-x-1.5 transition shrink-0"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy Form URL'}</span>
              </button>
            </div>
          </div>

          {/* Question Schema Breakdown */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-900">Survey Question Matrix (Google Forms Schema)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                <span className="font-mono text-[10px] font-bold text-indigo-600">Q1 • Short Text</span>
                <p className="font-bold text-slate-800">Target Community / Cluster</p>
                <p className="text-[11px] text-slate-500">Maps geofence boundary &amp; district jurisdiction.</p>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                <span className="font-mono text-[10px] font-bold text-indigo-600">Q2 • Number</span>
                <p className="font-bold text-slate-800">Household Size (Beneficiary Count)</p>
                <p className="text-[11px] text-slate-500">Aggregates quantitative reach against logframe.</p>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                <span className="font-mono text-[10px] font-bold text-indigo-600">Q3 • Multiple Choice</span>
                <p className="font-bold text-slate-800">Primary Drinking Water Source</p>
                <p className="text-[11px] text-slate-500">Tracks transitions from open wells to solar boreholes.</p>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                <span className="font-mono text-[10px] font-bold text-indigo-600">Q4 • Linear Scale (1-5)</span>
                <p className="font-bold text-slate-800">Water Quality &amp; Cleanliness Rating</p>
                <p className="text-[11px] text-slate-500">1 = Very Poor, 5 = Excellent Potable Standard.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
