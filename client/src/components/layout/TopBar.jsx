import { Search, Bell, LogOut, ChevronDown, Menu, MessageSquare } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function TopBar({ onLogout, onToggleSidebar }) {
  const { language, changeLanguage } = useLanguage();

  return (
    <header className="h-16 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-6 sticky top-0 z-40">
      
      <div className="flex items-center gap-6 flex-1">
        <button onClick={onToggleSidebar} className="text-gray-400 hover:text-gray-600 transition-colors md:hidden">
          <Menu className="w-5 h-5" />
        </button>

        {/* Search */}
        <div className="flex-1 max-w-3xl relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search anything..."
            className="w-full bg-white border border-[#E5E7EB] rounded-lg py-2 pl-10 pr-4 text-xs text-[#111827] outline-none transition-all duration-200 focus:border-primary-300 focus:ring-2 focus:ring-primary-50"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4 ml-6">
        
        {/* Language Toggle */}
        <div className="relative group cursor-pointer flex items-center gap-1.5 bg-surface-50 border border-[#E5E7EB] py-1.5 px-3 rounded-md text-xs font-medium text-[#475569] hover:bg-surface-100 transition-colors">
          <span>{language === 'en' ? 'English' : language === 'hi' ? 'Hindi' : 'Bengali'}</span>
          <ChevronDown className="w-3 h-3" />
          
          <div className="absolute top-full right-0 mt-1 w-32 bg-white rounded-lg shadow-premium border border-[#E5E7EB] py-1 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-200 z-50">
            <button onClick={() => changeLanguage('en')} className="w-full text-left px-3 py-1.5 text-xs hover:bg-surface-50">English</button>
            <button onClick={() => changeLanguage('hi')} className="w-full text-left px-3 py-1.5 text-xs hover:bg-surface-50">Hindi</button>
            <button onClick={() => changeLanguage('bn')} className="w-full text-left px-3 py-1.5 text-xs hover:bg-surface-50">Bengali</button>
          </div>
        </div>

        {/* Notifications */}
        <button className="relative p-1.5 text-gray-400 hover:text-primary-600 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-danger-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-bold text-white">3</span>
        </button>

        <button className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors">
          <MessageSquare className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-200 mx-1"></div>

        {/* Logout */}
        <button 
          onClick={onLogout}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-danger-500 transition-colors px-2 py-1.5 border border-[#E5E7EB] rounded-md hover:bg-surface-50"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>

      </div>
    </header>
  );
}
