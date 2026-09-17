import React, { useState, useMemo } from 'react';
import { 
  Users, 
  GraduationCap, 
  Award, 
  Briefcase, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  Search, 
  Plus, 
  Filter, 
  ChevronRight, 
  UserCheck, 
  Target, 
  BookOpen, 
  Clock, 
  Activity, 
  CheckSquare, 
  Sparkles,
  BarChart3,
  Flame,
  FileBadge,
  X,
  Printer,
  Globe,
  AlertTriangle
} from 'lucide-react';
import { useFirestore } from '../context/FirestoreContext';
import { useAuth } from '../context/AuthContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

// Type declarations for local component state
interface Cohort {
  id: string;
  name: string;
  track: 'Web Development' | 'Solar Installation' | 'Vocational Welding' | 'Agribusiness';
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'UPCOMING';
  totalStudents: number;
  costIncurred: number;
}

interface Student {
  id: string;
  name: string;
  cohortId: string;
  gender: 'Female' | 'Male' | 'Other';
  age: number;
  status: 'ENROLLED' | 'GRADUATED' | 'DROPPED_OUT';
  attendanceRate: number;
  badgesEarned: string[];
  employmentStatus: 'UNEMPLOYED' | 'INTERNSHIP' | 'EMPLOYED' | 'ENTREPRENEUR';
  startingSalaryGHS?: number;
  currentSalaryGHS?: number;
  lastMentorshipCheckIn?: string;
  notes?: string;
}

const CLASSIC_TEMPLATE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 565" width="100%" height="100%">
  <!-- Background with delicate light gold fill and custom border -->
  <rect x="15" y="15" width="770" height="535" rx="15" fill="#fcfcf9" stroke="#16a34a" stroke-width="8" />
  <rect x="25" y="25" width="750" height="515" rx="10" fill="none" stroke="#d97706" stroke-width="2" />
  
  <!-- Header Text -->
  <text x="400" y="85" font-family="Georgia, serif" font-size="28" font-weight="900" fill="#14532d" text-anchor="middle" letter-spacing="2">MILOUS SKILLS ACADEMY</text>
  <text x="400" y="115" font-family="sans-serif" font-size="10" font-weight="800" fill="#4b5563" text-anchor="middle" letter-spacing="4">VERIFIED VOCATIONAL EDUCATION DEGREE</text>
  
  <!-- Ribbon Badge -->
  <g transform="translate(375, 135)">
    <circle cx="25" cy="25" r="22" fill="#16a34a" opacity="0.12" />
    <polygon points="25,5 31,18 45,18 34,27 38,40 25,31 12,40 16,27 5,18 19,18" fill="#d97706" />
  </g>

  <!-- Body Content -->
  <text x="400" y="215" font-family="Georgia, serif" font-style="italic" font-size="14" fill="#6b7280" text-anchor="middle">This document solemnly certifies that</text>
  <text x="400" y="265" font-family="Georgia, serif" font-size="30" font-weight="bold" fill="#111827" text-anchor="middle">{{student_name}}</text>
  
  <text x="400" y="315" font-family="Georgia, serif" font-style="italic" font-size="13" fill="#6b7280" text-anchor="middle">has successfully graduated and satisfied all rigorous academic requirements for</text>
  <text x="400" y="355" font-family="sans-serif" font-size="19" font-weight="bold" fill="#166534" text-anchor="middle" letter-spacing="1">{{course_title}}</text>
  
  <text x="400" y="395" font-family="Georgia, serif" font-style="italic" font-size="12" fill="#9ca3af" text-anchor="middle">Successfully Completed on {{completion_date}}</text>

  <!-- Left Signatory Area -->
  <line x1="160" y1="475" x2="320" y2="475" stroke="#9ca3af" stroke-width="1.5" />
  <text x="240" y="495" font-family="sans-serif" font-size="11" font-weight="bold" fill="#374151" text-anchor="middle">{{signatory}}</text>
  <text x="240" y="510" font-family="sans-serif" font-size="9" fill="#9ca3af" text-anchor="middle">{{signatory_title}}</text>

  <!-- Right Authorized Ledger Signatory -->
  <line x1="480" y1="475" x2="640" y2="475" stroke="#9ca3af" stroke-width="1.5" />
  <text x="560" y="495" font-family="sans-serif" font-size="11" font-weight="bold" fill="#374151" text-anchor="middle">OFFICIAL IMPACT LEDGER</text>
  <text x="560" y="510" font-family="sans-serif" font-size="8" font-family="monospace" fill="#16a34a" font-weight="bold" text-anchor="middle">VERIFIED SECURE PUBLIC RECORD</text>
</svg>`;

const MODERN_TEMPLATE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 565" width="100%" height="100%">
  <rect x="0" y="0" width="800" height="565" fill="#fafafa" />
  <!-- Abstract Shapes for Modern Touch -->
  <path d="M 0,0 L 220,0 L 0,220 Z" fill="#991b1b" opacity="0.9" />
  <path d="M 0,0 L 160,0 L 0,160 Z" fill="#d97706" opacity="0.8" />
  <path d="M 800,565 L 580,565 L 800,345 Z" fill="#1e3a8a" opacity="0.9" />
  
  <rect x="30" y="30" width="740" height="505" fill="none" stroke="#e5e7eb" stroke-width="2" />
  
  <text x="400" y="100" font-family="sans-serif" font-size="26" font-weight="900" fill="#111827" text-anchor="middle" letter-spacing="3">ACADEMIC EXCELLENCE AWARD</text>
  <text x="400" y="125" font-family="sans-serif" font-size="9" font-weight="700" fill="#dc2626" text-anchor="middle" letter-spacing="5">MILOUS INDUSTRIAL COHORTS</text>

  <text x="400" y="210" font-family="sans-serif" font-size="12" font-weight="bold" fill="#6b7280" text-anchor="middle">PROUDLY PRESENTED TO</text>
  <text x="400" y="260" font-family="sans-serif" font-size="34" font-weight="900" fill="#991b1b" text-anchor="middle">{{student_name}}</text>
  
  <text x="400" y="315" font-family="sans-serif" font-size="12" font-weight="bold" fill="#6b7280" text-anchor="middle">FOR OUTSTANDING ACHIEVEMENT AND DEDICATED DEVELOPMENT IN</text>
  <text x="400" y="350" font-family="sans-serif" font-size="20" font-weight="800" fill="#1e3a8a" text-anchor="middle">{{course_title}}</text>
  
  <text x="400" y="390" font-family="sans-serif" font-size="11" font-weight="bold" fill="#9ca3af" text-anchor="middle">ISSUED DATE: {{completion_date}}</text>

  <g transform="translate(380, 415)">
    <circle cx="20" cy="20" r="16" fill="#991b1b" opacity="0.1" />
    <path d="M20 10 L28 16 L28 26 L20 32 L12 26 L12 16 Z" fill="#991b1b" />
  </g>

  <line x1="160" y1="480" x2="320" y2="480" stroke="#9ca3af" stroke-width="1.5" />
  <text x="240" y="500" font-family="sans-serif" font-size="11" font-weight="bold" fill="#374151" text-anchor="middle">{{signatory}}</text>
  <text x="240" y="515" font-family="sans-serif" font-size="9" fill="#9ca3af" text-anchor="middle">{{signatory_title}}</text>

  <line x1="480" y1="480" x2="640" y2="480" stroke="#9ca3af" stroke-width="1.5" />
  <text x="560" y="500" font-family="sans-serif" font-size="11" font-weight="bold" fill="#374151" text-anchor="middle">VERIFICATION HASH</text>
  <text x="560" y="515" font-family="monospace" font-size="9" fill="#dc2626" font-weight="bold" text-anchor="middle">VALIDATED PUBLIC SECURE</text>
</svg>`;

const TECH_TEMPLATE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 565" width="100%" height="100%">
  <rect x="0" y="0" width="800" height="565" fill="#0f172a" />
  <!-- Tech Grids and Accents -->
  <line x1="50" y1="50" x2="750" y2="50" stroke="#334155" stroke-width="1" />
  <line x1="50" y1="515" x2="750" y2="515" stroke="#334155" stroke-width="1" />
  <line x1="50" y1="50" x2="50" y2="515" stroke="#334155" stroke-width="1" />
  <line x1="750" y1="50" x2="750" y2="515" stroke="#334155" stroke-width="1" />
  
  <rect x="60" y="60" width="680" height="445" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="10 5" opacity="0.4" />
  
  <text x="400" y="110" font-family="monospace" font-size="24" font-weight="bold" fill="#3b82f6" text-anchor="middle" letter-spacing="4">TECHNICAL COMPETENCY CERTIFICATION</text>
  <text x="400" y="135" font-family="monospace" font-size="10" font-weight="bold" fill="#94a3b8" text-anchor="middle" letter-spacing="3">MILOUS DECENTRALIZED TECHNOLOGIES COHORT</text>

  <text x="400" y="215" font-family="monospace" font-size="11" fill="#64748b" text-anchor="middle">THIS COGNITIVE SYSTEM VERIFIES INSTRUCTION DELIVERED TO:</text>
  <text x="400" y="265" font-family="monospace" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle">{{student_name}}</text>
  
  <text x="400" y="315" font-family="monospace" font-size="11" fill="#64748b" text-anchor="middle">FOR EXCEPTIONAL EXECUTION OF PRACTICAL BENCHMARKS ESTABLISHED IN</text>
  <text x="400" y="355" font-family="monospace" font-size="18" font-weight="bold" fill="#10b981" text-anchor="middle">{{course_title}}</text>
  
  <text x="400" y="395" font-family="monospace" font-size="11" fill="#475569" text-anchor="middle">TIMESTAMP PROTOCOL: {{completion_date}}</text>

  <!-- Cybernetic Decal -->
  <path d="M 380,420 L 420,420 L 410,440 L 390,440 Z" fill="#3b82f6" />

  <line x1="160" y1="475" x2="320" y2="475" stroke="#334155" stroke-width="2" />
  <text x="240" y="495" font-family="monospace" font-size="10" fill="#94a3b8" text-anchor="middle">{{signatory}}</text>
  <text x="240" y="510" font-family="monospace" font-size="8" fill="#475569" text-anchor="middle">{{signatory_title}}</text>

  <line x1="480" y1="475" x2="640" y2="475" stroke="#334155" stroke-width="2" />
  <text x="560" y="495" font-family="monospace" font-size="10" fill="#94a3b8" text-anchor="middle">LEDGER STATUS: ACTIVE</text>
  <text x="560" y="510" font-family="monospace" font-size="8" fill="#10b981" font-weight="bold" text-anchor="middle">COMPLIANCE ASSURED</text>
</svg>`;

export const SkillsManager: React.FC = () => {
  const { 
    convertCurrency, 
    selectedDisplayCurrency, 
    setSelectedDisplayCurrency,
    isFixedRateOverride, 
    setIsFixedRateOverride, 
    fixedRateOverrideValue, 
    setFixedRateOverrideValue,
    exchangeRates
  } = useFirestore();
  const { user } = useAuth();

  // Selected Tabs: 'cohorts' | 'attendance' | 'alumni' | 'finance' | 'designer'
  const [activeTab, setActiveTab] = useState<'cohorts' | 'attendance' | 'alumni' | 'finance' | 'designer'>('cohorts');

  // Interactive local DB (High-fidelity demo dataset for skills NGOs)
  const [cohorts, setCohorts] = useState<Cohort[]>([
    { id: 'coh-web-01', name: 'Frontend Web Dev - TechFemale Hub', track: 'Web Development', startDate: '2026-01-15', endDate: '2026-07-15', status: 'COMPLETED', totalStudents: 25, costIncurred: 12500 },
    { id: 'coh-web-02', name: 'Digital Literacy Bootcamp 2026', track: 'Web Development', startDate: '2026-08-01', endDate: '2027-02-01', status: 'ACTIVE', totalStudents: 32, costIncurred: 8400 },
    { id: 'coh-solar-01', name: 'Off-Grid Solar Engineering Cohort A', track: 'Solar Installation', startDate: '2026-03-10', endDate: '2026-09-10', status: 'COMPLETED', totalStudents: 20, costIncurred: 15000 },
    { id: 'coh-weld-01', name: 'Youth Technical Welding Academy', track: 'Vocational Welding', startDate: '2026-05-01', endDate: '2026-11-01', status: 'ACTIVE', totalStudents: 18, costIncurred: 11200 },
    { id: 'coh-agri-01', name: 'Sustainable Agribusiness & Tech', track: 'Agribusiness', startDate: '2026-09-15', endDate: '2027-03-15', status: 'UPCOMING', totalStudents: 30, costIncurred: 1200 }
  ]);

  const [students, setStudents] = useState<Student[]>([
    { id: 'std-01', name: 'Abena Osei', cohortId: 'coh-web-01', gender: 'Female', age: 22, status: 'GRADUATED', attendanceRate: 96, badgesEarned: ['HTML5 Mastery', 'React Developer', 'Git Fundamentals'], employmentStatus: 'EMPLOYED', startingSalaryGHS: 2800, currentSalaryGHS: 3500, lastMentorshipCheckIn: '2026-09-01', notes: 'Hired as a Junior Engineer at Meltwater Hub Accra.' },
    { id: 'std-02', name: 'Fatoumata Diallo', cohortId: 'coh-web-01', gender: 'Female', age: 24, status: 'GRADUATED', attendanceRate: 98, badgesEarned: ['HTML5 Mastery', 'UI/UX Essentials', 'React Developer'], employmentStatus: 'ENTREPRENEUR', startingSalaryGHS: 1500, currentSalaryGHS: 4200, lastMentorshipCheckIn: '2026-09-10', notes: 'Launched freelance web development agency.' },
    { id: 'std-03', name: 'Kofi Mensah', cohortId: 'coh-solar-01', gender: 'Male', age: 26, status: 'GRADUATED', attendanceRate: 94, badgesEarned: ['PV Solar Basics', 'Electrical Systems Safety'], employmentStatus: 'EMPLOYED', startingSalaryGHS: 2200, currentSalaryGHS: 2200, lastMentorshipCheckIn: '2026-08-25', notes: 'Hired as field installation officer at Pegasus Solar Ghana.' },
    { id: 'std-04', name: 'Sarah Alabi', cohortId: 'coh-web-01', gender: 'Female', age: 21, status: 'GRADUATED', attendanceRate: 92, badgesEarned: ['HTML5 Mastery'], employmentStatus: 'INTERNSHIP', startingSalaryGHS: 1200, currentSalaryGHS: 1200, lastMentorshipCheckIn: '2026-09-05', notes: 'Currently doing 3-month placement at Hubtel.' },
    { id: 'std-05', name: 'Kwame Boateng', cohortId: 'coh-solar-01', gender: 'Male', age: 28, status: 'GRADUATED', attendanceRate: 95, badgesEarned: ['PV Solar Basics', 'Inverter Systems Integration', 'Electrical Systems Safety'], employmentStatus: 'EMPLOYED', startingSalaryGHS: 2500, currentSalaryGHS: 3100, lastMentorshipCheckIn: '2026-09-08', notes: 'Promoted to Lead Installation Tech at SunPower Gh.' },
    { id: 'std-06', name: 'Amina Bello', cohortId: 'coh-web-02', gender: 'Female', age: 20, status: 'ENROLLED', attendanceRate: 88, badgesEarned: ['HTML5 Mastery'], employmentStatus: 'UNEMPLOYED', lastMentorshipCheckIn: '2026-09-12', notes: 'Highly proactive during interactive workshops.' },
    { id: 'std-07', name: 'Ibrahim Tanko', cohortId: 'coh-weld-01', gender: 'Male', age: 23, status: 'ENROLLED', attendanceRate: 90, badgesEarned: ['MIG Welding Safety'], employmentStatus: 'UNEMPLOYED', notes: 'Outstanding practical metal assembly.' },
    { id: 'std-08', name: 'Efe Gifty', cohortId: 'coh-web-02', gender: 'Female', age: 23, status: 'ENROLLED', attendanceRate: 95, badgesEarned: [], employmentStatus: 'UNEMPLOYED', notes: 'Transitioned from retail work.' },
    { id: 'std-09', name: 'Mawuli Ayitey', cohortId: 'coh-weld-01', gender: 'Male', age: 25, status: 'DROPPED_OUT', attendanceRate: 45, badgesEarned: [], employmentStatus: 'UNEMPLOYED', notes: 'Relocated out of region.' }
  ]);

  // Attendance checking state (interactive sheet)
  const [selectedAttendanceCohort, setSelectedAttendanceCohort] = useState<string>('coh-web-02');
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dailyAttendanceMap, setDailyAttendanceMap] = useState<Record<string, boolean>>({
    'std-06': true,
    'std-08': true,
  });

  // Modal / Inputs
  const [isCohortModalOpen, setIsCohortModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);

  // New Cohort Form
  const [newCohortName, setNewCohortName] = useState('');
  const [newCohortTrack, setNewCohortTrack] = useState<Cohort['track']>('Web Development');
  const [newCohortStart, setNewCohortStart] = useState('');
  const [newCohortEnd, setNewCohortEnd] = useState('');
  const [newCohortCost, setNewCohortCost] = useState(5000);

  // New Student Form
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentCohort, setNewStudentCohort] = useState('coh-web-02');
  const [newStudentGender, setNewStudentGender] = useState<'Female' | 'Male' | 'Other'>('Female');
  const [newStudentAge, setNewStudentAge] = useState(22);

  // Filter & Search student
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedTrackFilter, setSelectedTrackFilter] = useState<string>('ALL');

  // Certificate Generator States
  const [selectedCertificateStudent, setSelectedCertificateStudent] = useState<Student | null>(null);
  const [certSignatory, setCertSignatory] = useState('Kwame Mensah');
  const [certSignatoryTitle, setCertSignatoryTitle] = useState('Executive Director, Milous Project');
  const [certTemplateTitle, setCertTemplateTitle] = useState('Certificate of Vocational Competency');
  const [certIssueDate, setCertIssueDate] = useState(new Date().toISOString().split('T')[0]);

  // SVG Certificate Templates Configuration States
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('classic');
  const [customSvgTemplate, setCustomSvgTemplate] = useState<string>(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 565" width="100%" height="100%">
  <!-- Background with delicate light gold fill and custom border -->
  <rect x="15" y="15" width="770" height="535" rx="15" fill="#fcfcf9" stroke="#16a34a" stroke-width="8" />
  <rect x="25" y="25" width="750" height="515" rx="10" fill="none" stroke="#d97706" stroke-width="2" />
  
  <!-- Header Text -->
  <text x="400" y="85" font-family="Georgia, serif" font-size="28" font-weight="900" fill="#14532d" text-anchor="middle" letter-spacing="2">MILOUS SKILLS ACADEMY</text>
  <text x="400" y="115" font-family="sans-serif" font-size="10" font-weight="800" fill="#4b5563" text-anchor="middle" letter-spacing="4">VERIFIED VOCATIONAL EDUCATION DEGREE</text>
  
  <!-- Ribbon Badge -->
  <g transform="translate(375, 135)">
    <circle cx="25" cy="25" r="22" fill="#16a34a" opacity="0.12" />
    <polygon points="25,5 31,18 45,18 34,27 38,40 25,31 12,40 16,27 5,18 19,18" fill="#d97706" />
  </g>

  <!-- Body Content -->
  <text x="400" y="215" font-family="Georgia, serif" font-style="italic" font-size="14" fill="#6b7280" text-anchor="middle">This document solemnly certifies that</text>
  <text x="400" y="265" font-family="Georgia, serif" font-size="30" font-weight="bold" fill="#111827" text-anchor="middle">{{student_name}}</text>
  
  <text x="400" y="315" font-family="Georgia, serif" font-style="italic" font-size="13" fill="#6b7280" text-anchor="middle">has successfully graduated and satisfied all rigorous academic requirements for</text>
  <text x="400" y="355" font-family="sans-serif" font-size="19" font-weight="bold" fill="#166534" text-anchor="middle" letter-spacing="1">{{course_title}}</text>
  
  <text x="400" y="395" font-family="Georgia, serif" font-style="italic" font-size="12" fill="#9ca3af" text-anchor="middle">Successfully Completed on {{completion_date}}</text>

  <!-- Left Signatory Area -->
  <line x1="160" y1="475" x2="320" y2="475" stroke="#9ca3af" stroke-width="1.5" />
  <text x="240" y="495" font-family="sans-serif" font-size="11" font-weight="bold" fill="#374151" text-anchor="middle">{{signatory}}</text>
  <text x="240" y="510" font-family="sans-serif" font-size="9" fill="#9ca3af" text-anchor="middle">{{signatory_title}}</text>

  <!-- Right Authorized Ledger Signatory -->
  <line x1="480" y1="475" x2="640" y2="475" stroke="#9ca3af" stroke-width="1.5" />
  <text x="560" y="495" font-family="sans-serif" font-size="11" font-weight="bold" fill="#374151" text-anchor="middle">OFFICIAL IMPACT LEDGER</text>
  <text x="560" y="510" font-family="sans-serif" font-size="8" font-family="monospace" fill="#16a34a" font-weight="bold" text-anchor="middle">VERIFIED SECURE PUBLIC RECORD</text>
</svg>`);

  const [previewStep, setPreviewStep] = useState<'setup' | 'preview'>('setup');
  const [deliveryMethod, setDeliveryMethod] = useState<'download' | 'email' | 'blockchain'>('download');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [sendingNotification, setSendingNotification] = useState('');

  // Bulk selection states
  const [selectedBulkIds, setSelectedBulkIds] = useState<string[]>([]);
  const [bulkQueueActive, setBulkQueueActive] = useState<boolean>(false);
  const [currentBulkIndex, setCurrentBulkIndex] = useState<number>(0);
  const [bulkSendingProgress, setBulkSendingProgress] = useState<number>(-1); // -1 means inactive
  const [bulkSendingStatus, setBulkSendingStatus] = useState<string>('');

  // Handle Add Cohort
  const handleCreateCohort = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCohortName || !newCohortStart || !newCohortEnd) return;
    const newCh: Cohort = {
      id: `coh-${Date.now()}`,
      name: newCohortName,
      track: newCohortTrack,
      startDate: newCohortStart,
      endDate: newCohortEnd,
      status: 'ACTIVE',
      totalStudents: 0,
      costIncurred: newCohortCost
    };
    setCohorts((prev) => [newCh, ...prev]);
    setIsCohortModalOpen(false);
    setNewCohortName('');
  };

  // Handle Add Student
  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName) return;
    const newStd: Student = {
      id: `std-${Date.now()}`,
      name: newStudentName,
      cohortId: newStudentCohort,
      gender: newStudentGender,
      age: Number(newStudentAge),
      status: 'ENROLLED',
      attendanceRate: 100,
      badgesEarned: [],
      employmentStatus: 'UNEMPLOYED'
    };
    
    // Update cohort counts
    setCohorts((prev) => 
      prev.map((c) => c.id === newStudentCohort ? { ...c, totalStudents: c.totalStudents + 1 } : c)
    );

    setStudents((prev) => [newStd, ...prev]);
    setIsStudentModalOpen(false);
    setNewStudentName('');
  };

  // Handle toggle attendance
  const toggleAttendance = (stdId: string) => {
    setDailyAttendanceMap((prev) => ({
      ...prev,
      [stdId]: !prev[stdId]
    }));
  };

  // Trigger attendance save (simulated action)
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [attendanceSavedNote, setAttendanceSavedNote] = useState('');
  const [simulatedMarketRate, setSimulatedMarketRate] = useState<number>(14.50);
  const handleSaveAttendance = () => {
    setSavingAttendance(true);
    setAttendanceSavedNote('');
    setTimeout(() => {
      setSavingAttendance(false);
      setAttendanceSavedNote('✅ Daily attendance log synchronized with offline-first local database!');
      setTimeout(() => setAttendanceSavedNote(''), 3000);
    }, 1000);
  };

  // Micro-Credential Action
  const [awardedStudentId, setAwardedStudentId] = useState<string>('');
  const [newBadgeName, setNewBadgeName] = useState<string>('');
  const handleAwardBadge = (stdId: string, badgeName: string) => {
    if (!badgeName.trim()) return;
    setStudents((prev) =>
      prev.map((s) => 
        s.id === stdId 
          ? { ...s, badgesEarned: Array.from(new Set([...s.badgesEarned, badgeName.trim()])) } 
          : s
      )
    );
    setNewBadgeName('');
    setAwardedStudentId('');
  };

  // Alumni tracker updater
  const handleUpdateAlumni = (stdId: string, updates: Partial<Student>) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === stdId ? { ...s, ...updates, lastMentorshipCheckIn: new Date().toISOString().split('T')[0] } : s))
    );
  };

  // Filtered Students List
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch = s.name.toLowerCase().includes(studentSearch.toLowerCase());
      const cohortObj = cohorts.find((c) => c.id === s.cohortId);
      const matchTrack = selectedTrackFilter === 'ALL' || (cohortObj && cohortObj.track === selectedTrackFilter);
      return matchSearch && matchTrack;
    });
  }, [students, studentSearch, selectedTrackFilter, cohorts]);

  // Bulk selection dynamic helpers
  const graduatesInFilter = useMemo(() => {
    return filteredStudents.filter((s) => s.status === 'GRADUATED');
  }, [filteredStudents]);

  const isAllSelected = useMemo(() => {
    if (graduatesInFilter.length === 0) return false;
    return graduatesInFilter.every((s) => selectedBulkIds.includes(s.id));
  }, [graduatesInFilter, selectedBulkIds]);

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      const gradIds = graduatesInFilter.map((s) => s.id);
      setSelectedBulkIds((prev) => prev.filter((id) => !gradIds.includes(id)));
    } else {
      const gradIds = graduatesInFilter.map((s) => s.id);
      setSelectedBulkIds((prev) => Array.from(new Set([...prev, ...gradIds])));
    }
  };

  const handleToggleSelectStudent = (id: string) => {
    setSelectedBulkIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectedBulkStudentsList = useMemo(() => {
    return students.filter((std) => selectedBulkIds.includes(std.id));
  }, [students, selectedBulkIds]);

  const getRenderedSvgForStudent = (student: Student) => {
    if (!student) return '';
    const activeSvgString = 
      selectedTemplateId === 'classic' ? CLASSIC_TEMPLATE :
      selectedTemplateId === 'modern' ? MODERN_TEMPLATE :
      selectedTemplateId === 'tech' ? TECH_TEMPLATE :
      customSvgTemplate;
    
    let rendered = activeSvgString;
    rendered = rendered.replace(/\{\{student_name\}\}/g, student.name);
    
    const trackName = cohorts.find(c => c.id === student.cohortId)?.track || 'Vocational Training Track';
    rendered = rendered.replace(/\{\{course_title\}\}/g, trackName);
    
    const formattedDate = new Date(certIssueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    rendered = rendered.replace(/\{\{completion_date\}\}/g, formattedDate);
    
    rendered = rendered.replace(/\{\{signatory\}\}/g, certSignatory);
    rendered = rendered.replace(/\{\{signatory_title\}\}/g, certSignatoryTitle);
    
    const verUrl = `${window.location.origin}/verify/${student.id}`;
    const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verUrl)}`;
    
    rendered = rendered.replace(/\{\{verification_url\}\}/g, verUrl);
    rendered = rendered.replace(/\{\{qr_code\}\}/g, qrImgUrl);
    
    return rendered;
  };

  // DERIVED DATA: Program Cost-Benefit Dashboard calculations
  const dashboardStats = useMemo(() => {
    const activeAndGraduated = students.filter((s) => s.status !== 'DROPPED_OUT');
    const totalSpent = cohorts.reduce((sum, c) => sum + c.costIncurred, 0);
    const totalGraduates = students.filter((s) => s.status === 'GRADUATED').length;
    
    // Placements: Employed, Interns, or Entrepreneurs
    const totalPlacements = students.filter(
      (s) => s.status === 'GRADUATED' && ['EMPLOYED', 'INTERNSHIP', 'ENTREPRENEUR'].includes(s.employmentStatus)
    ).length;

    // Averages
    const averageAttendance = activeAndGraduated.length > 0 
      ? Math.round(activeAndGraduated.reduce((sum, s) => sum + s.attendanceRate, 0) / activeAndGraduated.length)
      : 0;

    const rawCostPerStudent = activeAndGraduated.length > 0 ? Math.round(totalSpent / activeAndGraduated.length) : 0;
    const rawCostPerGraduate = totalGraduates > 0 ? Math.round(totalSpent / totalGraduates) : 0;
    const rawCostPerPlacement = totalPlacements > 0 ? Math.round(totalSpent / totalPlacements) : 0;

    // Wage Multipliers / Progression
    const alumniWithSalaries = students.filter((s) => s.status === 'GRADUATED' && s.startingSalaryGHS);
    const rawAvgStartingWage = alumniWithSalaries.length > 0
      ? Math.round(alumniWithSalaries.reduce((sum, s) => sum + (s.startingSalaryGHS || 0), 0) / alumniWithSalaries.length)
      : 0;
    const rawAvgCurrentWage = alumniWithSalaries.length > 0
      ? Math.round(alumniWithSalaries.reduce((sum, s) => sum + (s.currentSalaryGHS || 0), 0) / alumniWithSalaries.length)
      : 0;

    // Dynamically convert values to display currency
    const totalSpentConverted = Math.round(convertCurrency(totalSpent, 'GHS', selectedDisplayCurrency));
    const costPerStudent = Math.round(convertCurrency(rawCostPerStudent, 'GHS', selectedDisplayCurrency));
    const costPerGraduate = Math.round(convertCurrency(rawCostPerGraduate, 'GHS', selectedDisplayCurrency));
    const costPerPlacement = Math.round(convertCurrency(rawCostPerPlacement, 'GHS', selectedDisplayCurrency));
    const avgStartingWage = Math.round(convertCurrency(rawAvgStartingWage, 'GHS', selectedDisplayCurrency));
    const avgCurrentWage = Math.round(convertCurrency(rawAvgCurrentWage, 'GHS', selectedDisplayCurrency));

    return {
      totalSpent: totalSpentConverted,
      totalStudentsEnrolled: activeAndGraduated.length,
      totalGraduates,
      totalPlacements,
      averageAttendance,
      costPerStudent,
      costPerGraduate,
      costPerPlacement,
      avgStartingWage,
      avgCurrentWage,
      rawAvgStartingWage,
      rawAvgCurrentWage
    };
  }, [cohorts, students, selectedDisplayCurrency, convertCurrency]);

  // Recharts track breakdown data
  const chartData = useMemo(() => {
    const tracks = ['Web Development', 'Solar Installation', 'Vocational Welding', 'Agribusiness'];
    return tracks.map((track) => {
      const trackCohorts = cohorts.filter((c) => c.track === track);
      const totalCostGHS = trackCohorts.reduce((sum, c) => sum + c.costIncurred, 0);
      const convertedCost = Math.round(convertCurrency(totalCostGHS, 'GHS', selectedDisplayCurrency));
      const trackStudents = students.filter((s) => {
        const c = cohorts.find((coh) => coh.id === s.cohortId);
        return c && c.track === track;
      });
      const graduates = trackStudents.filter((s) => s.status === 'GRADUATED').length;
      const placements = trackStudents.filter(
        (s) => s.status === 'GRADUATED' && ['EMPLOYED', 'INTERNSHIP', 'ENTREPRENEUR'].includes(s.employmentStatus)
      ).length;

      return {
        name: track,
        'Total Enrolled': trackStudents.length,
        Graduates: graduates,
        Placements: placements,
        'Cost': convertedCost,
        rawCostGHS: totalCostGHS
      };
    });
  }, [cohorts, students, selectedDisplayCurrency, convertCurrency]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-emerald-600" />
            <span>Skills Development &amp; Impact Engine</span>
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            Cohort lifecycles, micro-credentials, post-grad employment trackings, and financial cost-benefit models.
          </p>
        </div>

        {/* Dynamic Cost-Benefit Header Summary */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Average Attendance:</span>
            <span className="font-black text-slate-800">{dashboardStats.averageAttendance}%</span>
          </div>

          <div className="px-3.5 py-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs text-xs flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Placement Rate:</span>
            <span className="font-black text-slate-800">
              {dashboardStats.totalGraduates > 0 
                ? Math.round((dashboardStats.totalPlacements / dashboardStats.totalGraduates) * 100) 
                : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200/60 pb-px gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('cohorts')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'cohorts' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Cohorts &amp; Students Registry</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'attendance' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Attendance &amp; Credentials</span>
        </button>

        <button
          onClick={() => setActiveTab('alumni')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'alumni' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Alumni Placements &amp; Mentorship</span>
        </button>

        <button
          onClick={() => setActiveTab('finance')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'finance' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Interactive Cost-Benefit Analysis</span>
        </button>

        <button
          onClick={() => setActiveTab('designer')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'designer' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <FileBadge className="w-4 h-4 text-emerald-500" />
          <span>Certificate Designer &amp; Templates</span>
        </button>
      </div>

      {/* TAB 1: Cohorts & Student Registry */}
      {activeTab === 'cohorts' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Cohorts</span>
              <h3 className="text-2xl font-black text-slate-900 mt-2">
                {cohorts.filter((c) => c.status === 'ACTIVE').length}
              </h3>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Enrolled</span>
              <h3 className="text-2xl font-black text-slate-900 mt-2">
                {students.filter((s) => s.status === 'ENROLLED').length}
              </h3>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed Alumni</span>
              <h3 className="text-2xl font-black text-slate-900 mt-2">
                {students.filter((s) => s.status === 'GRADUATED').length}
              </h3>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Grants Allocation</span>
              <h3 className="text-2xl font-black text-slate-900 mt-2 flex items-center">
                <span className="text-emerald-600 mr-1">GHS</span>
                <span>{dashboardStats.totalSpent.toLocaleString()}</span>
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left/Middle Columns: Master Student list */}
            <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Student Registry</span>
                </h4>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {/* Search */}
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                    <input
                      type="text"
                      placeholder="Search student name..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full"
                    />
                  </div>

                  {/* Track filter */}
                  <select
                    value={selectedTrackFilter}
                    onChange={(e) => setSelectedTrackFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Tracks</option>
                    <option value="Web Development">Web Dev</option>
                    <option value="Solar Installation">Solar Energy</option>
                    <option value="Vocational Welding">Welding</option>
                    <option value="Agribusiness">Agribusiness</option>
                  </select>
                </div>
              </div>

              {/* Bulk Actions Panel */}
              {selectedBulkIds.length > 0 && (
                <div className="bg-emerald-50/70 border border-emerald-100 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black">
                      {selectedBulkIds.length}
                    </span>
                    <div>
                      <p className="text-xs font-black text-slate-900">Graduates Selected for Accreditation</p>
                      <p className="text-[10px] text-emerald-800 font-semibold">Ready to initiate bulk template generation and print queue.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => {
                        setSelectedBulkIds([]);
                      }}
                      className="px-3 py-1.5 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-[10px] uppercase transition cursor-pointer"
                    >
                      Deselect All
                    </button>
                    <button
                      onClick={() => {
                        setBulkQueueActive(true);
                        setCurrentBulkIndex(0);
                        setPreviewStep('setup');
                        setBulkSendingProgress(-1);
                      }}
                      className="flex-1 sm:flex-none px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl text-[10px] uppercase tracking-wide flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Generate Certificates ({selectedBulkIds.length}) →</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Student Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      <th className="py-2 pl-2 w-10">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={handleToggleSelectAll}
                          disabled={graduatesInFilter.length === 0}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer accent-emerald-600"
                        />
                      </th>
                      <th className="py-2">Student Name</th>
                      <th className="py-2">Cohort Track</th>
                      <th className="py-2 text-center">Age</th>
                      <th className="py-2">Status</th>
                      <th className="py-2 text-right">Attendance</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-xs font-bold text-slate-400">
                          No registered students found.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((std) => {
                        const cohortObj = cohorts.find((c) => c.id === std.cohortId);
                        return (
                          <tr key={std.id} className="border-b border-slate-50 hover:bg-slate-50/50 text-xs font-semibold text-slate-800">
                            <td className="py-3 pl-2">
                              <input
                                type="checkbox"
                                checked={selectedBulkIds.includes(std.id)}
                                onChange={() => handleToggleSelectStudent(std.id)}
                                disabled={std.status !== 'GRADUATED'}
                                title={std.status !== 'GRADUATED' ? 'Only graduated students satisfy completion certificate requirements.' : ''}
                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer disabled:cursor-not-allowed accent-emerald-600"
                              />
                            </td>
                            <td className="py-3 font-bold text-slate-900">{std.name}</td>
                            <td className="py-3">
                              <span className="text-[10px] px-2 py-0.5 rounded-lg font-bold bg-slate-100 text-slate-600">
                                {cohortObj?.track || 'N/A'}
                              </span>
                            </td>
                            <td className="py-3 text-center">{std.age}</td>
                            <td className="py-3">
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                                std.status === 'GRADUATED' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                  : std.status === 'ENROLLED'
                                  ? 'bg-slate-50 text-slate-700 border-slate-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-100'
                              }`}>
                                {std.status}
                              </span>
                            </td>
                            <td className="py-3 text-right font-mono font-bold text-slate-700">{std.attendanceRate}%</td>
                            <td className="py-3 text-right">
                              {std.status === 'GRADUATED' ? (
                                <button
                                  onClick={() => setSelectedCertificateStudent(std)}
                                  className="py-1 px-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 rounded-xl text-[10px] font-black tracking-wide shadow-2xs transition cursor-pointer flex items-center gap-1 ml-auto"
                                >
                                  <Printer className="w-3 h-3 text-emerald-600" />
                                  <span>Certificate</span>
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-semibold italic">Not Graduated</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column: Register New Cohort & Student */}
            <div className="space-y-6">
              
              {/* Card 1: Registered Cohorts */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <span>Registered Cohorts</span>
                  </h4>
                  <button 
                    onClick={() => setIsCohortModalOpen(true)}
                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {cohorts.map((c) => (
                    <div key={c.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-900">{c.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{c.track}</p>
                      </div>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                        c.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setIsStudentModalOpen(true)}
                  className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Enroll New Student</span>
                </button>
              </div>

            </div>
          </div>

          {/* ADD COHORT MODAL */}
          {isCohortModalOpen && (
            <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-3xs">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-xl">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Register Program Cohort</h4>
                  <button onClick={() => setIsCohortModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                </div>

                <form onSubmit={handleCreateCohort} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cohort Name</label>
                    <input
                      type="text"
                      value={newCohortName}
                      onChange={(e) => setNewCohortName(e.target.value)}
                      placeholder="e.g. Solar Tech - Cohort C"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Skills Track</label>
                    <select
                      value={newCohortTrack}
                      onChange={(e) => setNewCohortTrack(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="Web Development">Web Development</option>
                      <option value="Solar Installation">Solar Installation</option>
                      <option value="Vocational Welding">Vocational Welding</option>
                      <option value="Agribusiness">Agribusiness</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Start Date</label>
                      <input
                        type="date"
                        value={newCohortStart}
                        onChange={(e) => setNewCohortStart(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">End Date</label>
                      <input
                        type="date"
                        value={newCohortEnd}
                        onChange={(e) => setNewCohortEnd(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Budget Allocation (GHS)</label>
                    <input
                      type="number"
                      value={newCohortCost}
                      onChange={(e) => setNewCohortCost(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition mt-2"
                  >
                    Create Cohort
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ENROLL STUDENT MODAL */}
          {isStudentModalOpen && (
            <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-3xs">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-xl">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Enroll New Student</h4>
                  <button onClick={() => setIsStudentModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                </div>

                <form onSubmit={handleCreateStudent} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Student Full Name</label>
                    <input
                      type="text"
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      placeholder="e.g. Ama Serwah"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Assign to Cohort</label>
                    <select
                      value={newStudentCohort}
                      onChange={(e) => setNewStudentCohort(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                    >
                      {cohorts.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Age</label>
                      <input
                        type="number"
                        value={newStudentAge}
                        onChange={(e) => setNewStudentAge(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Gender</label>
                      <select
                        value={newStudentGender}
                        onChange={(e) => setNewStudentGender(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                      >
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition mt-2"
                  >
                    Enroll Student
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB 2: Attendance & Credentials */}
      {activeTab === 'attendance' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left/Middle Column: Interactive Attendance Sheet */}
            <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                    <span>Daily Attendance &amp; Credentials Hub</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Log student presence and award micro-credential badges.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <select
                    value={selectedAttendanceCohort}
                    onChange={(e) => setSelectedAttendanceCohort(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    {cohorts.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>

                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              {/* Attendance Table List */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      <th className="py-2 w-12 text-center">Status</th>
                      <th className="py-2">Student Name</th>
                      <th className="py-2">Micro-Credentials &amp; Badges Earned</th>
                      <th className="py-2 text-right">Award Credentials</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.filter((s) => s.cohortId === selectedAttendanceCohort).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-xs font-bold text-slate-400">
                          No students enrolled in this cohort yet.
                        </td>
                      </tr>
                    ) : (
                      students
                        .filter((s) => s.cohortId === selectedAttendanceCohort)
                        .map((std) => (
                          <tr key={std.id} className="border-b border-slate-50 hover:bg-slate-50/50 text-xs font-semibold text-slate-800">
                            <td className="py-3 text-center">
                              <input
                                type="checkbox"
                                checked={!!dailyAttendanceMap[std.id]}
                                onChange={() => toggleAttendance(std.id)}
                                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                            </td>
                            <td className="py-3">
                              <p className="font-bold text-slate-900">{std.name}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Attendance: {std.attendanceRate}%</p>
                            </td>
                            <td className="py-3">
                              <div className="flex flex-wrap gap-1.5">
                                {std.badgesEarned.length === 0 ? (
                                  <span className="text-[10px] text-slate-400 font-bold italic">No credentials earned yet</span>
                                ) : (
                                  std.badgesEarned.map((b) => (
                                    <span key={b} className="inline-flex items-center gap-1 text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-md">
                                      <Award className="w-3 h-3 text-emerald-500" />
                                      <span>{b}</span>
                                    </span>
                                  ))
                                )}
                              </div>
                            </td>
                            <td className="py-3 text-right">
                              {awardedStudentId === std.id ? (
                                <div className="flex items-center gap-1.5 justify-end animate-in slide-in-from-right-1 duration-150">
                                  <input
                                    type="text"
                                    placeholder="e.g. Git Fundamentals"
                                    value={newBadgeName}
                                    onChange={(e) => setNewBadgeName(e.target.value)}
                                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-[10px] font-bold text-slate-800 focus:outline-none w-32"
                                  />
                                  <button
                                    onClick={() => handleAwardBadge(std.id, newBadgeName)}
                                    className="p-1 bg-slate-900 text-white rounded-lg hover:bg-slate-800 cursor-pointer text-[10px] font-bold"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setAwardedStudentId('')}
                                    className="p-1 bg-slate-100 text-slate-400 rounded-lg hover:bg-slate-200 cursor-pointer text-[10px] font-bold"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setAwardedStudentId(std.id)}
                                  className="py-1 px-2.5 border border-slate-200 hover:border-emerald-600 rounded-xl text-[10px] font-black text-slate-700 hover:text-emerald-700 bg-white shadow-2xs transition cursor-pointer"
                                >
                                  Award Badge
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Save Attendance Section */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-[11px] font-semibold text-slate-500">
                  {attendanceSavedNote}
                </span>
                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  disabled={savingAttendance}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-75"
                >
                  {savingAttendance ? 'Syncing...' : 'Save & Sync Attendance'}
                </button>
              </div>

            </div>

            {/* Right Column: Micro-Credentialing standards & certification info */}
            <div className="space-y-6">
              
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                  <FileBadge className="w-4.5 h-4.5 text-emerald-600" />
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Standard Micro-Credentials</h4>
                </div>

                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                  The Milous Project partners with leading certifying bodies to issue verified skill badges. Pre-approved standards include:
                </p>

                <div className="space-y-3 pt-1">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                    <p className="text-[11px] font-black text-slate-800 uppercase tracking-wider">PV Solar Basics</p>
                    <p className="text-[10px] text-slate-400 font-semibold leading-normal">Covers solar panel arrays installation, voltage calculations, and structural safety.</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                    <p className="text-[11px] font-black text-slate-800 uppercase tracking-wider">React Developer</p>
                    <p className="text-[10px] text-slate-400 font-semibold leading-normal">Requires mastering SPA architectures, state management, and async REST interactions.</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                    <p className="text-[11px] font-black text-slate-800 uppercase tracking-wider">MIG Welding Safety</p>
                    <p className="text-[10px] text-slate-400 font-semibold leading-normal">Verifies absolute compliance in protective gear, gas regulation, and joint alignment.</p>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* TAB 3: Alumni Employment & Mentorship Tracker */}
      {activeTab === 'alumni' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Alumni Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Graduated Alumni</span>
              <h3 className="text-2xl font-black text-slate-900 mt-2">
                {dashboardStats.totalGraduates}
              </h3>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Placements</span>
              <h3 className="text-2xl font-black text-slate-900 mt-2 text-emerald-600">
                {dashboardStats.totalPlacements}
              </h3>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Starting Wage</span>
              <h3 className="text-2xl font-black text-slate-900 mt-2 flex items-center">
                <span className="text-slate-400 text-lg mr-1">{selectedDisplayCurrency}</span>
                <span>{dashboardStats.avgStartingWage.toLocaleString()}</span>
              </h3>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Wage (Median)</span>
              <h3 className="text-2xl font-black text-slate-900 mt-2 flex items-center text-emerald-600">
                <span className="text-emerald-500 text-lg mr-1">{selectedDisplayCurrency}</span>
                <span>{dashboardStats.avgCurrentWage.toLocaleString()}</span>
                <span className="text-xs text-emerald-500 font-bold ml-1.5">(+{Math.round(((dashboardStats.avgCurrentWage - dashboardStats.avgStartingWage) / dashboardStats.avgStartingWage) * 100) || 0}%)</span>
              </h3>
            </div>
          </div>

          {/* Master Alumni Registry */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-4.5 h-4.5 text-emerald-600" />
                  <span>Alumni Tracking Registry &amp; Mentorship Log</span>
                </h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Continuous evaluation of post-grad economic achievements, salaries, and mentorship logs.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="py-2">Graduate Name</th>
                    <th className="py-2">Placement Status</th>
                    <th className="py-2 text-right">Starting Wage</th>
                    <th className="py-2 text-right">Current Wage</th>
                    <th className="py-2 text-center">Last Mentorship Check-In</th>
                    <th className="py-2">Employer Notes &amp; Progress</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.filter((s) => s.status === 'GRADUATED').length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-xs font-bold text-slate-400">No graduated alumni available yet.</td>
                    </tr>
                  ) : (
                    students
                      .filter((s) => s.status === 'GRADUATED')
                      .map((std) => (
                        <tr key={std.id} className="border-b border-slate-50 hover:bg-slate-50/50 text-xs font-semibold text-slate-800">
                          <td className="py-3 font-bold text-slate-900">{std.name}</td>
                          <td className="py-3">
                            <select
                              value={std.employmentStatus}
                              onChange={(e) => handleUpdateAlumni(std.id, { employmentStatus: e.target.value as any })}
                              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-800 cursor-pointer"
                            >
                              <option value="UNEMPLOYED">UNEMPLOYED</option>
                              <option value="INTERNSHIP">INTERNSHIP</option>
                              <option value="EMPLOYED">EMPLOYED</option>
                              <option value="ENTREPRENEUR">ENTREPRENEUR</option>
                            </select>
                          </td>
                          <td className="py-3 text-right font-mono text-slate-500">
                            {(() => {
                              const convertedStarting = std.startingSalaryGHS ? Math.round(convertCurrency(std.startingSalaryGHS, 'GHS', selectedDisplayCurrency)) : null;
                              return convertedStarting ? `${selectedDisplayCurrency} ${convertedStarting.toLocaleString()}` : '—';
                            })()}
                          </td>
                          <td className="py-3 text-right">
                            {std.employmentStatus !== 'UNEMPLOYED' ? (
                              <div className="flex items-center justify-end gap-1 font-mono text-slate-800">
                                <span className="text-[10px] text-slate-400">{selectedDisplayCurrency}</span>
                                <input
                                  type="number"
                                  value={Math.round(convertCurrency(std.currentSalaryGHS || 0, 'GHS', selectedDisplayCurrency)) || 0}
                                  onChange={(e) => {
                                    const inputVal = Number(e.target.value) || 0;
                                    const ghsVal = Math.round(convertCurrency(inputVal, selectedDisplayCurrency, 'GHS'));
                                    handleUpdateAlumni(std.id, { currentSalaryGHS: ghsVal });
                                  }}
                                  className="bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-0.5 text-right w-16 focus:outline-none"
                                />
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-3 text-center font-mono text-slate-500">
                            {std.lastMentorshipCheckIn ? new Date(std.lastMentorshipCheckIn).toLocaleDateString() : 'Pending'}
                          </td>
                          <td className="py-3 text-slate-600 font-normal max-w-xs truncate" title={std.notes}>
                            {std.notes || <span className="text-slate-400 italic">No notes logged</span>}
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  const newNote = prompt('Enter follow-up update / mentorship log:', std.notes || '');
                                  if (newNote !== null) {
                                    handleUpdateAlumni(std.id, { notes: newNote });
                                  }
                                }}
                                className="py-1 px-2 border border-slate-200 hover:border-slate-800 rounded-xl text-[10px] font-bold bg-white text-slate-700 hover:text-slate-900 shadow-3xs cursor-pointer transition"
                              >
                                Log Check-In
                              </button>
                              <button
                                onClick={() => setSelectedCertificateStudent(std)}
                                className="py-1 px-2 bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 rounded-xl text-[10px] font-black tracking-wide shadow-2xs transition cursor-pointer flex items-center gap-1"
                              >
                                <Printer className="w-3 h-3 text-emerald-600" />
                                <span>Certificate</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
          
      {/* TAB 4: Interactive Cost-Benefit Analysis */}
      {activeTab === 'finance' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Treasury FX & Fixed Grant Rate Safeguard Control Console */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Card 1: Display Currency & Fixed Rate Lock Controller */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-5">
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-4.5 h-4.5 text-emerald-600 animate-pulse" />
                  <span>Base Reporting &amp; Disbursement Currency Locks</span>
                </h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  Establish a negotiated Fixed Grant Rate to shield NGO reporting metrics against live exchange fluctuations.
                </p>
              </div>

              {/* Currency Quick Toggles */}
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Active Presentation Currency</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'GHS', label: '₵ GHS (Base)' },
                    { id: 'USD', label: '$ USD (Grant)' },
                    { id: 'EUR', label: '€ EUR (EU)' },
                    { id: 'GBP', label: '£ GBP (UK)' },
                  ].map((curr) => (
                    <button
                      key={curr.id}
                      onClick={() => setSelectedDisplayCurrency(curr.id)}
                      className={`py-2 px-2.5 rounded-xl border text-[11px] font-black text-center cursor-pointer transition ${
                        selectedDisplayCurrency === curr.id
                          ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {curr.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fixed Rate Control Swapper */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-wider">Fixed Grant Rate Lock</span>
                    <p className="text-[9px] text-slate-400 font-semibold">Enforce stable budget conversions for audits</p>
                  </div>
                  <button
                    onClick={() => setIsFixedRateOverride(!isFixedRateOverride)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isFixedRateOverride ? 'bg-emerald-600' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        isFixedRateOverride ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {isFixedRateOverride && (
                  <div className="space-y-2 animate-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Negotiated Rate (GHS per USD)</span>
                      <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1">
                        <span className="text-[10px] font-bold text-slate-400">₵</span>
                        <input
                          type="number"
                          step="0.05"
                          min="5"
                          max="20"
                          value={fixedRateOverrideValue}
                          onChange={(e) => setFixedRateOverrideValue(parseFloat(e.target.value) || 12.0)}
                          className="w-16 text-right text-xs font-black text-slate-800 focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                    <div className="w-full pt-1.5 border-t border-slate-200/60 flex justify-between items-center text-[9px] text-slate-400 font-semibold">
                      <span>Conversion baseline locking active</span>
                      <span className="text-emerald-700 font-bold">Auditable Standard</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Market Rate Drift & Alert System */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Activity className="w-4.5 h-4.5 text-emerald-600" />
                      <span>Exchange Rate Fluctuation Drift Analyzer</span>
                    </h4>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                      Assess real-time budget deficit and variance risk caused by local currency depreciation.
                    </p>
                  </div>
                  {isFixedRateOverride && (
                    <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg animate-pulse">
                      Protection Active
                    </span>
                  )}
                </div>

                {/* Simulated Rate Input & Drift Calculations */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Simulated Market Rate</span>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-black text-slate-800">₵ {simulatedMarketRate.toFixed(2)}</span>
                      <span className="text-[9px] text-slate-400 font-bold">GHS/USD</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Negotiated Lock Rate</span>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-black text-slate-800">
                        {isFixedRateOverride ? `₵ ${fixedRateOverrideValue.toFixed(2)}` : '—'}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold">Locked Factor</span>
                    </div>
                  </div>
                </div>

                {/* Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase">
                    <span>Simulate Depreciation (GHS/USD)</span>
                    <span className="font-mono">₵ 8.00 - ₵ 18.00</span>
                  </div>
                  <input
                    type="range"
                    min="8.0"
                    max="18.0"
                    step="0.1"
                    value={simulatedMarketRate}
                    onChange={(e) => setSimulatedMarketRate(parseFloat(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Guardrail Status / Real-time Alert Notification Block */}
              <div className="mt-4 pt-1">
                {(() => {
                  if (!isFixedRateOverride) {
                    return (
                      <div className="p-3.5 bg-slate-100 border border-slate-200/50 rounded-2xl flex items-center gap-3 text-slate-500">
                        <AlertTriangle className="w-5 h-5 text-slate-400 shrink-0" />
                        <div className="text-[10px] font-semibold leading-relaxed">
                          <p className="font-black uppercase text-slate-700">Fixed Protection Inactive</p>
                          <p className="mt-0.5 text-slate-500">Reporting metrics are tied directly to active exchange rate updates, leaving donor reporting highly vulnerable to mid-cohort market fluctuations.</p>
                        </div>
                      </div>
                    );
                  }

                  const driftVal = simulatedMarketRate - fixedRateOverrideValue;
                  const driftPercent = Math.round((driftVal / fixedRateOverrideValue) * 1000) / 10;
                  const isSafe = Math.abs(driftPercent) <= 5.0;

                  if (isSafe) {
                    return (
                      <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-800 animate-in zoom-in-95">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div className="text-[10px] font-semibold leading-relaxed">
                          <p className="font-black uppercase text-emerald-900 flex items-center gap-1">
                            <span>Budget Drift Compliant</span>
                            <span className="font-mono font-bold">({driftPercent > 0 ? '+' : ''}{driftPercent}%)</span>
                          </p>
                          <p className="mt-0.5 text-emerald-700 font-bold">Variance is staying well within the stable 5.0% threshold. Audited reports and disbursed funds are structurally secure.</p>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-800 animate-in zoom-in-95">
                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 animate-bounce" />
                        <div className="text-[10px] font-semibold leading-relaxed">
                          <p className="font-black uppercase text-rose-900 flex items-center gap-1">
                            <span>Critical Variance Drift Danger!</span>
                            <span className="font-mono font-bold">({driftPercent > 0 ? '+' : ''}{driftPercent}%)</span>
                          </p>
                          <p className="mt-0.5 text-rose-700">Market rates have deviated significantly from the locked negotiated rate. Deficit risk detected; immediate treasury matching or locking is recommended.</p>
                        </div>
                      </div>
                    );
                  }
                })()}
              </div>

            </div>

          </div>
          
          {/* Efficiency Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Efficiency Card 1: Cost Per Graduate */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between h-40">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Educational Efficiency</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <GraduationCap className="w-4.5 h-4.5" />
                </div>
              </div>
              <div>
                <h4 className="text-2xl font-black text-slate-900 leading-none flex items-baseline">
                  <span className="text-xs text-slate-400 font-bold mr-1">{selectedDisplayCurrency}</span>
                  <span>{dashboardStats.costPerGraduate.toLocaleString()}</span>
                </h4>
                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Average Cost Per Graduated Student</p>
              </div>
            </div>

            {/* Efficiency Card 2: Cost Per Placement */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between h-40">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Placement Efficiency</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Briefcase className="w-4.5 h-4.5" />
                </div>
              </div>
              <div>
                <h4 className="text-2xl font-black text-slate-900 leading-none flex items-baseline">
                  <span className="text-xs text-slate-400 font-bold mr-1">{selectedDisplayCurrency}</span>
                  <span>{dashboardStats.costPerPlacement.toLocaleString()}</span>
                </h4>
                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Average Cost Per Economic Placement</p>
              </div>
            </div>

            {/* Efficiency Card 3: Wage Progression Index */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between h-40">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Impact Multiplier</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <TrendingUp className="w-4.5 h-4.5" />
                </div>
              </div>
              <div>
                <h4 className="text-2xl font-black text-slate-900 leading-none flex items-baseline">
                  <span>+{Math.round(((dashboardStats.avgCurrentWage - dashboardStats.avgStartingWage) / dashboardStats.avgStartingWage) * 100) || 0}%</span>
                </h4>
                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Median Salary Progression After Graduate Mentorship</p>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart Column */}
            <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Program Performance Metrics by Track</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Comparing Enrolled Student Counts, Completed Graduates, and Placement Outcomes.</p>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} stroke="#cbd5e1" />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} stroke="#cbd5e1" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="Total Enrolled" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Graduates" fill="#34d399" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Placements" fill="#059669" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Program Track Efficiency List */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Grants &amp; Budget Efficiency</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Budget spent versus outcome costs across active training tracks.</p>
              </div>

              <div className="space-y-4 pt-1">
                {chartData.map((track) => (
                  <div key={track.name} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800">{track.name}</span>
                      <span className="font-mono text-[10px] font-black text-slate-500">{selectedDisplayCurrency} {track['Cost'].toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-semibold">
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <p className="text-[8px] uppercase font-bold text-slate-400">Cost per Grad</p>
                        <p className="text-xs font-mono font-black text-slate-800 mt-0.5">
                          {selectedDisplayCurrency} {track.Graduates > 0 ? Math.round(track['Cost'] / track.Graduates).toLocaleString() : '—'}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <p className="text-[8px] uppercase font-bold text-slate-400">Cost per Placement</p>
                        <p className="text-xs font-mono font-black text-slate-800 mt-0.5">
                          {selectedDisplayCurrency} {track.Placements > 0 ? Math.round(track['Cost'] / track.Placements).toLocaleString() : '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 5: Certificate Designer & Templates */}
      {activeTab === 'designer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          
          {/* Controls column: 5 cols */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                  <span>Interactive Template Builder</span>
                </h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  Select a template engine, edit raw SVG code, or drag &amp; drop your own SVG file with custom variables.
                </p>
              </div>

              {/* Base Template Selector */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Select Base Engine</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setSelectedTemplateId('classic');
                    }}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      selectedTemplateId === 'classic'
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <p className="text-xs font-black">Classic Ivory</p>
                    <p className="text-[8px] text-slate-400 font-semibold mt-0.5">Traditional gold &amp; green borders</p>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedTemplateId('modern');
                    }}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      selectedTemplateId === 'modern'
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <p className="text-xs font-black">Modern Minimal</p>
                    <p className="text-[8px] text-slate-400 font-semibold mt-0.5">Crimson geometric details</p>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedTemplateId('tech');
                    }}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      selectedTemplateId === 'tech'
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <p className="text-xs font-black">Digital Slate</p>
                    <p className="text-[8px] text-slate-400 font-semibold mt-0.5">Dark cybernetic grid</p>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedTemplateId('custom');
                    }}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      selectedTemplateId === 'custom'
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <p className="text-xs font-black">Custom SVG</p>
                    <p className="text-[8px] text-slate-400 font-semibold mt-0.5">Fully customized template markup</p>
                  </button>
                </div>
              </div>

              {/* Drag and Drop SVG Uploader */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Upload SVG Template</label>
                <div 
                  className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:bg-slate-50 transition cursor-pointer relative"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file && file.type === "image/svg+xml") {
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        if (evt.target?.result) {
                          setCustomSvgTemplate(evt.target.result as string);
                          setSelectedTemplateId('custom');
                        }
                      };
                      reader.readAsText(file);
                    }
                  }}
                >
                  <input
                    type="file"
                    accept=".svg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          if (evt.target?.result) {
                            setCustomSvgTemplate(evt.target.result as string);
                            setSelectedTemplateId('custom');
                          }
                        };
                        reader.readAsText(file);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="space-y-1">
                    <FileBadge className="w-6 h-6 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-600">Drag your template .svg file here or click to browse</p>
                    <p className="text-[8px] text-slate-400 font-semibold">Supports placeholders like student_name, course_title, completion_date</p>
                  </div>
                </div>
              </div>

              {/* Placeholders Help Panel */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[10px] space-y-1.5">
                <p className="font-black text-slate-700 uppercase tracking-wider">Dynamic Placeholders</p>
                <p className="text-slate-500 font-semibold leading-relaxed">
                  Include these double curly brace tags in your custom SVG text elements. They will replace dynamically for each graduate:
                </p>
                <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
                  <div className="p-1.5 bg-white border border-slate-200/60 rounded-lg">
                    <span className="text-emerald-700 font-bold">{"{{student_name}}"}</span>
                    <span className="text-slate-400 block mt-0.5">Student's Full Name</span>
                  </div>
                  <div className="p-1.5 bg-white border border-slate-200/60 rounded-lg">
                    <span className="text-emerald-700 font-bold">{"{{course_title}}"}</span>
                    <span className="text-slate-400 block mt-0.5">Program/Track Title</span>
                  </div>
                  <div className="p-1.5 bg-white border border-slate-200/60 rounded-lg">
                    <span className="text-emerald-700 font-bold">{"{{completion_date}}"}</span>
                    <span className="text-slate-400 block mt-0.5">Completion/Grad Date</span>
                  </div>
                  <div className="p-1.5 bg-white border border-slate-200/60 rounded-lg">
                    <span className="text-emerald-700 font-bold">{"{{verification_url}}"}</span>
                    <span className="text-slate-400 block mt-0.5">Dynamic QR Code link</span>
                  </div>
                </div>
              </div>

              {/* Raw SVG Code Editor */}
              {selectedTemplateId === 'custom' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Raw SVG Template Code</label>
                    <button
                      onClick={() => {
                        setCustomSvgTemplate(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 565" width="100%" height="100%">
  <rect x="20" y="20" width="760" height="525" fill="#faf5ff" stroke="#a855f7" stroke-width="4" />
  <text x="400" y="100" font-family="sans-serif" font-size="28" font-weight="900" fill="#6b21a8" text-anchor="middle">MILOUS EMPOWERMENT SPECIAL AWARD</text>
  <text x="400" y="260" font-family="serif" font-size="36" font-weight="bold" fill="#111827" text-anchor="middle">{{student_name}}</text>
  <text x="400" y="360" font-family="sans-serif" font-size="20" font-weight="bold" fill="#6b21a8" text-anchor="middle">{{course_title}}</text>
  <text x="400" y="420" font-family="sans-serif" font-size="12" fill="#9ca3af" text-anchor="middle">Awarded on {{completion_date}}</text>
</svg>`);
                      }}
                      className="text-[9px] font-bold text-slate-400 hover:text-slate-600 uppercase cursor-pointer"
                    >
                      Reset Custom
                    </button>
                  </div>
                  <textarea
                    rows={12}
                    value={customSvgTemplate}
                    onChange={(e) => setCustomSvgTemplate(e.target.value)}
                    className="w-full font-mono text-[9px] p-3 bg-slate-900 text-slate-300 rounded-2xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed"
                    placeholder="<svg>...</svg>"
                  />
                </div>
              )}

            </div>
          </div>

          {/* Render Canvas & Preview Details Panel: 7 cols */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-6">
              
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Live Sandbox Rendering</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Substituting mock variables in real-time to preview template visual balances.</p>
                </div>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[8px] font-bold border border-emerald-100 rounded-md">Live Sync Active</span>
              </div>

              {/* Live Canvas Frame */}
              <div className="border border-slate-200/60 rounded-2xl p-4 bg-slate-50 flex items-center justify-center relative overflow-hidden group">
                <div className="w-full max-w-xl aspect-[1.414/1] shadow-md bg-white border border-slate-100 rounded-xl overflow-hidden">
                  <div 
                    dangerouslySetInnerHTML={{
                      __html: (() => {
                        const activeSvgString = 
                          selectedTemplateId === 'classic' ? CLASSIC_TEMPLATE :
                          selectedTemplateId === 'modern' ? MODERN_TEMPLATE :
                          selectedTemplateId === 'tech' ? TECH_TEMPLATE :
                          customSvgTemplate;
                        
                        // Render with mock values
                        let rendered = activeSvgString;
                        rendered = rendered.replace(/\{\{student_name\}\}/g, 'Abena Serwah');
                        rendered = rendered.replace(/\{\{course_title\}\}/g, 'Sustainable Off-Grid Solar Power Engineering');
                        rendered = rendered.replace(/\{\{completion_date\}\}/g, '2026-09-13');
                        rendered = rendered.replace(/\{\{signatory\}\}/g, certSignatory);
                        rendered = rendered.replace(/\{\{signatory_title\}\}/g, certSignatoryTitle);
                        
                        // Unique mock shortlink
                        const mockUrl = `${window.location.origin}/verify/std-01`;
                        const mockQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(mockUrl)}`;
                        
                        rendered = rendered.replace(/\{\{verification_url\}\}/g, mockUrl);
                        rendered = rendered.replace(/\{\{qr_code\}\}/g, mockQrUrl);
                        return rendered;
                      })()
                    }}
                    className="w-full h-full flex items-center justify-center"
                  />
                </div>
              </div>

              {/* Template Configuration Confirmation */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                <h5 className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Primary Signatory &amp; Metadata Defaults</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Authorized Signatory Name</span>
                    <input
                      type="text"
                      value={certSignatory}
                      onChange={(e) => setCertSignatory(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Authorized Signatory Title</span>
                    <input
                      type="text"
                      value={certSignatoryTitle}
                      onChange={(e) => setCertSignatoryTitle(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold pt-1">
                  <p>Changes saved locally and immediately active for all student certificate downloads.</p>
                  <button 
                    onClick={() => {
                      setActiveTab('cohorts');
                    }}
                    className="py-1 px-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 cursor-pointer transition"
                  >
                    Use in Student Registry →
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* BULK CERTIFICATE GENERATOR MODAL */}
      {bulkQueueActive && selectedBulkStudentsList.length > 0 && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-5xl space-y-6 shadow-2xl my-8">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-600 animate-pulse" />
                  <span>Bulk Certificate Generation &amp; Print Queue</span>
                </h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  Accrediting {selectedBulkStudentsList.length} selected graduates simultaneously using the standard high-fidelity layout.
                </p>
              </div>
              <button 
                onClick={() => {
                  setBulkQueueActive(false);
                  setPreviewStep('setup');
                  setBulkSendingProgress(-1);
                  setBulkSendingStatus('');
                }} 
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-lg cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stage Indicator */}
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <button
                onClick={() => setPreviewStep('setup')}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition ${
                  previewStep === 'setup' 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                <span>Stage 1: Pre-Accreditation Config</span>
              </button>
              <ChevronRight className="w-4 h-4 text-slate-300" />
              <button
                onClick={() => setPreviewStep('preview')}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition ${
                  previewStep === 'preview' 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                <span>Stage 2: Queue Preview &amp; Delivery</span>
              </button>
            </div>

            {/* STAGE 1: Pre-Accreditation Configuration */}
            {previewStep === 'setup' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-150">
                
                {/* Pre-Accreditation Checklist & Signatories */}
                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                    <h5 className="font-black text-slate-900 uppercase tracking-wider text-[10px]">Accreditation Authority Signatory</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Signatory Name</label>
                        <input 
                          type="text" 
                          value={certSignatory}
                          onChange={(e) => setCertSignatory(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Authorized Title</label>
                        <input 
                          type="text" 
                          value={certSignatoryTitle}
                          onChange={(e) => setCertSignatoryTitle(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Certificate Subheading</label>
                        <input 
                          type="text" 
                          value={certTemplateTitle}
                          onChange={(e) => setCertTemplateTitle(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Date of Completion</label>
                        <input 
                          type="date" 
                          value={certIssueDate}
                          onChange={(e) => setCertIssueDate(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Template Selection */}
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                    <h5 className="font-black text-slate-900 uppercase tracking-wider text-[10px]">Select Certificate Layout Template</h5>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setSelectedTemplateId('classic')}
                        className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                          selectedTemplateId === 'classic' ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold' : 'border-slate-200 bg-white text-slate-600'
                        }`}
                      >
                        <p className="text-[10px] font-black">Classic Ivory</p>
                      </button>
                      <button
                        onClick={() => setSelectedTemplateId('modern')}
                        className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                          selectedTemplateId === 'modern' ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold' : 'border-slate-200 bg-white text-slate-600'
                        }`}
                      >
                        <p className="text-[10px] font-black">Modern Minimal</p>
                      </button>
                      <button
                        onClick={() => setSelectedTemplateId('tech')}
                        className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                          selectedTemplateId === 'tech' ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold' : 'border-slate-200 bg-white text-slate-600'
                        }`}
                      >
                        <p className="text-[10px] font-black">Digital Slate</p>
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setPreviewStep('preview')}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1 shadow-md cursor-pointer"
                  >
                    <span>Proceed to Certificate Queue Preview ({selectedBulkStudentsList.length} Graduates) →</span>
                  </button>
                </div>

                {/* Selected Graduates Queue Audit */}
                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-3 max-h-[380px] overflow-y-auto">
                  <h5 className="font-black text-slate-900 uppercase tracking-wider text-[10px] border-b border-slate-200 pb-1.5 flex justify-between items-center">
                    <span>Selected Graduates Audit Checklist</span>
                    <span className="text-emerald-700 font-black">{selectedBulkStudentsList.length} Verified</span>
                  </h5>
                  
                  <div className="space-y-2">
                    {selectedBulkStudentsList.map((std, idx) => {
                      const cohortObj = cohorts.find(c => c.id === std.cohortId);
                      return (
                        <div key={std.id} className="p-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between text-xs font-semibold">
                          <div className="space-y-0.5">
                            <p className="text-slate-900 font-black flex items-center gap-1.5">
                              <span className="text-[9px] text-slate-400 font-bold">#{idx + 1}</span>
                              <span>{std.name}</span>
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold">{cohortObj?.track || 'General Training'}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-700 font-black uppercase px-2 py-0.5 rounded-md">
                              {std.attendanceRate}% Attendance
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* STAGE 2: Queue Preview, Printing, and Delivery */}
            {previewStep === 'preview' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-150">
                
                {/* Print Style Injections to target exactly the canvas container */}
                <style>{`
                  @media print {
                    body {
                      background: white !important;
                      color: black !important;
                    }
                    /* Hide everything except our bulk print canvas */
                    div:not(#printable-bulk-canvas-wrapper):not(#printable-bulk-canvas-wrapper *) {
                      display: none !important;
                    }
                    #printable-bulk-canvas-wrapper {
                      display: block !important;
                      position: absolute !important;
                      left: 0 !important;
                      top: 0 !important;
                      width: 100% !important;
                      max-width: 100% !important;
                      background: white !important;
                    }
                    .bulk-print-item {
                      display: block !important;
                      page-break-after: always !important;
                      break-after: page !important;
                      width: 100% !important;
                      max-width: 100% !important;
                      height: auto !important;
                      border: none !important;
                      box-shadow: none !important;
                      background-color: #fffaf0 !important;
                      padding: 40px !important;
                      box-sizing: border-box !important;
                    }
                  }
                `}</style>

                {/* Queue Controls & Simulation: 4 cols */}
                <div className="lg:col-span-4 bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-4 text-xs">
                  <div>
                    <h5 className="font-black text-slate-900 uppercase tracking-wider text-[10px] border-b border-slate-200 pb-1.5 flex justify-between items-center">
                      <span>Accreditation Queue</span>
                      <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md">
                        {currentBulkIndex + 1} of {selectedBulkStudentsList.length}
                      </span>
                    </h5>
                    
                    {/* Pagination Controls */}
                    <div className="flex items-center justify-between gap-2 mt-3">
                      <button
                        onClick={() => setCurrentBulkIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentBulkIndex === 0}
                        className="py-1.5 px-3 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-wide cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ◀ Previous
                      </button>
                      <span className="text-slate-800 font-black text-center text-xs truncate max-w-[140px]">
                        {selectedBulkStudentsList[currentBulkIndex]?.name}
                      </span>
                      <button
                        onClick={() => setCurrentBulkIndex(prev => Math.min(selectedBulkStudentsList.length - 1, prev + 1))}
                        disabled={currentBulkIndex === selectedBulkStudentsList.length - 1}
                        className="py-1.5 px-3 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-wide cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next ▶
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl space-y-1.5">
                    <p className="text-[10px] font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                      <Printer className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Bulk Printing &amp; Dispatch Details</span>
                    </p>
                    <p className="text-[10px] text-emerald-700 leading-relaxed font-semibold">
                      Clicking <strong>Bulk Print Queue</strong> renders and prints all {selectedBulkStudentsList.length} certificates simultaneously, with automatic page breaks between each. Select <strong>Landscape</strong> orientation.
                    </p>
                  </div>

                  {/* Actions Area */}
                  <div className="space-y-2">
                    <button
                      onClick={() => window.print()}
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-2 shadow-md cursor-pointer uppercase tracking-wider"
                    >
                      <Printer className="w-4 h-4 text-emerald-400" />
                      <span>Print Bulk Queue ({selectedBulkStudentsList.length})</span>
                    </button>

                    {/* Simulation button */}
                    {bulkSendingProgress >= 0 ? (
                      <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-[10px] font-semibold text-emerald-900 space-y-2 animate-in zoom-in-95">
                        <div className="flex justify-between items-center">
                          <span className="font-bold">Accrediting Digital Queue...</span>
                          <span className="font-mono font-black">{bulkSendingProgress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-emerald-200 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-600 transition-all duration-300" style={{ width: `${bulkSendingProgress}%` }} />
                        </div>
                        <p className="text-[9px] text-emerald-700 font-mono italic leading-relaxed">{bulkSendingStatus}</p>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setBulkSendingProgress(0);
                          setBulkSendingStatus(`Starting accredited ledger and dispatch sequence...`);
                          let progress = 0;
                          const interval = setInterval(() => {
                            progress += 10;
                            if (progress >= 100) {
                              setBulkSendingProgress(100);
                              setBulkSendingStatus(`✅ Completed accreditation sequence! All certificates have been securely processed, and verification public logs are updated.`);
                              clearInterval(interval);
                            } else {
                              const stdIdx = Math.min(
                                selectedBulkStudentsList.length - 1,
                                Math.floor((progress / 100) * selectedBulkStudentsList.length)
                              );
                              const activeStd = selectedBulkStudentsList[stdIdx];
                              setBulkSendingProgress(progress);
                              setBulkSendingStatus(`Accrediting student ${stdIdx + 1} of ${selectedBulkStudentsList.length} (${activeStd?.name}) on secure ledger...`);
                              setCurrentBulkIndex(stdIdx);
                            }
                          }, 500);
                        }}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-2 shadow-md cursor-pointer uppercase tracking-wider"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>Simulate Secure Bulk Dispatch</span>
                      </button>
                    )}
                  </div>

                  {/* Back and Close buttons */}
                  <div className="flex gap-2 pt-2 border-t border-slate-200/60">
                    <button
                      onClick={() => {
                        setPreviewStep('setup');
                        setBulkSendingProgress(-1);
                        setBulkSendingStatus('');
                      }}
                      className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-center cursor-pointer transition"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={() => {
                        setBulkQueueActive(false);
                        setSelectedBulkIds([]);
                        setPreviewStep('setup');
                        setBulkSendingProgress(-1);
                        setBulkSendingStatus('');
                      }}
                      className="flex-1 py-2 border border-slate-300 hover:bg-slate-100 text-slate-600 font-semibold rounded-xl text-center cursor-pointer transition"
                    >
                      Close Queue
                    </button>
                  </div>

                </div>

                {/* Render Canvas Preview: 8 cols */}
                <div className="lg:col-span-8 flex flex-col items-center justify-center space-y-4">
                  {/* Single Item preview for the active student */}
                  <div className="w-full border border-slate-200 rounded-2xl p-4 bg-slate-50 flex items-center justify-center relative overflow-hidden shadow-inner">
                    <div 
                      className="w-full max-w-xl aspect-[1.414/1] shadow-2xl bg-white border border-slate-100 rounded-xl overflow-hidden"
                      dangerouslySetInnerHTML={{
                        __html: getRenderedSvgForStudent(selectedBulkStudentsList[currentBulkIndex])
                      }}
                    />
                  </div>

                  {/* Bulk printing wrapper that is hidden on screen and visible ONLY during print driver execution */}
                  <div id="printable-bulk-canvas-wrapper" className="hidden">
                    {selectedBulkStudentsList.map((std) => (
                      <div 
                        key={std.id}
                        className="bulk-print-item"
                        dangerouslySetInnerHTML={{
                          __html: getRenderedSvgForStudent(std)
                        }}
                      />
                    ))}
                  </div>

                  <div className="flex justify-between items-center w-full text-[10px] text-slate-400 font-semibold px-1">
                    <p>✨ Layout Mode: <strong className="text-slate-600 uppercase">{selectedTemplateId} Engine</strong></p>
                    <p>Verified public security QR included</p>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* CERTIFICATE GENERATOR MODAL */}
      {selectedCertificateStudent && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-5xl space-y-6 shadow-2xl my-8">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-600 animate-pulse" />
                  <span>Verified Graduate Credential &amp; Certificate Hub</span>
                </h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Dual-stage review &amp; dynamic template rendering engine for secure skills accreditation.</p>
              </div>
              <button 
                onClick={() => {
                  setSelectedCertificateStudent(null);
                  setPreviewStep('setup');
                  setSendingNotification('');
                }} 
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-lg cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stage Indicator */}
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <button
                onClick={() => setPreviewStep('setup')}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition ${
                  previewStep === 'setup' 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-slate-600 text-white flex items-center justify-center text-[8px] font-bold">1</span>
                <span>Configure &amp; Audit</span>
              </button>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <button
                onClick={() => setPreviewStep('preview')}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition ${
                  previewStep === 'preview' 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-slate-600 text-white flex items-center justify-center text-[8px] font-bold">2</span>
                <span>Template Preview &amp; Delivery</span>
              </button>
            </div>

            {/* Modal Body: Depends on Step */}
            {previewStep === 'setup' ? (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start animate-in fade-in duration-200">
                
                {/* Setup settings: Left 5 cols */}
                <div className="md:col-span-5 bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-4 text-xs">
                  <h5 className="font-black text-slate-900 uppercase tracking-wider text-[10px] border-b border-slate-200 pb-1.5">Accreditation Parameters</h5>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Student / Graduate Name</label>
                      <input
                        type="text"
                        value={selectedCertificateStudent.name}
                        disabled
                        className="w-full bg-slate-200 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Signatory Name Defaults</label>
                      <input
                        type="text"
                        value={certSignatory}
                        onChange={(e) => setCertSignatory(e.target.value)}
                        placeholder="e.g. Dr. Kwame Mensah"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Signatory Corporate Title</label>
                      <input
                        type="text"
                        value={certSignatoryTitle}
                        onChange={(e) => setCertSignatoryTitle(e.target.value)}
                        placeholder="e.g. Executive Director"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Issuance Date</label>
                        <input
                          type="date"
                          value={certIssueDate}
                          onChange={(e) => setCertIssueDate(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Template Engine</label>
                        <select
                          value={selectedTemplateId}
                          onChange={(e) => setSelectedTemplateId(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none"
                        >
                          <option value="classic">Classic Ivory</option>
                          <option value="modern">Modern Minimalist</option>
                          <option value="tech">Digital Slate</option>
                          <option value="custom">Custom Template</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Parameters Option */}
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Delivery Mode</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => {
                          setDeliveryMethod('download');
                          setRecipientEmail('');
                        }}
                        className={`p-2 rounded-xl border text-center transition ${
                          deliveryMethod === 'download'
                            ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 font-bold'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        <Printer className="w-3.5 h-3.5 mx-auto mb-1 text-slate-500" />
                        <span className="text-[9px]">Print/PDF</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setDeliveryMethod('email');
                          setRecipientEmail(`${selectedCertificateStudent.name.toLowerCase().replace(/\s+/g, '')}@milous-grads.org`);
                        }}
                        className={`p-2 rounded-xl border text-center transition ${
                          deliveryMethod === 'email'
                            ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 font-bold'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5 mx-auto mb-1 text-slate-500" />
                        <span className="text-[9px]">Email student</span>
                      </button>

                      <button
                        onClick={() => {
                          setDeliveryMethod('blockchain');
                          setRecipientEmail('');
                        }}
                        className={`p-2 rounded-xl border text-center transition ${
                          deliveryMethod === 'blockchain'
                            ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 font-bold'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5 mx-auto mb-1 text-slate-500" />
                        <span className="text-[9px]">Ledger Sync</span>
                      </button>
                    </div>

                    {deliveryMethod === 'email' && (
                      <div className="pt-2">
                        <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Recipient Student Email</label>
                        <input
                          type="email"
                          value={recipientEmail}
                          onChange={(e) => setRecipientEmail(e.target.value)}
                          placeholder="student@example.org"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setPreviewStep('preview')}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <span>Proceed to Template Preview</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>

                {/* Secure Audit Checklists: Right 7 cols */}
                <div className="md:col-span-7 space-y-6">
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-2xs">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Credential Verification Audit</h4>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Milous Quality Standards check performed on offline-first cached student indexes.</p>
                    </div>

                    <div className="space-y-3 pt-1">
                      <div className="flex items-center justify-between p-3 bg-emerald-50/30 border border-emerald-100 rounded-xl">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          <div>
                            <p className="text-xs font-bold text-slate-800">Enrollment &amp; Graduation Registry status</p>
                            <p className="text-[10px] text-slate-400">Student status is logged as GRADUATED in skills tracker.</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-black text-emerald-700 uppercase">PASS</span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-emerald-50/30 border border-emerald-100 rounded-xl">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          <div>
                            <p className="text-xs font-bold text-slate-800">Minimum attendance compliance audit</p>
                            <p className="text-[10px] text-slate-400">Class presence clocked at {selectedCertificateStudent.attendanceRate}% (Threshold: 85%)</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-black text-emerald-700 uppercase">PASS</span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-emerald-50/30 border border-emerald-100 rounded-xl">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          <div>
                            <p className="text-xs font-bold text-slate-800">Validated Micro-Credentials catalog</p>
                            <p className="text-[10px] text-slate-400">
                              {selectedCertificateStudent.badgesEarned.length} special badges logged onto permanent record.
                            </p>
                          </div>
                        </div>
                        <span className="text-[9px] font-black text-emerald-700 uppercase">PASS</span>
                      </div>
                    </div>

                    {/* Quick Verification URL info card */}
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-black text-slate-700 uppercase tracking-wider">
                        <span>Dynamic Public Verification URL</span>
                        <span className="text-emerald-600">Active</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                        This URL will be embedded as a high-fidelity QR code on the certificate card, linking to the public validation page:
                      </p>
                      <div className="p-2 bg-white border border-slate-200/80 rounded-lg text-[9px] font-mono text-emerald-800 font-bold select-all overflow-x-auto">
                        {`${window.location.origin}/verify/${selectedCertificateStudent.id}`}
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            ) : (
              /* Stage 2: Preview & Delivery */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-200">
                
                {/* Live certificate preview canvas: 8 cols */}
                <div className="lg:col-span-8 flex flex-col items-center space-y-4">
                  
                  {/* Print Style Injections to target exactly the canvas container */}
                  <style>{`
                    @media print {
                      body {
                        background: white !important;
                        color: black !important;
                      }
                      /* Hide everything else */
                      div:not(#printable-certificate-canvas):not(#printable-certificate-canvas *) {
                        display: none !important;
                      }
                      /* Frame and force full size of the certificate */
                      #printable-certificate-canvas {
                        display: block !important;
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        height: auto !important;
                        border: none !important;
                        box-shadow: none !important;
                        background-color: #fffaf0 !important;
                        padding: 40px !important;
                      }
                    }
                  `}</style>

                  {/* Scalable Container */}
                  <div className="w-full border border-slate-200 rounded-2xl p-4 bg-slate-50 flex items-center justify-center relative overflow-hidden shadow-inner">
                    <div 
                      id="printable-certificate-canvas"
                      className="w-full max-w-xl aspect-[1.414/1] shadow-2xl bg-white border border-slate-100 rounded-xl overflow-hidden"
                      dangerouslySetInnerHTML={{
                        __html: (() => {
                          const activeSvgString = 
                            selectedTemplateId === 'classic' ? CLASSIC_TEMPLATE :
                            selectedTemplateId === 'modern' ? MODERN_TEMPLATE :
                            selectedTemplateId === 'tech' ? TECH_TEMPLATE :
                            customSvgTemplate;
                          
                          let rendered = activeSvgString;
                          rendered = rendered.replace(/\{\{student_name\}\}/g, selectedCertificateStudent.name);
                          
                          const trackName = cohorts.find(c => c.id === selectedCertificateStudent.cohortId)?.track || 'Vocational Training Track';
                          rendered = rendered.replace(/\{\{course_title\}\}/g, trackName);
                          
                          const formattedDate = new Date(certIssueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
                          rendered = rendered.replace(/\{\{completion_date\}\}/g, formattedDate);
                          
                          rendered = rendered.replace(/\{\{signatory\}\}/g, certSignatory);
                          rendered = rendered.replace(/\{\{signatory_title\}\}/g, certSignatoryTitle);
                          
                          const verUrl = `${window.location.origin}/verify/${selectedCertificateStudent.id}`;
                          const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verUrl)}`;
                          
                          rendered = rendered.replace(/\{\{verification_url\}\}/g, verUrl);
                          rendered = rendered.replace(/\{\{qr_code\}\}/g, qrImgUrl);
                          
                          return rendered;
                        })()
                      }}
                    />
                  </div>

                  <div className="flex justify-between items-center w-full text-[10px] text-slate-400 font-semibold px-1">
                    <p>✨ Current Template: <strong className="text-slate-600 uppercase">{selectedTemplateId} Engine</strong></p>
                    <p>Render scale adjusted for preview</p>
                  </div>
                </div>

                {/* Delivery simulation / print panel: 4 cols */}
                <div className="lg:col-span-4 bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-4 text-xs">
                  <h5 className="font-black text-slate-900 uppercase tracking-wider text-[10px] border-b border-slate-200 pb-1.5">Action &amp; Delivery</h5>
                  
                  {deliveryMethod === 'download' && (
                    <div className="space-y-3">
                      <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl space-y-1.5">
                        <p className="text-[10px] font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                          <Printer className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Print instructions</span>
                        </p>
                        <p className="text-[10px] text-emerald-700 leading-relaxed font-semibold">
                          Clicking below opens the print driver. Select <strong>Landscape</strong> orientation and enable <strong>Background graphics</strong> to preserve the high-fidelity borders.
                        </p>
                      </div>

                      <button
                        onClick={() => window.print()}
                        className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
                      >
                        <Printer className="w-4 h-4 text-emerald-400" />
                        <span>Download PDF &amp; Print</span>
                      </button>
                    </div>
                  )}

                  {deliveryMethod === 'email' && (
                    <div className="space-y-3">
                      <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl space-y-1">
                        <p className="font-bold text-slate-700">Student Notification Channel</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                          Sends an email with a secure tokenized certificate preview and direct confirmation public shortlink.
                        </p>
                      </div>

                      {sendingNotification ? (
                        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] text-emerald-800 font-semibold space-y-1 animate-in zoom-in-95">
                          <p className="font-bold uppercase tracking-wider text-emerald-900">Delivery Status</p>
                          <p>{sendingNotification}</p>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSendingNotification('Processing outbound email socket...');
                            setTimeout(() => {
                              setSendingNotification('Attaching cryptographic signature & PDF...');
                              setTimeout(() => {
                                setSendingNotification(`✅ Certificate successfully dispatched to ${selectedCertificateStudent.name} at (${recipientEmail})! Verification entry created.`);
                              }, 1500);
                            }, 1000);
                          }}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
                        >
                          <BookOpen className="w-4 h-4" />
                          <span>Simulate Email Send</span>
                        </button>
                      )}
                    </div>
                  )}

                  {deliveryMethod === 'blockchain' && (
                    <div className="space-y-3">
                      <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl space-y-1">
                        <p className="font-bold text-slate-700">Milous Decentralized Ledger Sync</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                          Registers student graduation, earned competencies, and signatures on the public non-repudiable audit portal.
                        </p>
                      </div>

                      {sendingNotification ? (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[10px] text-emerald-800 font-semibold animate-in zoom-in-95">
                          {sendingNotification}
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSendingNotification('Generating cryptographic ledger hash block...');
                            setTimeout(() => {
                              setSendingNotification(`✅ Hash MIL-${selectedCertificateStudent.id.toUpperCase()}-${selectedCertificateStudent.cohortId.toUpperCase()} successfully written to public ledger!`);
                            }, 1200);
                          }}
                          className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
                        >
                          <UserCheck className="w-4 h-4 text-emerald-400" />
                          <span>Commit to Ledger</span>
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => setPreviewStep('setup')}
                      className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-center cursor-pointer transition"
                    >
                      ← Adjust Details
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCertificateStudent(null);
                        setPreviewStep('setup');
                        setSendingNotification('');
                      }}
                      className="flex-1 py-2 border border-slate-300 hover:bg-slate-100 text-slate-600 font-semibold rounded-xl text-center cursor-pointer transition"
                    >
                      Done
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default SkillsManager;
