import React, { useState } from 'react';
import { 
  X, 
  HelpCircle, 
  MessageSquare, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  Info, 
  LifeBuoy, 
  Bot, 
  User as UserIcon,
  ShieldCheck
} from 'lucide-react';
import { User } from '../../types';

interface DashboardHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onSendMessage: (subject: string, message: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
}

export const DashboardHelpModal: React.FC<DashboardHelpModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSendMessage,
}) => {
  const [activeView, setActiveView] = useState<'overview' | 'contact' | 'chat'>('overview');

  // Contact form state
  const [contactSubject, setContactSubject] = useState('General Inquiries & Guidance');
  const [contactMessage, setContactMessage] = useState('');
  const [isContactSent, setIsContactSent] = useState(false);

  // Chat with us state
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      sender: 'assistant',
      text: `Hello ${currentUser?.displayName || 'there'}! Welcome to Milous Project Support. How can we help you configure your dashboard, manage grants, or capture field data today?`,
      time: 'Just now',
    },
  ]);

  if (!isOpen) return null;

  const handleSendContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactMessage.trim()) return;

    onSendMessage(contactSubject, contactMessage.trim());
    setIsContactSent(true);
    setContactMessage('');
    setTimeout(() => {
      setIsContactSent(false);
      setActiveView('overview');
    }, 3000);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    const query = chatInput.trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      time: 'Just now',
    };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput('');

    // Generate intelligent instant support response
    setTimeout(() => {
      let botResponse = "Thank you for reaching out! We have logged your request. You can also explore our Reports, Stocks, and Maintenance modules from the side navigation.";
      const lower = query.toLowerCase();

      if (lower.includes('filter') || lower.includes('parameter')) {
        botResponse = "To filter your dashboard, click the Sliders/Filter icon in the top dashboard bar to set parameters by Assignee, Geographic Location, or Project!";
      } else if (lower.includes('color') || lower.includes('theme') || lower.includes('design')) {
        botResponse = "You can customize colors, card corner radiuses, and density using the Pen/Write icon right next to the filter button!";
      } else if (lower.includes('share') || lower.includes('whatsapp') || lower.includes('email')) {
        botResponse = "Use the Share icon to share with colleagues. Only System Administrators and CEOs have authority to dispatch external invitations via WhatsApp or Email.";
      } else if (lower.includes('public') || lower.includes('link') || lower.includes('globe')) {
        botResponse = "Click the Globe icon to generate a view-only external link. External viewers can inspect widgets without edit rights or access to private item details.";
      } else if (lower.includes('offline') || lower.includes('sync')) {
        botResponse = "Milous Project is built offline-first! Any changes you make while offline are queued in local memory and synchronized when your network reconnects.";
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: botResponse,
        time: 'Just now',
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Milous Project Guide & Help</h3>
              <p className="text-[10px] text-slate-400">Application description, support contact, and live chat</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600 shrink-0">
          <button
            type="button"
            onClick={() => setActiveView('overview')}
            className={`flex-1 py-2.5 text-center border-b-2 transition flex items-center justify-center space-x-1.5 ${
              activeView === 'overview'
                ? 'border-emerald-600 text-slate-900 bg-white font-black'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Info className="w-3.5 h-3.5 text-emerald-600" />
            <span>About Milous Project</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('contact')}
            className={`flex-1 py-2.5 text-center border-b-2 transition flex items-center justify-center space-x-1.5 ${
              activeView === 'contact'
                ? 'border-emerald-600 text-slate-900 bg-white font-black'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <LifeBuoy className="w-3.5 h-3.5 text-blue-600" />
            <span>Let Us Know (Contact)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('chat')}
            className={`flex-1 py-2.5 text-center border-b-2 transition flex items-center justify-center space-x-1.5 ${
              activeView === 'chat'
                ? 'border-emerald-600 text-slate-900 bg-white font-black'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
            <span>Chat With Us</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 text-xs overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: ABOUT / BRIEF DESCRIPTION */}
          {activeView === 'overview' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold uppercase">
                    Milous Project (MP)
                  </span>
                  <span className="text-[10px] text-slate-400">Institutional Platform</span>
                </div>
                <h4 className="text-sm font-bold text-white">
                  Humanitarian Grant & Field Operations System
                </h4>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Milous Project (MP) is an institutional-grade NGO project and grant management platform designed for resilient offline operation, multi-donor expense allocations, field impact telemetry, equipment maintenance, and automated donor reporting.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="font-bold text-slate-800">Offline Resilience</div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Operate seamlessly in remote field clinics and rural water points without network coverage. Automatic bidirectional sync upon reconnecting.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="font-bold text-slate-800">Multi-Donor Allocations</div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Split every grant deliverable, task, and invoice across USAID, EU, and UNICEF ledgers with strict financial compliance.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                <div className="font-bold flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Need assistance or prompt support?</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Use the <strong>Let Us Know</strong> tab to send our operations support desk a message, or switch to <strong>Chat With Us</strong> for instant guidance.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: CONTACT BOX */}
          {activeView === 'contact' && (
            <div className="space-y-3">
              <div className="font-bold text-slate-800 text-sm">
                Let Us Know If You Need Help
              </div>
              <p className="text-slate-500 text-[11px]">
                Submit your inquiry or issue directly to the Milous Project technical and operations team. We respond within 24 hours.
              </p>

              {isContactSent && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center space-x-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Your message has been dispatched to the support desk!</span>
                </div>
              )}

              <form onSubmit={handleSendContact} className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Your Name & Role</label>
                  <input
                    type="text"
                    readOnly
                    value={`${currentUser?.displayName || 'Milou Mireku'} (${currentUser?.role || 'team_member'})`}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-700"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Inquiry Topic *</label>
                  <select
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-900 bg-white"
                  >
                    <option value="General Inquiries & Guidance">General Inquiries & Guidance</option>
                    <option value="Offline Sync or Data Error">Offline Sync or Data Error</option>
                    <option value="Multi-Donor Allocation Question">Multi-Donor Allocation Question</option>
                    <option value="Stock & Inventory Requisition Support">Stock & Inventory Requisition Support</option>
                    <option value="Feature Request or Enhancement">Feature Request or Enhancement</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Message & Context *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe how we can assist you with your mission or dashboard..."
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveView('overview')}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center space-x-1.5 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Send Message</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: CHAT WITH US */}
          {activeView === 'chat' && (
            <div className="flex flex-col h-[340px] space-y-3">
              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto space-y-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                {messages.map((m) => {
                  const isAssistant = m.sender === 'assistant';
                  return (
                    <div
                      key={m.id}
                      className={`flex items-start space-x-2 ${
                        isAssistant ? 'justify-start' : 'justify-end'
                      }`}
                    >
                      {isAssistant && (
                        <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div
                        className={`p-2.5 rounded-xl max-w-[80%] text-[11px] leading-relaxed ${
                          isAssistant
                            ? 'bg-white border border-slate-200 text-slate-800'
                            : 'bg-slate-900 text-white'
                        }`}
                      >
                        {m.text}
                        <div
                          className={`text-[9px] mt-1 ${
                            isAssistant ? 'text-slate-400' : 'text-slate-300'
                          }`}
                        >
                          {m.time}
                        </div>
                      </div>
                      {!isAssistant && (
                        <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 text-[10px] font-bold">
                          {currentUser?.displayName ? currentUser.displayName.slice(0, 1) : 'U'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendChat} className="flex items-center space-x-2 shrink-0">
                <input
                  type="text"
                  placeholder="Ask a question about your dashboard, grants, or tasks..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-slate-300 transition shrink-0 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
