import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, ShieldCheck, Award, Calendar, User, Search, BookOpen } from 'lucide-react';

interface VerifiedStudent {
  id: string;
  name: string;
  track: string;
  cohort: string;
  completionDate: string;
  attendanceRate: number;
  badgesEarned: string[];
  signatory: string;
  signatoryTitle: string;
  ledgerId: string;
}

const DEMO_VERIFIED_STUDENTS: Record<string, VerifiedStudent> = {
  'std-01': {
    id: 'std-01',
    name: 'Abena Osei',
    track: 'Web Development',
    cohort: 'Frontend Web Dev - TechFemale Hub',
    completionDate: '2026-07-15',
    attendanceRate: 96,
    badgesEarned: ['HTML5 Mastery', 'React Developer', 'Git Fundamentals'],
    signatory: 'Kwame Mensah',
    signatoryTitle: 'Executive Director, Milous Project',
    ledgerId: 'MIL-STD-01-COH-WEB-01'
  },
  'std-02': {
    id: 'std-02',
    name: 'Fatoumata Diallo',
    track: 'Web Development',
    cohort: 'Frontend Web Dev - TechFemale Hub',
    completionDate: '2026-07-15',
    attendanceRate: 98,
    badgesEarned: ['HTML5 Mastery', 'UI/UX Essentials', 'React Developer'],
    signatory: 'Kwame Mensah',
    signatoryTitle: 'Executive Director, Milous Project',
    ledgerId: 'MIL-STD-02-COH-WEB-01'
  },
  'std-03': {
    id: 'std-03',
    name: 'Kofi Mensah',
    track: 'Solar Installation',
    cohort: 'Off-Grid Solar Engineering Cohort A',
    completionDate: '2026-09-10',
    attendanceRate: 94,
    badgesEarned: ['PV Solar Basics', 'Electrical Systems Safety'],
    signatory: 'Kwame Mensah',
    signatoryTitle: 'Executive Director, Milous Project',
    ledgerId: 'MIL-STD-03-COH-SOLAR-01'
  },
  'std-04': {
    id: 'std-04',
    name: 'Sarah Alabi',
    track: 'Web Development',
    cohort: 'Frontend Web Dev - TechFemale Hub',
    completionDate: '2026-07-15',
    attendanceRate: 92,
    badgesEarned: ['HTML5 Mastery'],
    signatory: 'Kwame Mensah',
    signatoryTitle: 'Executive Director, Milous Project',
    ledgerId: 'MIL-STD-04-COH-WEB-01'
  },
  'std-05': {
    id: 'std-05',
    name: 'Kwame Boateng',
    track: 'Solar Installation',
    cohort: 'Off-Grid Solar Engineering Cohort A',
    completionDate: '2026-09-08',
    attendanceRate: 95,
    badgesEarned: ['PV Solar Basics', 'Inverter Systems Integration', 'Electrical Systems Safety'],
    signatory: 'Kwame Mensah',
    signatoryTitle: 'Executive Director, Milous Project',
    ledgerId: 'MIL-STD-05-COH-SOLAR-01'
  }
};

export const PublicVerify: React.FC = () => {
  const { certId } = useParams<{ certId: string }>();
  const [searchId, setSearchId] = useState('');
  const [student, setStudent] = useState<VerifiedStudent | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (certId) {
      // Find by matching standard ID or inside ledgerId format
      const normalized = certId.toLowerCase();
      const matchedKey = Object.keys(DEMO_VERIFIED_STUDENTS).find(key => {
        const item = DEMO_VERIFIED_STUDENTS[key];
        return item.id.toLowerCase() === normalized || item.ledgerId.toLowerCase() === normalized;
      });

      if (matchedKey) {
        setStudent(DEMO_VERIFIED_STUDENTS[matchedKey]);
      } else {
        setStudent(null);
      }
      setSearched(true);
    }
  }, [certId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId) return;

    const normalized = searchId.trim().toLowerCase();
    const matchedKey = Object.keys(DEMO_VERIFIED_STUDENTS).find(key => {
      const item = DEMO_VERIFIED_STUDENTS[key];
      return item.id.toLowerCase() === normalized || 
             item.ledgerId.toLowerCase() === normalized || 
             item.name.toLowerCase().includes(normalized);
    });

    if (matchedKey) {
      setStudent(DEMO_VERIFIED_STUDENTS[matchedKey]);
    } else {
      setStudent(null);
    }
    setSearched(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6 md:p-8 font-sans">
      <div className="max-w-2xl w-full mx-auto space-y-6 my-auto">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/60 rounded-full text-[10px] font-black tracking-wider uppercase">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Milous Decentralized Verification System</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Public Credential Ledger</h1>
          <p className="text-xs text-slate-400 font-semibold max-w-sm mx-auto">
            Tamper-proof online verification for vocational qualifications and technical skills cohorts.
          </p>
        </div>

        {/* Verification Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-6">
          
          {/* Quick Lookup Bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Enter Student ID, Name, or Ledger Hash..."
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>
            <button
              type="submit"
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black tracking-wide shadow-sm cursor-pointer transition"
            >
              Verify
            </button>
          </form>

          {searched ? (
            student ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                
                {/* Result Headline */}
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
                  <div className="p-2 bg-emerald-500 text-white rounded-xl">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-emerald-900 uppercase tracking-wide">Credential Verified</h3>
                    <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                      This certificate is authentic, non-repudiable, and fully registered in the Milous Impact Registry.
                    </p>
                  </div>
                </div>

                {/* Details Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Student Name</span>
                    <span className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-slate-500" />
                      {student.name}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Completed Program</span>
                    <span className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-slate-500" />
                      {student.track}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Active Training Cohort</span>
                    <span className="text-slate-800 font-bold block">{student.cohort}</span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Date of Graduation</span>
                    <span className="text-slate-800 font-mono font-bold flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      {student.completionDate}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Audited Attendance Rate</span>
                    <span className="text-slate-800 font-mono font-black">{student.attendanceRate}% Certified Attendance</span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Ledger Verification ID</span>
                    <span className="text-[10px] text-slate-500 font-mono font-bold select-all break-all">{student.ledgerId}</span>
                  </div>
                </div>

                {/* Earned Badges List */}
                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Endorsed Micro-Credential Competencies</span>
                  <div className="flex flex-wrap gap-1.5">
                    {student.badgesEarned.map(badge => (
                      <span key={badge} className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-2.5 py-1 rounded-xl">
                        <Award className="w-3 h-3 text-emerald-600" />
                        <span>{badge}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Authority Signature Info */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/80 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Authorized Signatory</span>
                    <span className="font-bold text-slate-800">{student.signatory}</span>
                    <span className="text-[10px] text-slate-400 block">{student.signatoryTitle}</span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-xs font-semibold animate-in fade-in duration-200">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <div>
                  <h3 className="text-xs font-black text-rose-900 uppercase tracking-wide">Verification Failed</h3>
                  <p className="text-[10px] text-rose-700 font-semibold mt-0.5">
                    No matching student or ledger ID found in the Milous certificate registry. Please verify the URL or input.
                  </p>
                </div>
              </div>
            )
          ) : (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <Award className="w-12 h-12 mx-auto text-slate-300 stroke-1" />
              <p className="text-xs font-bold">Please scan a QR code or enter a search query above to look up credential status.</p>
            </div>
          )}

        </div>

        {/* System Info Footer */}
        <div className="text-center text-[9px] font-mono font-bold text-slate-400 space-y-1">
          <p>© 2026 MILOUS SKILLS ACADEMY LEDGER • AUDITED DECENTRALIZED DATA</p>
          <p>
            <Link to="/login" className="text-emerald-600 hover:text-emerald-700 hover:underline">
              System Admin Console
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};
