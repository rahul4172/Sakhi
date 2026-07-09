import { 
  Home, 
  CreditCard, 
  TrendingUp, 
  Home as HomeIcon, 
  PieChart, 
  Search, 
  GraduationCap, 
  Target, 
  Users, 
  FileText, 
  HelpCircle, 
  Settings,
  Bot,
  Menu,
  CheckCircle2,
  Gift
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function Sidebar({ profile, onNavigate, activeTab = 'home', isOpen, onClose }) {
  const { t } = useLanguage();

  const navItems = [
    { id: 'home', icon: <Home className="w-4 h-4" />, label: 'Dashboard' },
    { id: 'bbps', icon: <CreditCard className="w-4 h-4" />, label: 'Pay Bills (BBPS)' },
    { id: 'score', icon: <TrendingUp className="w-4 h-4" />, label: 'My SakhiScore' },
    { id: 'rewards', icon: <Gift className="w-4 h-4" />, label: 'Sakhi Rewards' },
    { id: 'griha', icon: <HomeIcon className="w-4 h-4" />, label: 'Griha (Household)' },
    { id: 'analytics', icon: <PieChart className="w-4 h-4" />, label: 'Income & Expenses' },
    { id: 'matchmaker', icon: <Search className="w-4 h-4" />, label: 'Loan Matches' },
    { id: 'literacy', icon: <GraduationCap className="w-4 h-4" />, label: 'Financial Learn' },
    { id: 'schemes', icon: <FileText className="w-4 h-4" />, label: 'Schemes & Benefits' },
    { id: 'goals', icon: <Target className="w-4 h-4" />, label: 'Goals' },
    ...(profile?.occupation === 'SHG member' ? [{ id: 'group', icon: <Users className="w-4 h-4" />, label: 'Community' }] : []),
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity" 
          onClick={onClose}
        />
      )}
      
      <aside className={`w-64 h-screen bg-[#2D213F] text-white flex flex-col fixed left-0 top-0 overflow-y-auto hide-scrollbar z-50 shadow-2xl transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        {/* Brand & User Profile */}
      <div className="p-5 pt-8 border-b border-white/5">
        <div className="flex items-center gap-3 mb-8">
          <div className="text-[#E5B59E]">
            {/* SVG placeholder for SakhiCredit flower logo */}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 2a7 7 0 0 0-7 7c0 2.5 2 5 7 9 5-4 7-6.5 7-9a7 7 0 0 0-7-7z"/></svg>
          </div>
          <div>
            <h1 className="text-xl font-display font-bold tracking-tight text-white leading-tight">SakhiCredit</h1>
            <p className="text-[10px] text-white/60 tracking-wider">Empowering Women Financially</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 border-2 border-[#E5B59E]">
            <img 
              src={`https://api.dicebear.com/7.x/notionists/svg?seed=${profile?.name || 'Anita'}`} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="text-[10px] text-white/60">Good morning,</p>
            <p className="text-sm font-semibold truncate max-w-[140px] text-white">{profile?.name || 'Anita Sharma'}</p>
            <div className="flex items-center gap-1 mt-1 bg-white/10 w-fit px-2 py-1 rounded-full border border-white/10">
              <CheckCircle2 className="w-3 h-3 text-[#E5B59E]" />
              <span className="text-[9px] text-white/80 pr-1 font-medium">Verified User</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 group ${
                isActive 
                  ? 'bg-[#B3648B] text-white' 
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className={isActive ? 'text-white' : 'text-white/40 group-hover:text-white transition-colors'}>{item.icon}</div>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Nav */}
      <div className="px-3 space-y-1">
        <button onClick={() => { onNavigate('documents'); onClose?.(); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium text-white/60 hover:bg-white/5 hover:text-white transition-colors">
          <FileText className="w-4 h-4 text-white/40" />
          <span>Documents</span>
        </button>
        <button onClick={() => { onNavigate('support'); onClose?.(); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium text-white/60 hover:bg-white/5 hover:text-white transition-colors">
          <HelpCircle className="w-4 h-4 text-white/40" />
          <span>Help & Support</span>
        </button>
        <button onClick={() => { onNavigate('settings'); onClose?.(); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium text-white/60 hover:bg-white/5 hover:text-white transition-colors">
          <Settings className="w-4 h-4 text-white/40" />
          <span>Settings</span>
        </button>
      </div>

      {/* AI Promo Block */}
      <div className="m-4 p-4 rounded-xl bg-[#985374] relative overflow-hidden mt-4">
        <h4 className="text-[11px] font-bold text-white mb-0.5 relative z-10">Need Personal Help?</h4>
        <p className="text-[9px] text-white/80 mb-3 relative z-10">Talk to Sakhi AI Assistant</p>
        <button 
          onClick={() => { onNavigate('literacy'); onClose?.(); }}
          className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-semibold py-1.5 px-4 rounded-md transition-colors border border-white/20 w-max relative z-10"
        >
          Chat Now
        </button>
        <Bot className="w-20 h-20 text-white/10 absolute -right-4 -bottom-4 z-0 opacity-50" />
      </div>

    </aside>
    </>
  );
}
