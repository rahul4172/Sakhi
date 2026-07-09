import React, { useState } from 'react';
import FadeContent from './ui/FadeContent';
import { useLanguage } from '../contexts/LanguageContext';
import { User, Bell, Shield, Globe, Moon, Lock } from 'lucide-react';

export default function Settings() {
  const { language, changeLanguage } = useLanguage();
  const [notifications, setNotifications] = useState({
    push: true,
    sms: true,
    email: false,
    whatsapp: true
  });

  return (
    <FadeContent className="max-w-[1200px] mx-auto pb-12 space-y-8">
      <div>
        <h2 className="text-2xl font-display font-bold text-[#111827]">Settings</h2>
        <p className="text-sm text-[#6B7280] mt-1">Manage your account preferences and security.</p>
      </div>

      <div className="grid md:grid-cols-12 gap-8">
        
        {/* Sidebar Tabs (Desktop) */}
        <div className="md:col-span-3 space-y-2 hidden md:block">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary-50 text-primary-700 font-semibold text-sm transition-colors">
            <User className="w-4 h-4" /> Profile
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#4B5563] hover:bg-surface-50 font-medium text-sm transition-colors">
            <Globe className="w-4 h-4" /> Preferences
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#4B5563] hover:bg-surface-50 font-medium text-sm transition-colors">
            <Bell className="w-4 h-4" /> Notifications
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#4B5563] hover:bg-surface-50 font-medium text-sm transition-colors">
            <Shield className="w-4 h-4" /> Security
          </button>
        </div>

        {/* Settings Content */}
        <div className="md:col-span-9 space-y-8">
          
          {/* Profile Section */}
          <section className="premium-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <User className="w-5 h-5 text-primary-600" />
              <h3 className="font-bold text-[#111827] text-lg">Profile Information</h3>
            </div>
            
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 rounded-full bg-surface-100 border-2 border-surface-200 flex items-center justify-center overflow-hidden">
                <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Anita" alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div>
                <button className="bg-white border border-surface-200 px-4 py-2 rounded-lg text-sm font-semibold text-[#374151] hover:bg-surface-50 transition-colors shadow-sm">
                  Change Photo
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2">Full Name</label>
                <input type="text" defaultValue="Anita Sharma" className="w-full bg-surface-50 border border-surface-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2">Phone Number</label>
                <input type="text" defaultValue="+91 98765 43210" disabled className="w-full bg-surface-100 border border-surface-200 rounded-lg px-4 py-2.5 text-sm text-[#6B7280] outline-none cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2">Occupation</label>
                <input type="text" defaultValue="Tailoring Business" className="w-full bg-surface-50 border border-surface-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary-500 transition-colors" />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button className="bg-primary-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm">
                Save Changes
              </button>
            </div>
          </section>

          {/* Preferences Section */}
          <section className="premium-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <Globe className="w-5 h-5 text-primary-600" />
              <h3 className="font-bold text-[#111827] text-lg">Preferences</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2">App Language</label>
                <select 
                  value={language}
                  onChange={(e) => changeLanguage(e.target.value)}
                  className="w-full bg-surface-50 border border-surface-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary-500 transition-colors"
                >
                  <option value="en">English</option>
                  <option value="hi">हिंदी (Hindi)</option>
                  <option value="bn">বাংলা (Bengali)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2">App Theme</label>
                <div className="flex gap-4">
                  <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary-50 border border-primary-200 text-primary-700 rounded-lg text-sm font-semibold transition-colors">
                    <Moon className="w-4 h-4" /> Light Mode
                  </button>
                  <button disabled className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-surface-50 border border-surface-200 text-[#9CA3AF] rounded-lg text-sm font-medium cursor-not-allowed">
                    Dark Mode (Soon)
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Security Section */}
          <section className="premium-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="w-5 h-5 text-primary-600" />
              <h3 className="font-bold text-[#111827] text-lg">Security Settings</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-surface-100">
                <div>
                  <h4 className="font-semibold text-[#111827] text-sm">App Lock PIN</h4>
                  <p className="text-xs text-[#6B7280] mt-0.5">Require a 4-digit PIN when opening the app.</p>
                </div>
                <button className="bg-white border border-surface-200 px-4 py-2 rounded-lg text-sm font-semibold text-[#374151] hover:bg-surface-50 transition-colors">
                  Change PIN
                </button>
              </div>
              
              <div className="flex items-center justify-between py-3">
                <div>
                  <h4 className="font-semibold text-[#111827] text-sm">Biometric Login</h4>
                  <p className="text-xs text-[#6B7280] mt-0.5">Use fingerprint or face unlock to access SakhiCredit.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-surface-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success-500"></div>
                </label>
              </div>
            </div>
          </section>

        </div>
      </div>
    </FadeContent>
  );
}
