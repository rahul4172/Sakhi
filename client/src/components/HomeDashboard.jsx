import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { 
  Zap, 
  TrendingUp, 
  Receipt, 
  PiggyBank, 
  ArrowRight, 
  Wallet, 
  Landmark, 
  BookOpen, 
  Bot, 
  Gift,
  Smartphone,
  Flame,
  Award
} from 'lucide-react';
import StatCard from './ui/StatCard';
import ActionIcon from './ui/ActionIcon';
import CountUp from './ui/CountUp';

// Deleting simulated scoreData array

// Deleting simulated pieData and scoreData arrays

export default function HomeDashboard({ profile, financials, recentActivity, insight, onNavigate }) {
  const currentScore = profile?.currentScore || 0;
  const totalIncome = financials?.totalIncome || 0;
  const totalExpenses = financials?.totalExpenses || 0;

  const scoreHistoryData = useMemo(() => {
    if (!profile?.scoreHistory || profile.scoreHistory.length === 0) {
      return [{ name: 'Start', score: 0 }];
    }
    return profile.scoreHistory.map((item, index) => ({
      name: new Date(item.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      score: item.score
    }));
  }, [profile]);

  // 1. Dynamic Financial Confidence calculation
  const confidenceScore = currentScore;
  const confidenceLevel = useMemo(() => {
    if (confidenceScore === 0) return { text: 'No Data', status: 'Add logs to start', colorClass: 'bg-surface-100 text-surface-700 border border-surface-200' };
    if (confidenceScore <= 35) return { text: 'Needs Build', status: 'Build savings habit', colorClass: 'bg-danger-50 text-danger-800 border border-danger-100' };
    if (confidenceScore <= 70) return { text: 'Moderate', status: 'You are financially steady', colorClass: 'bg-warning-50 text-warning-800 border border-warning-100' };
    return { text: 'Excellent', status: 'You are financially strong!', colorClass: 'bg-success-50 text-success-800 border border-success-100' };
  }, [confidenceScore]);

  // 2. Dynamic Financial Health calculation based on real savings rate
  const healthScore = useMemo(() => {
    if (totalIncome === 0) return 0;
    const savingsRate = Math.round(((totalIncome - totalExpenses) / totalIncome) * 100);
    return Math.max(0, Math.min(100, savingsRate));
  }, [totalIncome, totalExpenses]);

  const healthStatus = useMemo(() => {
    if (totalIncome === 0 && totalExpenses === 0) {
      return { text: 'No Data', status: 'Log transactions to check health' };
    }
    if (healthScore <= 35) {
      return { text: 'Unhealthy', status: 'Try to lower your expenses.' };
    }
    if (healthScore <= 70) {
      return { text: 'Fair', status: 'Good job keeping stable savings.' };
    }
    return { text: 'Healthy', status: 'Excellent financial management!' };
  }, [healthScore, totalIncome, totalExpenses]);

  const healthPieData = useMemo(() => {
    return [
      { name: 'Healthy', value: healthScore === 0 && totalIncome === 0 ? 0 : healthScore, color: '#6A2B67' },
      { name: 'Remaining', value: healthScore === 0 && totalIncome === 0 ? 100 : 100 - healthScore, color: '#EFEFEF' },
    ];
  }, [healthScore, totalIncome]);

  // 3. Dynamic AI Insight based on transaction counts
  const { insightText, insightSub } = useMemo(() => {
    if (currentScore === 0) {
      return {
        insightText: "Start your financial journey with Sakhi!",
        insightSub: "Log your first income or expense transaction to receive AI-powered financial insights."
      };
    }
    const billsCount = recentActivity?.filter(a => a.type === 'BILL' || a.description?.includes('Bill')).length || 0;
    if (billsCount > 0) {
      return {
        insightText: `Great job! You successfully paid ${billsCount} bills using BBPS.`,
        insightSub: "Your on-time utility payments are actively building your credit trust score."
      };
    }
    return {
      insightText: "Awesome job logging your cashflow transactions!",
      insightSub: "Maintaining consistent log habits builds your credit score and unlocks future loans."
    };
  }, [currentScore, recentActivity]);
  
  // Calculate upcoming bills based on expenses that are not marked as paid, or mock if none
  const upcomingBills = financials?.upcomingBills || [];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full mx-auto pb-12"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT MAIN SECTION (Spans 9) */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* Top Row: 4 Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {/* SakhiScore */}
            <motion.div 
              whileHover={{ y: -4 }}
              className="bg-[#876F9A] rounded-[18px] p-5 shadow-premium text-white flex flex-col justify-between relative overflow-hidden"
            >
              <div className="absolute -right-8 -top-8 opacity-10">
                {/* Abstract floral watermark */}
                <svg width="150" height="150" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/></svg>
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-sm font-semibold text-white/90">SakhiScore</h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#A4D5C5] text-[#2C5F4D]">Good</span>
                </div>
                <div className="text-4xl font-display font-bold mt-2 mb-1 flex items-baseline gap-1">
                  <CountUp end={currentScore} duration={1.5} />
                  <span className="text-sm text-white/60 font-medium">/ 100</span>
                </div>
                <div className="w-full bg-white/20 h-2 rounded-full mt-4 mb-3 overflow-hidden">
                  <div className="bg-white h-full rounded-full" style={{ width: `${(currentScore/100)*100}%` }}></div>
                </div>
                <p className="text-[10px] text-white/80">Keep going! You're on the right track.</p>
                <button onClick={() => onNavigate('score')} className="mt-3 text-[11px] font-semibold text-white flex items-center gap-1 hover:gap-2 transition-all">
                  View Score Details <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>

            {/* Financial Confidence */}
            <StatCard 
              title="Financial Confidence Index" 
              badge={{ text: confidenceLevel.text, colorClass: confidenceLevel.colorClass }}
            >
              <div className="text-3xl font-display font-bold text-[#111827] flex items-baseline gap-1">
                {confidenceScore} <span className="text-sm text-[#6B7280] font-medium">/ 100</span>
              </div>
              <div className="w-full bg-surface-100 h-1.5 rounded-full mt-4 mb-3 overflow-hidden">
                <div className="bg-[#8F3E61] h-full rounded-full" style={{ width: `${confidenceScore}%` }}></div>
              </div>
              <p className="text-[10px] text-[#A66155] font-medium">{confidenceLevel.status}</p>
              <button onClick={() => onNavigate('score')} className="mt-3 text-[11px] font-semibold text-[#8F3E61] flex items-center gap-1 hover:gap-2 transition-all">
                View Details <ArrowRight className="w-3 h-3" />
              </button>
            </StatCard>

            {/* Monthly Bills Paid */}
            <StatCard 
              title="Monthly Bills Paid" 
              icon={<Receipt className="w-4 h-4 text-[#C1959C]" />}
              value={`₹${totalExpenses.toLocaleString('en-IN')}`}
              subtitle={
                <div className="flex flex-col gap-1 mt-1">
                  <span className="text-[#2C5F4D] font-medium text-[11px]">100% on-time payment</span>
                  <span className="text-[#6B7280] text-[10px] flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-[#58A57F]" /> 12% from last month
                  </span>
                </div>
              }
            />

            {/* Savings This Month */}
            <StatCard 
              title="Savings This Month" 
              icon={<PiggyBank className="w-4 h-4 text-[#E6B0B0]" />}
              value={`₹${(totalIncome - totalExpenses > 0 ? totalIncome - totalExpenses : 0).toLocaleString('en-IN')}`}
            >
              <div className="mt-3">
                <div className="flex justify-between text-[11px] font-medium text-[#111827] mb-2">
                  <span>Goal: ₹10,000</span>
                  <span className="text-[#6B7280]">{Math.min(100, Math.floor(((totalIncome - totalExpenses) / 10000) * 100))}%</span>
                </div>
                <div className="w-full bg-surface-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#C58066] h-full rounded-full" style={{ width: `${Math.min(100, ((totalIncome - totalExpenses) / 10000) * 100)}%` }}></div>
                </div>
              </div>
            </StatCard>
          </div>

          {/* Middle Row: 3 Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Upcoming Bills */}
            <div className="premium-card flex flex-col p-5">
              <h3 className="text-sm font-semibold text-[#111827] mb-4">Upcoming Bills & Reminders</h3>
              <div className="space-y-4 flex-1">
                {upcomingBills && upcomingBills.length > 0 ? upcomingBills.slice(0, 3).map((bill, idx) => (
                  <div key={idx} className="flex items-center justify-between pb-3 border-b border-surface-50 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500"><Zap className="w-4 h-4"/></div>
                      <div>
                        <p className="text-[11px] font-bold text-[#111827]">{bill.name || bill.billerName}</p>
                        <p className="text-[9px] text-[#6B7280]">Due: {new Date(bill.dueDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right pr-2">
                      <p className="text-[11px] font-bold text-[#111827]">₹{bill.amount}</p>
                    </div>
                    <button onClick={() => onNavigate('bbps')} className="bg-[#985374] text-white hover:bg-[#854562] px-2 py-1 rounded text-[9px] font-semibold transition-colors">
                      Pay Now
                    </button>
                  </div>
                )) : (
                  <p className="text-xs text-surface-500">No upcoming bills!</p>
                )}
              </div>
              <button onClick={() => onNavigate('bbps')} className="mt-4 text-[11px] font-semibold text-[#8F3E61] hover:text-[#672742] transition-colors">
                View All Bills &rarr;
              </button>
            </div>

            {/* Score Trend Chart */}
            <div className="premium-card flex flex-col p-5">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-semibold text-[#111827]">SakhiScore Trend</h3>
                <span className="text-[10px] font-medium text-[#6B7280] bg-surface-50 border border-surface-100 px-2 py-1 rounded-md flex items-center gap-1">
                  6 Months <span className="text-[8px]">▼</span>
                </span>
              </div>
              <div className="flex-1 min-h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scoreHistoryData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94A3B8' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94A3B8' }} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.1)', fontSize: '10px' }}
                      itemStyle={{ color: '#8F3E61', fontWeight: 700 }}
                    />
                    <Line type="monotone" dataKey="score" stroke="#8F3E61" strokeWidth={2} dot={{ r: 3, fill: '#8F3E61', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AI Insight */}
            <div className="bg-[#FAF7FC] border border-[#EBE2F4] rounded-[18px] p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="z-10 relative">
                <div className="flex items-center gap-1.5 text-[#8659AD] font-bold text-[11px] mb-3">
                  <Bot className="w-4 h-4" /> AI Financial Insight
                </div>
                <p className="text-[#111827] font-semibold text-sm leading-tight mb-2">
                  {insightText}
                </p>
                <p className="text-[#6B7280] text-[10px] mb-4">
                  {insightSub}
                </p>
                <button onClick={() => onNavigate('literacy')} className="bg-[#7854A5] text-white text-[10px] font-semibold px-4 py-2 rounded-lg hover:bg-[#613D8B] transition-colors shadow-sm">
                  See More Insights
                </button>
              </div>
              <div className="absolute right-0 bottom-0 text-indigo-200/50 -mr-6 -mb-6 z-0">
                <Bot className="w-32 h-32" />
              </div>
            </div>

          </div>

          {/* Quick Actions Row */}
          <div className="pt-2">
            <h3 className="text-sm font-semibold text-[#111827] mb-4">Quick Actions</h3>
            <div className="flex items-center gap-6 overflow-x-auto pb-4 hide-scrollbar">
              <ActionIcon icon={Receipt} label="Pay a Bill" sublabel="Via BBPS" colorClass="bg-[#F4F0F9] text-[#7A5B9C]" onClick={() => onNavigate('bbps')} />
              <ActionIcon icon={Wallet} label="Add Income" sublabel="Log your earnings" colorClass="bg-[#EAF6ED] text-[#419460]" onClick={() => onNavigate('griha')} />
              <ActionIcon icon={TrendingUp} label="Track Expense" sublabel="Daily spending" colorClass="bg-[#FEF1EC] text-[#D07A65]" onClick={() => onNavigate('griha')} />
              <ActionIcon icon={Landmark} label="Check Loans" sublabel="See eligibilities" colorClass="bg-[#FEF5E5] text-[#CD9B48]" onClick={() => onNavigate('matchmaker')} />
              <ActionIcon icon={Gift} label="Explore Schemes" sublabel="Govt. benefits" colorClass="bg-[#E6F8F6] text-[#299596]" onClick={() => onNavigate('matchmaker')} />
              <ActionIcon icon={BookOpen} label="Financial Learn" sublabel="Mini lessons" colorClass="bg-[#FDEEF3] text-[#B14E71]" onClick={() => onNavigate('literacy')} />
              <ActionIcon icon={Bot} label="Ask Sakhi AI" sublabel="Get financial help" colorClass="bg-[#F0F2FA] text-[#5569B3]" onClick={() => onNavigate('literacy')} />
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN (Spans 3) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Health Donut */}
          <div className="premium-card flex flex-col items-center p-5">
            <h3 className="text-sm font-semibold text-[#111827] w-full mb-2">Your Financial Health</h3>
            <div className="w-40 h-40 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={healthPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                  >
                    {healthPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-display font-bold text-[#111827]">{healthScore}%</span>
                <span className={`text-[9px] font-bold uppercase tracking-wider ${
                  healthScore === 0 ? 'text-[#6B7280]' : 'text-[#58A57F]'
                }`}>
                  {healthStatus.text}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-[#6B7280] text-center mt-2">{healthStatus.status}</p>
            <button onClick={() => onNavigate('griha')} className="text-[11px] font-semibold text-[#8F3E61] mt-3 w-full text-left flex items-center gap-1 hover:gap-2 transition-all">
              Improve More <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Recent Transactions */}
          <div className="premium-card flex flex-col p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-[#111827]">Recent Transactions</h3>
              <button className="text-[11px] font-semibold text-[#8F3E61] hover:text-[#672742] transition-colors">View All</button>
            </div>
            <div className="space-y-4">
              {recentActivity && recentActivity.length > 0 ? recentActivity.map((activity, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full ${activity.type === 'INCOME' ? 'bg-indigo-50 text-indigo-500' : 'bg-orange-50 text-orange-500'} flex items-center justify-center`}>
                      {activity.type === 'INCOME' ? <Wallet className="w-4 h-4"/> : <Zap className="w-4 h-4"/>}
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-[#111827]">{activity.description}</p>
                      <p className="text-[9px] text-[#58A57F] font-medium">{activity.type === 'INCOME' ? 'Income' : 'Paid'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-[11px] font-bold ${activity.type === 'INCOME' ? 'text-[#58A57F]' : 'text-[#111827]'}`}>
                      {activity.type === 'INCOME' ? '+' : '-'} ₹{activity.amount}
                    </p>
                    <p className="text-[9px] text-[#6B7280]">{new Date(activity.date).toLocaleDateString()}</p>
                  </div>
                </div>
              )) : (
                <p className="text-xs text-surface-500">No recent activity.</p>
              )}
            </div>
          </div>

          {/* Loan Promo */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-[#6B4F8E] rounded-[18px] p-5 shadow-premium text-white relative overflow-hidden flex flex-col items-start"
          >
            <div className="absolute right-0 bottom-0 text-white/10 translate-x-1/4 translate-y-1/4">
              <Gift className="w-24 h-24" />
            </div>
            <div className="relative z-10 w-full">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-[11px] font-semibold text-white/90">Loan Eligibility Update</h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#FAF2C7] text-[#5A4F2C]">New</span>
              </div>
              {currentScore >= 60 ? (
                <>
                  <p className="text-sm font-bold mb-1">Congratulations!</p>
                  <p className="text-[10px] text-white/80 mb-4 leading-relaxed">You are now eligible for loan matchmaking based on your healthy credit history.</p>
                  <button onClick={() => onNavigate('matchmaker')} className="bg-white text-[#6B4F8E] font-semibold text-[10px] px-3 py-1.5 rounded-md hover:bg-surface-50 transition-colors flex items-center gap-1">
                    View Loan Offers <ArrowRight className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold mb-1">Build Score to Unlock Loans</p>
                  <p className="text-[10px] text-white/80 mb-4 leading-relaxed">Increase your SakhiScore to 60+ to unlock loan offers.</p>
                  <button onClick={() => onNavigate('score')} className="bg-white text-[#6B4F8E] font-semibold text-[10px] px-3 py-1.5 rounded-md hover:bg-surface-50 transition-colors flex items-center gap-1">
                    Improve Score <ArrowRight className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          </motion.div>

        </div>
      </div>
    </motion.div>
  );
}
