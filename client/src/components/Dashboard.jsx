import { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import ScoreSimulator from './ScoreSimulator';
import RewardsDashboard from './RewardsDashboard';
import FinancialLiteracy from './FinancialLiteracy';
import SchemeMatchmaker from './SchemeMatchmaker';
import GroupDashboard from './GroupDashboard';
import GrihaDashboard from './GrihaDashboard';
import BBPSLayout from './bbps/BBPSLayout';
import AdminDashboard from './bbps/AdminDashboard';
import Sidebar from './layout/Sidebar';
import TopBar from './layout/TopBar';
import HomeDashboard from './HomeDashboard';
import GoalsDashboard from './GoalsDashboard';
import IncomeExpensesDashboard from './IncomeExpensesDashboard';
import Documents from './Documents';
import HelpSupport from './HelpSupport';
import Settings from './Settings';
import { useSocket } from '../hooks/useSocket';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Hand, PartyPopper } from 'lucide-react';
import { useDashboardData } from '../hooks/queries/core';

export default function Dashboard({ sessionId, onLogout }) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('home');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [insight, setInsight] = useState('');
  const [toast, setToast] = useState(null);
  
  const { socket } = useSocket(sessionId);
  const { data: dashboardData, isLoading, isError, refetch } = useDashboardData(sessionId);

  useEffect(() => {
    if (!socket) return;

    socket.on('payment_success', (data) => {
      setToast(`Payment of ₹${data.amount} successful!`);
      setTimeout(() => setToast(null), 5000);
      refetch();
    });

    socket.on('score_updated', (data) => {
      setToast(
        <div className="flex items-center gap-2">
          <PartyPopper className="w-4 h-4 text-warning-400" />
          <span>{data.reason}: SakhiScore increased by +{data.points}!</span>
        </div>
      );
      setTimeout(() => setToast(null), 5000);
      refetch();
    });

    socket.on('tokens_updated', (data) => {
      setToast(
        <div className="flex items-center gap-2">
          <PartyPopper className="w-4 h-4 text-warning-400" />
          <span>Success! Earned +{data.earned} Sakhi Coins!</span>
        </div>
      );
      setTimeout(() => setToast(null), 5000);
      refetch();
    });

    return () => {
      socket.off('payment_success');
      socket.off('score_updated');
      socket.off('tokens_updated');
    };
  }, [socket, refetch]);

  if (isLoading) return (
    <div className="flex h-screen items-center justify-center bg-surface-50 font-sans">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-surface-200 border-t-primary-600 rounded-full animate-spin"></div>
        <p className="text-surface-500 font-medium text-lg">Loading your secure dashboard...</p>
      </div>
    </div>
  );
  
  if (isError || !dashboardData) return (
    <div className="flex h-screen items-center justify-center bg-surface-50 font-sans">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-danger-50 text-danger-500 rounded-full flex items-center justify-center mx-auto shadow-sm ring-8 ring-danger-50/50">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-[#111827]">Failed to load profile</h2>
        <button onClick={onLogout} className="bg-[#2D213F] text-white px-6 py-2 rounded-xl font-medium">Return to Login</button>
      </div>
    </div>
  );

  const { profile, financials, recentActivity } = dashboardData;

  const handleNavigate = (tab) => {
    setActiveTab(tab);
    setIsMobileSidebarOpen(false); // Close sidebar on mobile after navigating
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50 font-sans">
      <Sidebar 
        profile={profile} 
        onNavigate={handleNavigate} 
        activeTab={activeTab}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col md:ml-64 w-full h-screen overflow-hidden bg-surface-50 relative">
        <TopBar onLogout={onLogout} onToggleSidebar={() => setIsMobileSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          
          {/* Header Greeting inside main content for tabs that need it */}
          {activeTab === 'home' && (
            <div className="max-w-[1200px] mx-auto mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
              <div>
                <h2 className="text-3xl font-display font-bold text-[#111827] flex items-center gap-2">
                  Good morning, {profile.name.split(' ')[0]} <Hand className="w-8 h-8 text-amber-500 animate-wave origin-bottom-right" />
                </h2>
                <p className="text-[#6B7280] font-medium mt-1">Here's what's happening with your finances today.</p>
              </div>
              <div className="text-xs text-[#6B7280] flex items-center gap-1 font-medium bg-white px-3 py-1.5 rounded-lg border border-surface-100 shadow-sm">
                <span>Last updated: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            </div>
          )}

          {/* Toast Notification */}
          <AnimatePresence>
            {toast && (
              <motion.div 
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                className="fixed bottom-6 right-6 z-50 bg-[#111827] text-white px-6 py-4 rounded-[16px] shadow-premium-hover flex items-center gap-3"
              >
                <CheckCircle2 className="w-6 h-6 text-success-400" />
                <span className="text-sm font-medium leading-relaxed">{toast}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              {activeTab === 'home' && <HomeDashboard profile={profile} financials={financials} recentActivity={recentActivity} insight={insight} onNavigate={setActiveTab} />}
              {activeTab === 'bbps' && <div className="max-w-4xl mx-auto"><BBPSLayout sessionId={sessionId} /></div>}
              {activeTab === 'score' && <div className="max-w-4xl mx-auto"><ScoreSimulator profile={profile} sessionId={sessionId} scoreFactors={dashboardData.scoreFactors} /></div>}
              {activeTab === 'rewards' && <div className="max-w-4xl mx-auto"><RewardsDashboard sessionId={sessionId} profile={profile} onScoreUpdate={refetch} /></div>}
              {activeTab === 'griha' && <div className="max-w-4xl mx-auto"><GrihaDashboard profile={profile} sessionId={sessionId} /></div>}
              {activeTab === 'literacy' && <div className="max-w-4xl mx-auto"><FinancialLiteracy sessionId={sessionId} /></div>}
              {activeTab === 'matchmaker' && <div className="max-w-4xl mx-auto"><SchemeMatchmaker profile={profile} sessionId={sessionId} /></div>}
              {activeTab === 'group' && <div className="max-w-4xl mx-auto"><GroupDashboard sessionId={sessionId} /></div>}
              {activeTab === 'admin' && <div className="max-w-4xl mx-auto"><AdminDashboard /></div>}
              {activeTab === 'goals' && <GoalsDashboard sessionId={sessionId} />}
              {activeTab === 'analytics' && <IncomeExpensesDashboard sessionId={sessionId} />}
              {activeTab === 'documents' && <Documents />}
              {activeTab === 'support' && <HelpSupport />}
              {activeTab === 'settings' && <Settings />}
            </motion.div>
          </AnimatePresence>
          
        </main>
      </div>
    </div>
  );
}
