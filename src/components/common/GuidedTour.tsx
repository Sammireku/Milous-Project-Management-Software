import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Compass,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface TourStep {
  selector: string;
  title: string;
  content: string;
  path: string; // The URL that this step belongs to
}

export const GuidedTour: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userRole, currentUser } = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number; position: 'absolute' | 'fixed' } | null>(null);

  // Define steps per role
  const getTourSteps = (): TourStep[] => {
    const role = userRole || 'FIELD_OFFICER';
    
    if (role === 'FINANCE_OFFICER') {
      return [
        {
          selector: '#nav-financials',
          title: 'Welcome, Finance Officer!',
          content: 'This guided tour will walk you through your financial ledger workspace. Let\'s begin by heading to the main Financial Suite.',
          path: '/financials'
        },
        {
          selector: '#donor-allocator-card',
          title: 'Multi-Donor Cost Splitting',
          content: 'Here, project expenditures are fractionally divided across institutional donors (USAID, EU, UNHCR, etc.) in real time. Hover or click on the splits to view allocations.',
          path: '/financials'
        },
        {
          selector: '#fiduciary-audit-card',
          title: 'AI Fiduciary Compliance & Risk Audit',
          content: 'This workspace processes files via the Google Cloud DLP API and Gemini to flag duplicate invoicing, reconcile figures, and confirm recipient anonymity.',
          path: '/financials'
        }
      ];
    } else if (role === 'ME_OFFICER') {
      return [
        {
          selector: '#nav-indicators',
          title: 'Welcome, M&E Director!',
          content: 'This tour highlights our monitoring & evaluation toolsets. First, let\'s navigate to the main Logical Framework Indicators page.',
          path: '/indicators'
        },
        {
          selector: '#indicator-grid',
          title: 'M&E Indicator Matrix',
          content: 'Monitor live indicators and baseline targets. Updates made here stream directly into our BigQuery data pipelines and Looker analytical models.',
          path: '/indicators'
        },
        {
          selector: '#nav-documents',
          title: 'Document & Forms Generator',
          content: 'Deploy mobile baseline surveys to field staff via Google Forms, and use the Gemini Drafter to generate grounded, audit-ready donor reports.',
          path: '/document-hub'
        }
      ];
    } else {
      // Standard Tour for PMs, Admins, CEOs, and other roles
      return [
        {
          selector: '#nav-dashboard',
          title: 'Executive Program Dashboard',
          content: 'Welcome to your master coordination hub! View high-level portfolios, active project burn rates, pending compliance audits, and real-time alerts.',
          path: '/dashboard'
        },
        {
          selector: '#nav-tasks',
          title: 'Kanban Deliverables',
          content: 'Coordinate field activities, track task durations, and approve active team milestones on our interactive Kanban workspace.',
          path: '/my-todo'
        },
        {
          selector: '#nav-documents',
          title: 'AI Document Hub',
          content: 'Draft USAID-compliant technical reports and grant proposals from live database records without hallucinations using RAG and Gemini.',
          path: '/document-hub'
        }
      ];
    }
  };

  const steps = getTourSteps();
  const currentStep = steps[currentStepIndex];

  // Auto-navigate to correct page on step change
  useEffect(() => {
    if (!isOpen || !currentStep) return;
    
    // Check if we are on the wrong page
    const currentPath = location.pathname;
    if (currentStep.path !== currentPath && currentStep.path !== '/') {
      // If the current path is just empty or alias, handle alignment
      if (!(currentPath === '/' && currentStep.path === '/dashboard') && 
          !(currentPath === '/dashboard' && currentStep.path === '/')) {
        navigate(currentStep.path);
      }
    }
  }, [currentStepIndex, isOpen, currentStep?.path, location.pathname, navigate]);

  // Position tooltip relative to targeted element
  useEffect(() => {
    if (!isOpen || !currentStep) {
      setTooltipPos(null);
      return;
    }

    // Set a timeout to allow the DOM/page transition to render completely
    const timeout = setTimeout(() => {
      const element = document.querySelector(currentStep.selector);
      if (element) {
        const rect = element.getBoundingClientRect();
        
        // Calculate appropriate offset depending on screen space
        const top = rect.bottom + window.scrollY + 10;
        const left = Math.max(10, rect.left + window.scrollX - 40);
        
        setTooltipPos({
          top,
          left,
          position: 'absolute'
        });
        
        // Scroll target into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        // Fallback to centered/bottom-right floating mode if element is not in DOM
        setTooltipPos(null);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [currentStepIndex, isOpen, currentStep?.selector, location.pathname]);

  const handleStartTour = () => {
    setCurrentStepIndex(0);
    setIsOpen(true);
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      setIsOpen(false);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  return (
    <>
      {/* Floating Tour Guide Button */}
      <button
        type="button"
        onClick={handleStartTour}
        className="fixed bottom-24 right-6 z-40 px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center space-x-2 shadow-2xl border border-slate-700 transition cursor-pointer"
        title="Launch lightweight guided tour of your role-specific dashboard modules"
      >
        <Compass className="w-4 h-4 text-emerald-400 animate-spin-slow" />
        <span>Guided Tour ({userRole?.replace('_', ' ') || 'Staff'})</span>
      </button>

      {/* Tour Modal Overlay & Card */}
      {isOpen && currentStep && (
        <div className="fixed inset-0 z-50 pointer-events-none select-none">
          {/* Subtle Dim Backdrop (does not block click, just highlights) */}
          <div className="absolute inset-0 bg-slate-950/25 backdrop-blur-[1px] transition-all" />

          {/* Tooltip Card container */}
          <div
            style={
              tooltipPos 
                ? { 
                    top: `${tooltipPos.top}px`, 
                    left: `${tooltipPos.left}px`,
                    position: tooltipPos.position
                  }
                : {
                    bottom: '80px',
                    right: '24px',
                    position: 'fixed'
                  }
            }
            className="w-80 p-5 rounded-3xl bg-white border border-slate-200 shadow-2xl pointer-events-auto select-text flex flex-col space-y-4 z-50 max-w-[90vw] transition-all duration-300"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                  Platform Tour
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <h4 className="text-sm font-black text-slate-900 leading-snug">
                {currentStep.title}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                {currentStep.content}
              </p>
            </div>

            {/* Progress and Navigation */}
            <div className="pt-2 flex items-center justify-between text-xs font-bold border-t border-slate-100">
              <span className="text-[10px] text-slate-400 font-mono">
                Step {currentStepIndex + 1} of {steps.length}
              </span>

              <div className="flex items-center space-x-1.5">
                {currentStepIndex > 0 && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-extrabold flex items-center space-x-1 transition cursor-pointer"
                >
                  <span>{currentStepIndex === steps.length - 1 ? 'Finish' : 'Next'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
