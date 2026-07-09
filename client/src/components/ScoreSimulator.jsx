import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import FadeContent from './ui/FadeContent';
import CountUp from './ui/CountUp';
import { Award, Zap, ShieldCheck, TrendingUp } from 'lucide-react';

export default function ScoreSimulator({ profile, sessionId, scoreFactors }) {
  const [savingsFreq, setSavingsFreq] = useState(scoreFactors?.savingsFreq ?? 0); // 0-100
  const [shgStreak, setShgStreak] = useState(scoreFactors?.shgStreak ?? 0); // 0-100
  const [trend, setTrend] = useState(scoreFactors?.trend ?? 0); // 0-100

  const historyData = useMemo(() => {
    if (!profile?.scoreHistory || profile.scoreHistory.length === 0) {
      return [];
    }
    return profile.scoreHistory.map((item, index) => ({
      name: new Date(item.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      score: item.score
    }));
  }, [profile]);

  // Manual fallback state
  const [manualBillPunctuality, setManualBillPunctuality] = useState(scoreFactors?.billPunctuality ?? 0);
  const [manualIncomeStability, setManualIncomeStability] = useState(scoreFactors?.incomeStability ?? 0);

  // Derived from profile
  const { realBillPunctuality, hasRealBillData, realIncomeStability, hasRealIncomeData } = useMemo(() => {
    let bp = null;
    let hasBp = false;
    if (profile?.bills?.length > 0) {
      let totalPayments = 0;
      let onTimePayments = 0;
      profile.bills.forEach(b => {
        if (b.paymentHistory) {
          b.paymentHistory.forEach(ph => {
            totalPayments++;
            if (ph.wasOnTime) onTimePayments++;
          });
        }
      });
      if (totalPayments > 0) {
        bp = Math.round((onTimePayments / totalPayments) * 100);
        hasBp = true;
      }
    }

    let inc = null;
    let hasInc = false;
    if (profile?.incomeEntries?.length > 0) {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      let entriesThisMonth = profile.incomeEntries.filter(entry => {
        const d = new Date(entry.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }).length;
      
      inc = Math.min(100, Math.round((entriesThisMonth / 4) * 100)); // 4 entries = 100%
      hasInc = true;
    }

    return {
      realBillPunctuality: bp,
      hasRealBillData: hasBp,
      realIncomeStability: inc,
      hasRealIncomeData: hasInc
    };
  }, [profile]);

  const billPunctuality = hasRealBillData ? realBillPunctuality : manualBillPunctuality;
  const incomeStability = hasRealIncomeData ? realIncomeStability : manualIncomeStability;

  const [score, setScore] = useState(0);
  const [explanation, setExplanation] = useState('');
  const [loadingExp, setLoadingExp] = useState(false);
  
  // Weights: Savings 30%, Bills 25%, Income 20%, SHG 15%, Trend 10%
  const calculateScore = () => {
    const isShg = profile?.occupation === 'SHG member';
    
    if (isShg) {
      const s = (savingsFreq * 0.3) + 
                (billPunctuality * 0.25) + 
                (incomeStability * 0.2) + 
                (shgStreak * 0.15) + 
                (trend * 0.1);
      return Math.round(s);
    } else {
      // Proportional redistribution of the 15% SHG weight
      // Total remaining weight = 85%. Multiplier = 100/85 = 1.17647
      const multiplier = 100 / 85;
      const s = (savingsFreq * 0.3 * multiplier) + 
                (billPunctuality * 0.25 * multiplier) + 
                (incomeStability * 0.2 * multiplier) + 
                (trend * 0.1 * multiplier);
      return Math.round(s);
    }
  };

  useEffect(() => {
    setScore(calculateScore());
  }, [savingsFreq, billPunctuality, incomeStability, shgStreak, trend]);

  const handleSimulate = async () => {
    setLoadingExp(true);
    try {
      const res = await fetch('http://localhost:5000/api/score/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          score,
          factors: { savingsFreq, billPunctuality, incomeStability, shgStreak, trend }
        })
      });
      const data = await res.json();
      setExplanation(data.explanation);

    } catch (err) {
      console.error(err);
      setExplanation('Your score reflects your strong habits. Try paying bills slightly earlier next month to boost it further!');
    } finally {
      setLoadingExp(false);
    }
  };

  const chartData = [
    { name: 'Savings', value: savingsFreq * 0.3, fill: '#4F46E5' }, // Indigo
    { name: 'Bills', value: billPunctuality * 0.25, fill: '#14B8A6' }, // Teal
    { name: 'Income', value: incomeStability * 0.2, fill: '#8B5CF6' }, // Violet
    { name: 'SHG', value: shgStreak * 0.15, fill: '#F59E0B' }, // Amber
    { name: 'Trend', value: trend * 0.1, fill: '#EC4899' } // Pink
  ];

  return (
    <FadeContent className="max-w-[1200px] mx-auto pb-12 space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-display font-bold text-[#111827]">SakhiScore Simulator</h2>
        <p className="text-sm text-[#6B7280] mt-1">Simulate how different financial habits impact your creditworthiness.</p>
      </div>

      {/* Main Score Reveal Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Score Card (Spans 8) */}
        <div className="lg:col-span-8 bg-[#2D213F] rounded-[18px] p-8 shadow-premium text-white flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
          <div className="absolute -left-10 -bottom-10 opacity-5">
            <Award className="w-64 h-64" />
          </div>
          
          <div className="flex-1 text-center md:text-left z-10 relative">
            <h3 className="text-sm font-semibold text-white/80 mb-2 uppercase tracking-wider">Simulated Score</h3>
            <div className="text-8xl font-display font-bold text-white mb-4">
              <CountUp end={score} duration={1} />
            </div>
            <p className="text-sm text-white/70 max-w-sm">
              Your SakhiScore evaluates daily financial discipline, helping you access loans without a formal credit history.
            </p>
          </div>

          <div className="flex-1 w-full h-[220px] bg-white/5 p-4 rounded-xl border border-white/10 z-10 relative">
            <h4 className="text-[11px] font-bold text-white/90 mb-3 text-center uppercase tracking-widest">Score Breakdown</h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={chartData} margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                <XAxis type="number" hide domain={[0, 30]} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 500}} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', color: '#111827', fontSize: '11px' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* History / Trend (Spans 4) */}
        <div className="lg:col-span-4 premium-card p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-[#8F3E61]" />
            <h3 className="text-sm font-semibold text-[#111827]">Simulation History</h3>
          </div>
          
          {historyData.length < 2 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-surface-50 rounded-xl border border-dashed border-surface-200">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-primary-500 mb-3 shadow-sm">
                <Zap className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-[#111827]">Start Simulating!</p>
              <p className="text-xs text-[#6B7280] mt-1">Adjust sliders and click Ask Sakhi to track your score progress here.</p>
            </div>
          ) : (
            <div className="flex-1 min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" tick={{fontSize: 10, fill: '#94A3B8'}} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} tick={{fontSize: 10, fill: '#94A3B8'}} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '11px' }} />
                  <Line type="monotone" dataKey="score" stroke="#8F3E61" strokeWidth={3} dot={{ fill: '#8F3E61', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>

      {/* Simulator Inputs & AI Advice */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sliders (Spans 7) */}
        <div className="lg:col-span-7 premium-card p-6 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-bold text-[#111827]">Financial Behaviors</h3>
          </div>
          <p className="text-xs text-[#6B7280] mb-6">Adjust the sliders below to see how improving certain habits could raise your score.</p>
          
          <div className="space-y-6">
            {/* Savings Consistency */}
            <div>
              <div className="flex justify-between text-xs text-[#111827] font-semibold mb-3">
                <span>Savings Consistency (30%)</span>
                <span className="text-primary-600 bg-primary-50 px-2 py-0.5 rounded">{savingsFreq}%</span>
              </div>
              <input type="range" min="0" max="100" value={savingsFreq} onChange={e => setSavingsFreq(parseInt(e.target.value))} className="w-full accent-primary-600 h-2 bg-surface-200 rounded-lg appearance-none cursor-pointer" />
            </div>

            {/* Bill Punctuality */}
            <div className={hasRealBillData ? 'p-4 bg-surface-50 rounded-xl border border-surface-100' : ''}>
              <div className="flex justify-between text-xs text-[#111827] font-semibold mb-3">
                <span className="flex items-center gap-2">
                  Bill Punctuality (25%)
                  {hasRealBillData && <span className="text-[9px] bg-success-100 text-success-700 px-2 py-0.5 rounded-full font-bold uppercase">Live Data</span>}
                </span>
                <span className="text-teal-600 bg-teal-50 px-2 py-0.5 rounded">{billPunctuality}%</span>
              </div>
              <input type="range" min="0" max="100" value={billPunctuality} onChange={e => setManualBillPunctuality(parseInt(e.target.value))} disabled={hasRealBillData} className={`w-full h-2 bg-surface-200 rounded-lg appearance-none ${hasRealBillData ? 'accent-teal-400 cursor-not-allowed opacity-50' : 'accent-teal-500 cursor-pointer'}`} />
            </div>

            {/* Income Stability */}
            <div className={hasRealIncomeData ? 'p-4 bg-surface-50 rounded-xl border border-surface-100' : ''}>
              <div className="flex justify-between text-xs text-[#111827] font-semibold mb-3">
                <span className="flex items-center gap-2">
                  Income Stability (20%)
                  {hasRealIncomeData && <span className="text-[9px] bg-success-100 text-success-700 px-2 py-0.5 rounded-full font-bold uppercase">Live Data</span>}
                </span>
                <span className="text-violet-600 bg-violet-50 px-2 py-0.5 rounded">{incomeStability}%</span>
              </div>
              <input type="range" min="0" max="100" value={incomeStability} onChange={e => setManualIncomeStability(parseInt(e.target.value))} disabled={hasRealIncomeData} className={`w-full h-2 bg-surface-200 rounded-lg appearance-none ${hasRealIncomeData ? 'accent-violet-400 cursor-not-allowed opacity-50' : 'accent-violet-500 cursor-pointer'}`} />
            </div>

            {/* SHG Repayment Streak */}
            {profile?.occupation === 'SHG member' && (
              <div>
                <div className="flex justify-between text-xs text-[#111827] font-semibold mb-3">
                  <span>SHG Repayment Streak (15%)</span>
                  <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded">{shgStreak}%</span>
                </div>
                <input type="range" min="0" max="100" value={shgStreak} onChange={e => setShgStreak(parseInt(e.target.value))} className="w-full accent-amber-500 h-2 bg-surface-200 rounded-lg appearance-none cursor-pointer" />
              </div>
            )}

            {/* Savings Growth Trend */}
            <div>
              <div className="flex justify-between text-xs text-[#111827] font-semibold mb-3">
                <span>Savings Growth Trend (10%)</span>
                <span className="text-pink-600 bg-pink-50 px-2 py-0.5 rounded">{trend}%</span>
              </div>
              <input type="range" min="0" max="100" value={trend} onChange={e => setTrend(parseInt(e.target.value))} className="w-full accent-pink-500 h-2 bg-surface-200 rounded-lg appearance-none cursor-pointer" />
            </div>
          </div>
          
          <button 
            onClick={handleSimulate}
            disabled={loadingExp}
            className="w-full mt-8 bg-[#2D213F] text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-[#3F2E56] transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-70"
          >
            {loadingExp ? 'Analyzing...' : 'Ask Sakhi AI to Explain My Score'}
          </button>
        </div>

        {/* AI Advice (Spans 5) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#FAF7FC] to-white border border-[#EBE2F4] rounded-[18px] p-6 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-[#8F3E61]">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/></svg>
          </div>
          
          <div className="relative z-10 flex-1 flex flex-col">
            <h3 className="text-lg font-bold text-[#8659AD] mb-6 flex items-center gap-2">
              Sakhi AI Advice
            </h3>
            
            <div className="flex-1 flex flex-col">
              {explanation ? (
                <div className="bg-white p-5 rounded-xl border border-surface-100 shadow-sm text-sm text-[#374151] leading-relaxed relative">
                  <div className="absolute -left-2 top-6 w-4 h-4 bg-white border-t border-l border-surface-100 transform -rotate-45"></div>
                  {explanation}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
                  <img src="https://api.dicebear.com/7.x/bottts/svg?seed=sakhi&backgroundColor=transparent" alt="AI Bot" className="w-24 h-24 mb-4 grayscale" />
                  <p className="text-sm font-medium text-[#111827]">Awaiting Simulation</p>
                  <p className="text-xs text-[#6B7280] mt-1 max-w-[200px]">Adjust your habits and ask me for personalized financial advice!</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

    </FadeContent>
  );
}
