import React, { useState } from 'react';
import BillerDirectory from './BillerDirectory';
import PaymentWizard from './PaymentWizard';
import TransactionHistory from './TransactionHistory';
import { useSocket } from '../../hooks/useSocket';
import { Bell, ShieldCheck } from 'lucide-react';
import FadeContent from '../ui/FadeContent';
import { useLanguage } from '../../contexts/LanguageContext';

export default function BBPSLayout({ sessionId }: { sessionId: string }) {
  const [selectedBiller, setSelectedBiller] = useState<any>(null);
  const { isConnected } = useSocket(sessionId);
  const { t } = useLanguage();

  return (
    <FadeContent className="max-w-[1200px] mx-auto pb-24 space-y-8">
      {/* Header Banner */}
      <div className="bg-[#2D213F] rounded-[18px] p-8 shadow-premium text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <ShieldCheck className="w-48 h-48" />
        </div>
        
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-semibold text-white/90 mb-3 border border-white/20">
            <ShieldCheck className="w-3.5 h-3.5" /> BBPS Secure
          </div>
          <h2 className="text-3xl font-display font-bold text-white mb-2">{t('pay_bills_title')}</h2>
          <p className="text-white/80 leading-relaxed">
            {t('pay_bills_subtitle')}
          </p>
        </div>

        <div className="relative z-10 bg-white/10 border border-white/20 p-4 rounded-2xl flex items-center gap-3 backdrop-blur-sm">
          <div className="relative">
            <Bell className="w-6 h-6 text-white" />
            {isConnected && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-success-500 border border-white"></span>
              </span>
            )}
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-widest text-white/70 font-bold mb-0.5">{t('system_status')}</span>
            <span className="text-sm font-semibold text-white">
              {isConnected ? t('live_secure') : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {!selectedBiller ? (
        <div className="grid lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="lg:col-span-7">
            <BillerDirectory onSelectBiller={setSelectedBiller} />
          </div>
          <div className="lg:col-span-5">
            <TransactionHistory sessionId={sessionId} />
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-right-8 duration-300">
          <PaymentWizard 
            biller={selectedBiller} 
            sessionId={sessionId} 
            onBack={() => setSelectedBiller(null)} 
          />
        </div>
      )}
    </FadeContent>
  );
}
