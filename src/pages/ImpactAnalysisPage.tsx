import React, { useState } from 'react';
import { useFirestore } from '../context/FirestoreContext';
import { useAuth } from '../context/AuthContext';
import { 
  HeartHandshake, 
  Plus, 
  Search, 
  Mic, 
  Square, 
  UploadCloud, 
  FileText, 
  Smile, 
  Meh, 
  Frown, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  FolderKanban, 
  Sparkles, 
  Clock, 
  Filter, 
  ChevronDown, 
  Volume2, 
  Eye, 
  X, 
  ShieldCheck, 
  Download,
  Users
} from 'lucide-react';
import { ImpactAssessment } from '../types';

export const ImpactAnalysisPage: React.FC = () => {
  const { projects, impactAssessments, createImpactAssessment } = useFirestore();
  const { currentUser } = useAuth();

  const isExecutiveOrPM = 
    currentUser?.role === 'admin' || 
    currentUser?.role === 'ceo' || 
    currentUser?.role === 'project_manager';

  // Form State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(projects[0]?.id || '');
  const [beneficiaryNames, setBeneficiaryNames] = useState('');
  const [frequency, setFrequency] = useState<'WEEKLY' | 'MONTHLY' | 'QUARTERLY'>('WEEKLY');
  const [sentiment, setSentiment] = useState<'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'CONCERN'>('POSITIVE');
  const [sentimentScore, setSentimentScore] = useState<number>(5);
  const [progressNarrative, setProgressNarrative] = useState('');
  const [constraints, setConstraints] = useState('');
  const [improvements, setImprovements] = useState('');
  const [observations, setObservations] = useState('');

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [hasAudioRecorded, setHasAudioRecorded] = useState(false);
  const [audioTranscript, setAudioTranscript] = useState('');

  // OCR Image-to-Text State
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrResultText, setOcrResultText] = useState('');
  const [uploadedImageName, setUploadedImageName] = useState('');

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('ALL');
  const [filterFrequency, setFilterFrequency] = useState('ALL');
  const [filterSentiment, setFilterSentiment] = useState('ALL');
  const [viewDetailModal, setViewDetailModal] = useState<ImpactAssessment | null>(null);

  // Audio recording simulation timer
  React.useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingDuration(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleStartRecording = () => {
    setIsRecording(true);
    setHasAudioRecorded(false);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setHasAudioRecorded(true);
    const mockTranscripts = [
      'Beneficiary focus group report: "The clean water pressure is consistent every morning. Diarrheal incidences among schoolchildren have dropped noticeably."',
      'Community meeting recording: "The committee has already collected 450 GHS for borehole maintenance savings. They requested an additional tap stand near the market."',
      'Health post interview: "Mothers are no longer walking 4 kilometers to fetch stream water. The clinic has reliable running water for child delivery."',
    ];
    const generatedTranscript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
    setAudioTranscript(generatedTranscript);
    setObservations((prev) => (prev ? `${prev}\n\n[Transcribed Audio]: ${generatedTranscript}` : `[Transcribed Audio]: ${generatedTranscript}`));
  };

  const handleSimulateOcrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedImageName(file.name);
    setIsOcrProcessing(true);

    setTimeout(() => {
      setIsOcrProcessing(false);
      const extractedOcr = `Field Log OCR [${file.name}]: Verified 125 household registrations. 94% water safety index. Verified signed handover certificate by local Assemblyman.`;
      setOcrResultText(extractedOcr);
      setObservations((prev) => (prev ? `${prev}\n\n[Image OCR Extraction]: ${extractedOcr}` : `[Image OCR Extraction]: ${extractedOcr}`));
    }, 1200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!beneficiaryNames.trim() || !selectedProject) return;

    const proj = projects.find((p) => p.id === selectedProject);

    await createImpactAssessment({
      beneficiaryNames: beneficiaryNames.trim(),
      projectId: selectedProject,
      projectName: proj?.title || 'General Community Project',
      frequency,
      sentiment,
      sentimentScore,
      progressNarrative: progressNarrative.trim(),
      constraints: constraints.trim(),
      improvements: improvements.trim(),
      observations: observations.trim(),
      audioRecorded: hasAudioRecorded,
      audioTranscript: audioTranscript || undefined,
      imageUploaded: !!uploadedImageName,
      imageOcrText: ocrResultText || undefined,
      submittedBy: currentUser?.displayName || 'Field Officer',
      submittedByRole: currentUser?.role || 'field_officer',
      status: 'SUBMITTED',
    });

    // Reset Form
    setBeneficiaryNames('');
    setProgressNarrative('');
    setConstraints('');
    setImprovements('');
    setObservations('');
    setHasAudioRecorded(false);
    setAudioTranscript('');
    setUploadedImageName('');
    setOcrResultText('');
    setIsCreateModalOpen(false);
  };

  // Filtered Assessments
  const filteredList = impactAssessments.filter((item) => {
    const matchSearch =
      item.beneficiaryNames.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.progressNarrative.toLowerCase().includes(searchTerm.toLowerCase());
    const matchProject = filterProject === 'ALL' || item.projectId === filterProject;
    const matchFreq = filterFrequency === 'ALL' || item.frequency === filterFrequency;
    const matchSentiment = filterSentiment === 'ALL' || item.sentiment === filterSentiment;
    return matchSearch && matchProject && matchFreq && matchSentiment;
  });

  const totalPositive = impactAssessments.filter((i) => i.sentiment === 'POSITIVE').length;
  const totalConcern = impactAssessments.filter((i) => i.sentiment === 'CONCERN' || i.sentiment === 'NEGATIVE').length;
  const avgScore = impactAssessments.length > 0 
    ? (impactAssessments.reduce((acc, curr) => acc + curr.sentimentScore, 0) / impactAssessments.length).toFixed(1)
    : '5.0';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Impact Analysis & Field Data Collection</h1>
              <p className="text-xs text-slate-500">
                Direct community beneficiary feedback, multimedia observation notes, and AI-enabled audio/OCR parsing.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {isExecutiveOrPM && (
            <div className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Executive & PM Access Granted</span>
            </div>
          )}

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center space-x-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Record Field Assessment</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Assessments Logged</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-slate-900">{impactAssessments.length}</span>
            <span className="text-xs text-emerald-600 font-semibold">Active validation</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Avg Beneficiary Sentiment</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-emerald-600">{avgScore} / 5.0</span>
            <Smile className="w-4 h-4 text-emerald-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Positive Validations</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-slate-900">{totalPositive}</span>
            <span className="text-xs text-slate-500 font-medium">community endorsements</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Constraints & Action Items</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-amber-600">{totalConcern}</span>
            <span className="text-xs text-amber-600 font-medium">under PM review</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by beneficiary name, project or observation..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Project Filter */}
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>

          {/* Frequency Filter */}
          <select
            value={filterFrequency}
            onChange={(e) => setFilterFrequency(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Frequencies</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
            <option value="QUARTERLY">Quarterly</option>
          </select>

          {/* Sentiment Filter */}
          <select
            value={filterSentiment}
            onChange={(e) => setFilterSentiment(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Sentiments</option>
            <option value="POSITIVE">Positive</option>
            <option value="NEUTRAL">Neutral</option>
            <option value="CONCERN">Concern / Constraint</option>
          </select>
        </div>
      </div>

      {/* Assessment Table / List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Beneficiary / Group</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Frequency</th>
                <th className="py-3 px-4">Sentiment</th>
                <th className="py-3 px-4">Progress Narrative</th>
                <th className="py-3 px-4">Media Evidence</th>
                <th className="py-3 px-4">Submitted By</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    <div className="flex items-center space-x-2">
                      <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{item.beneficiaryNames}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700 max-w-[180px] truncate">
                    {item.projectName}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-600 text-[10px]">
                      {item.frequency}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      item.sentiment === 'POSITIVE' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : item.sentiment === 'CONCERN' 
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}>
                      {item.sentiment === 'POSITIVE' && <Smile className="w-3 h-3 text-emerald-600" />}
                      {item.sentiment === 'NEUTRAL' && <Meh className="w-3 h-3 text-slate-500" />}
                      {item.sentiment === 'CONCERN' && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                      <span>{item.sentiment} ({item.sentimentScore}/5)</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 max-w-[260px] truncate text-slate-600">
                    {item.progressNarrative || item.observations || 'No additional commentary'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-1.5">
                      {item.audioRecorded && (
                        <span className="p-1 rounded bg-blue-50 text-blue-600 border border-blue-200" title="Audio Interview Recorded">
                          <Volume2 className="w-3.5 h-3.5" />
                        </span>
                      )}
                      {item.imageUploaded && (
                        <span className="p-1 rounded bg-purple-50 text-purple-600 border border-purple-200" title="Image / OCR Attached">
                          <FileText className="w-3.5 h-3.5" />
                        </span>
                      )}
                      {!item.audioRecorded && !item.imageUploaded && (
                        <span className="text-[10px] text-slate-400">Written notes</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    <div className="font-semibold text-slate-700">{item.submittedBy}</div>
                    <div className="text-[10px] text-slate-400">{new Date(item.submittedAt).toLocaleDateString()}</div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setViewDetailModal(item)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center space-x-1 ml-auto"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))}

              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400 text-xs">
                    No beneficiary impact assessments match your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Field Assessment Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <HeartHandshake className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Record Beneficiary Impact Assessment</h3>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Beneficiary Names & Project */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Beneficiary Names / Group *
                  </label>
                  <input
                    type="text"
                    required
                    value={beneficiaryNames}
                    onChange={(e) => setBeneficiaryNames(e.target.value)}
                    placeholder="e.g. Ejisu Women Water Committee (45 Households)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Linked Project *
                  </label>
                  <select
                    required
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Frequency & Sentiment */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Assessment Frequency *
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
                  >
                    <option value="WEEKLY">Weekly Feedback</option>
                    <option value="MONTHLY">Monthly Audit</option>
                    <option value="QUARTERLY">Quarterly Milestone</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Sentiment Rating *
                  </label>
                  <select
                    value={sentiment}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setSentiment(val);
                      setSentimentScore(val === 'POSITIVE' ? 5 : val === 'NEUTRAL' ? 3 : 2);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
                  >
                    <option value="POSITIVE">Positive (Satisfied)</option>
                    <option value="NEUTRAL">Neutral (Acceptable)</option>
                    <option value="CONCERN">Concern / Constraint</option>
                    <option value="NEGATIVE">Negative (Action Needed)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Score (1 - 5)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={sentimentScore}
                    onChange={(e) => setSentimentScore(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* Assessments: Progress, Constraints, Improvements */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Progress Narrative
                  </label>
                  <textarea
                    rows={2}
                    value={progressNarrative}
                    onChange={(e) => setProgressNarrative(e.target.value)}
                    placeholder="Describe observable changes, water access uptime, health improvements..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Constraints / Obstacles
                    </label>
                    <textarea
                      rows={2}
                      value={constraints}
                      onChange={(e) => setConstraints(e.target.value)}
                      placeholder="e.g. Inverter surge, transportation challenges, tariff delays..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Recommended Improvements
                    </label>
                    <textarea
                      rows={2}
                      value={improvements}
                      onChange={(e) => setImprovements(e.target.value)}
                      placeholder="e.g. Additional tap stands, community training workshop..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Multi-modal Observations (Audio transcription + Image OCR) */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-800 uppercase flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Multimedia Observation Tools (Audio Transcription & Image OCR)</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Audio Tool */}
                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 block">Voice Note Recording</span>
                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={handleStartRecording}
                        className="w-full py-2 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold flex items-center justify-center space-x-1.5 transition"
                      >
                        <Mic className="w-3.5 h-3.5" />
                        <span>Start Audio Recording</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleStopRecording}
                        className="w-full py-2 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold flex items-center justify-center space-x-1.5 transition animate-pulse"
                      >
                        <Square className="w-3.5 h-3.5" />
                        <span>Stop & Transcribe ({recordingDuration}s)</span>
                      </button>
                    )}
                    {hasAudioRecorded && (
                      <span className="text-[10px] text-emerald-600 font-semibold block">
                        ✓ Transcribed and appended to observations!
                      </span>
                    )}
                  </div>

                  {/* OCR Tool */}
                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 block">Image-to-Text / Photo OCR</span>
                    <label className="w-full py-2 px-3 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold flex items-center justify-center space-x-1.5 cursor-pointer transition">
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>{isOcrProcessing ? 'Extracting text...' : 'Upload Inspection Tag / Log'}</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleSimulateOcrUpload}
                        className="hidden"
                      />
                    </label>
                    {uploadedImageName && (
                      <span className="text-[10px] text-purple-600 font-semibold block truncate">
                        ✓ Extracted text from {uploadedImageName}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Compiled Field Observations
                  </label>
                  <textarea
                    rows={3}
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="General observations, direct community quotes, physical borehole condition..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit & Notify Leadership</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Detail Modal */}
      {viewDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{viewDetailModal.beneficiaryNames}</h3>
                <span className="text-xs text-slate-500">{viewDetailModal.projectName}</span>
              </div>
              <button onClick={() => setViewDetailModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <div className="flex items-center space-x-3">
                <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-[10px] text-slate-600">
                  {viewDetailModal.frequency}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 font-bold text-[10px] text-emerald-800">
                  {viewDetailModal.sentiment} ({viewDetailModal.sentimentScore}/5)
                </span>
                <span className="text-slate-400 text-[11px]">
                  Logged by {viewDetailModal.submittedBy} on {new Date(viewDetailModal.submittedAt).toLocaleDateString()}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-200">
                <span className="font-bold text-[11px] text-slate-800 block uppercase">Progress Narrative</span>
                <p className="text-slate-600">{viewDetailModal.progressNarrative}</p>
              </div>

              {viewDetailModal.constraints && (
                <div className="p-3 bg-amber-50/50 rounded-xl space-y-1 border border-amber-200">
                  <span className="font-bold text-[11px] text-amber-800 block uppercase">Constraints & Obstacles</span>
                  <p className="text-amber-900">{viewDetailModal.constraints}</p>
                </div>
              )}

              {viewDetailModal.improvements && (
                <div className="p-3 bg-blue-50/50 rounded-xl space-y-1 border border-blue-200">
                  <span className="font-bold text-[11px] text-blue-800 block uppercase">Recommended Improvements</span>
                  <p className="text-blue-900">{viewDetailModal.improvements}</p>
                </div>
              )}

              {viewDetailModal.observations && (
                <div className="p-3 bg-slate-50 rounded-xl space-y-1 border border-slate-200">
                  <span className="font-bold text-[11px] text-slate-800 block uppercase">Observations & Evidence</span>
                  <p className="text-slate-600 whitespace-pre-wrap font-mono text-[11px]">{viewDetailModal.observations}</p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setViewDetailModal(null)}
                className="px-4 py-2 bg-slate-800 text-white font-semibold rounded-lg text-xs hover:bg-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
