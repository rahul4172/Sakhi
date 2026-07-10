import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { API_BASE_URL } from '../api/client';
import FadeContent from './ui/FadeContent';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Receipt, TrendingUp, CheckSquare, Plus, Bell } from 'lucide-react';
import { useIncome, useAddIncome } from '../hooks/queries/core';

export default function GrihaDashboard({ profile, setProfile }) {
  const { t } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState('bills');
  const [toastMsg, setToastMsg] = useState('');

  // Local state for forms
  const [newBill, setNewBill] = useState({ name: '', amount: '', dueDate: '', recurrence: 'monthly' });
  const [newIncome, setNewIncome] = useState({ amount: '', source: '' });
  const [newTask, setNewTask] = useState({ title: '', category: 'Household', dueDate: '' });

  const { data: incomeData } = useIncome(profile?.sessionId);
  const addIncome = useAddIncome(profile?.sessionId);

  const bills = profile?.bills || [];
  const incomeEntries = incomeData || [];
  const tasks = profile?.tasks || [];

  const updateProfile = async (updatedFields) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/profile/${profile.sessionId}/griha`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updatedFields)
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // ----- BILLS -----
  const handleAddBill = (e) => {
    e.preventDefault();
    if (!newBill.name || !newBill.amount || !newBill.dueDate) return;
    const addedBills = [...bills, { ...newBill, amount: Number(newBill.amount), paymentHistory: [] }];
    updateProfile({ bills: addedBills });
    setNewBill({ name: '', amount: '', dueDate: '', recurrence: 'monthly' });
  };

  const handleMarkPaid = (billIndex) => {
    const updatedBills = [...bills];
    const bill = updatedBills[billIndex];
    
    // Check if on time (simplified: paid date <= due date ignoring time)
    const today = new Date();
    const dueDate = new Date(bill.dueDate);
    const wasOnTime = today.setHours(0,0,0,0) <= dueDate.setHours(0,0,0,0);
    
    bill.paymentHistory.push({ paidDate: new Date(), wasOnTime });
    
    // Advance due date for next cycle
    if (bill.recurrence === 'monthly') {
      dueDate.setMonth(dueDate.getMonth() + 1);
      bill.dueDate = dueDate.toISOString();
    }
    
    updateProfile({ bills: updatedBills });
    if (wasOnTime) {
      showToast('🌟 This on-time payment strengthened your SakhiScore! You may now qualify for 1 more scheme. Check the Matchmaker tab.');
    }
  };

  // ----- INCOME -----
  const handleAddIncome = (e) => {
    e.preventDefault();
    if (!newIncome.amount || !newIncome.source) return;
    addIncome.mutate(
      { amount: Number(newIncome.amount), source: newIncome.source, date: new Date().toISOString() },
      {
        onSuccess: () => {
          setNewIncome({ amount: '', source: '' });
          showToast('📈 Income logged! Consistent entries build your SakhiScore.');
        }
      }
    );
  };

  // ----- TASKS -----
  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTask.title) return;
    const addedTasks = [...tasks, { ...newTask, dueDate: newTask.dueDate ? new Date(newTask.dueDate) : null, completed: false }];
    updateProfile({ tasks: addedTasks });
    setNewTask({ title: '', category: 'Household', dueDate: '' });
  };

  const handleToggleTask = (taskIndex) => {
    const updatedTasks = [...tasks];
    updatedTasks[taskIndex].completed = !updatedTasks[taskIndex].completed;
    updateProfile({ tasks: updatedTasks });
  };

  // ----- METRICS -----
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Bills Due this week
  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + 7);
  const billsDueThisWeek = bills.filter(b => {
    const d = new Date(b.dueDate);
    return d >= now.setHours(0,0,0,0) && d <= nextWeek;
  }).length;

  const incomeThisMonthTotal = incomeEntries.filter(i => {
    const d = new Date(i.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).reduce((sum, i) => sum + i.amount, 0);

  const pendingTasks = tasks.filter(t => !t.completed).length;

  // Monthly Impact calculation
  const getImpactSummary = () => {
    let onTimeCount = 0;
    let totalPaidThisMonth = 0;
    bills.forEach(b => {
      if (b.paymentHistory) {
        b.paymentHistory.forEach(ph => {
          const pd = new Date(ph.paidDate);
          if (pd.getMonth() === currentMonth && pd.getFullYear() === currentYear) {
            totalPaidThisMonth++;
            if (ph.wasOnTime) onTimeCount++;
          }
        });
      }
    });

    const incomeCountThisMonth = incomeEntries.filter(i => {
      const d = new Date(i.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    const historyRaw = localStorage.getItem(`scoreHistory_${profile?.sessionId}`);
    const scoreHistory = historyRaw ? JSON.parse(historyRaw) : [];
    const lastScore = scoreHistory.length > 0 ? scoreHistory[scoreHistory.length - 1].score : 'N/A';

    return { onTimeCount, totalPaidThisMonth, incomeCountThisMonth, lastScore };
  };

  const impact = getImpactSummary();

  // Income chart data (mocking last 3 months if empty, else using real)
  const generateChartData = () => {
    const data = [];
    for(let i=2; i>=0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthName = d.toLocaleString('default', { month: 'short' });
      const total = incomeEntries.filter(inc => {
        const id = new Date(inc.date);
        return id.getMonth() === d.getMonth() && id.getFullYear() === d.getFullYear();
      }).reduce((sum, inc) => sum + inc.amount, 0);
      data.push({ name: monthName, total });
    }
    return data;
  };
  const chartData = generateChartData();

  return (
    <FadeContent className="max-w-[1200px] mx-auto pb-12 space-y-6 relative">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-[#111827] text-white px-6 py-4 rounded-2xl shadow-premium z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 font-semibold text-sm flex items-center gap-3">
          <Bell className="w-5 h-5 text-primary-400" /> {toastMsg}
        </div>
      )}

      {/* Header & Overview Cards */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-[#111827]">{t('griha_title')}</h2>
          <p className="text-sm text-[#6B7280] mt-1">{t('griha_desc')}</p>
        </div>
        
        {bills.length === 0 && incomeEntries.length === 0 && (
          <div className="bg-gradient-to-r from-primary-50 to-white border border-primary-100 text-primary-800 p-4 rounded-xl text-sm font-medium flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-primary-500 animate-ping"></span>
            Start tracking your bills and earnings — every entry helps build your SakhiScore!
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="premium-card p-6 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="w-12 h-12 bg-danger-50 text-danger-600 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
              <Receipt className="w-6 h-6" />
            </div>
            <span className="block text-3xl font-display font-bold text-[#111827] mb-1">{billsDueThisWeek}</span>
            <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">{t('bills_due')} this week</span>
          </div>
          
          <div className="premium-card p-6 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="w-12 h-12 bg-success-50 text-success-600 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="block text-3xl font-display font-bold text-[#111827] mb-1">₹{incomeThisMonthTotal.toLocaleString('en-IN')}</span>
            <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">{t('income_logged')}</span>
          </div>
          
          <div className="premium-card p-6 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
              <CheckSquare className="w-6 h-6" />
            </div>
            <span className="block text-3xl font-display font-bold text-[#111827] mb-1">{pendingTasks}</span>
            <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">{t('tasks_pending')}</span>
          </div>
        </div>
      </div>

      {/* This Month's Impact */}
      {(bills.length > 0 || incomeEntries.length > 0) && (
        <div className="bg-[#2D213F] p-6 rounded-2xl shadow-premium flex items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp className="w-32 h-32 text-white" />
          </div>
          <div className="relative z-10 w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20 text-2xl">
            🌱
          </div>
          <div className="relative z-10">
            <h4 className="font-bold text-white text-lg mb-1">This Month's Impact</h4>
            <p className="text-sm text-white/80 max-w-2xl leading-relaxed">
              You paid <strong className="text-white bg-white/20 px-2 py-0.5 rounded">{impact.onTimeCount}/{impact.totalPaidThisMonth}</strong> bills on time and logged <strong className="text-white bg-white/20 px-2 py-0.5 rounded">{impact.incomeCountThisMonth}</strong> income entries.
              {impact.lastScore !== 'N/A' && ` Your last simulated score was ${impact.lastScore}.`}
            </p>
          </div>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex space-x-6 border-b border-surface-200 mt-10 mb-6">
        {['bills', 'income', 'tasks'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`pb-3 font-semibold text-sm capitalize transition-colors flex items-center gap-2 ${
              activeSubTab === tab ? 'border-b-2 border-primary-600 text-primary-600' : 'border-b-2 border-transparent text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* BILLS TAB */}
      {activeSubTab === 'bills' && (
        <FadeContent className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-4">
            <h3 className="font-bold text-lg text-[#111827]">Track a Bill</h3>
            <form onSubmit={handleAddBill} className="premium-card p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-[#4B5563] uppercase tracking-wider">Bill Name</label>
                <input type="text" value={newBill.name} onChange={e => setNewBill({...newBill, name: e.target.value})} placeholder="e.g., Electricity, Water" className="premium-input mt-2" required />
              </div>
              <div>
                <label className="text-xs font-bold text-[#4B5563] uppercase tracking-wider">Amount (₹)</label>
                <input type="number" value={newBill.amount} onChange={e => setNewBill({...newBill, amount: e.target.value})} placeholder="0" className="premium-input mt-2" required />
              </div>
              <div>
                <label className="text-xs font-bold text-[#4B5563] uppercase tracking-wider">Due Date</label>
                <input type="date" value={newBill.dueDate} onChange={e => setNewBill({...newBill, dueDate: e.target.value})} className="premium-input mt-2" required />
              </div>
              <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition-colors mt-2 text-sm">
                {t('add_bill')}
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 space-y-4">
            <h3 className="font-bold text-lg text-[#111827]">Your Bills</h3>
            {bills.length === 0 ? (
              <div className="border border-dashed border-surface-200 rounded-2xl p-10 text-center flex flex-col items-center">
                <Receipt className="w-12 h-12 text-surface-300 mb-3" />
                <p className="text-sm text-[#6B7280] font-medium">No bills tracked yet.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {bills.map((bill, idx) => {
                  const d = new Date(bill.dueDate);
                  const isOverdue = d < now.setHours(0,0,0,0);
                  const isApproaching = !isOverdue && d <= nextWeek;
                  
                  return (
                    <div key={idx} className={`p-5 rounded-[16px] border flex flex-col justify-between ${isOverdue ? 'bg-danger-50 border-danger-200' : isApproaching ? 'bg-warning-50 border-warning-200' : 'bg-white border-surface-200 shadow-sm'}`}>
                      <div className="mb-4">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-[#111827] text-base">{bill.name}</h4>
                          <span className="font-bold text-[#111827] bg-surface-100 px-2 py-1 rounded text-xs">₹{bill.amount}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs font-medium text-[#6B7280]">Due: {d.toLocaleDateString()}</span>
                          {isApproaching && <span className="text-[9px] font-bold bg-warning-100 text-warning-700 px-2 py-0.5 rounded-full uppercase tracking-widest">Due Soon</span>}
                          {isOverdue && <span className="text-[9px] font-bold bg-danger-100 text-danger-700 px-2 py-0.5 rounded-full uppercase tracking-widest">Past Due</span>}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleMarkPaid(idx)}
                        className={`w-full text-xs font-bold px-4 py-2.5 rounded-xl transition-colors ${isOverdue ? 'bg-danger-600 hover:bg-danger-700 text-white' : 'bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-100'}`}
                      >
                        {t('mark_paid')}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </FadeContent>
      )}

      {/* INCOME TAB */}
      {activeSubTab === 'income' && (
        <FadeContent className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-4">
            <h3 className="font-bold text-lg text-[#111827]">Log Earnings</h3>
            <form onSubmit={handleAddIncome} className="premium-card p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-[#4B5563] uppercase tracking-wider">Amount Earned (₹)</label>
                <input type="number" value={newIncome.amount} onChange={e => setNewIncome({...newIncome, amount: e.target.value})} placeholder="0" className="premium-input mt-2" required />
              </div>
              <div>
                <label className="text-xs font-bold text-[#4B5563] uppercase tracking-wider">Source / Description</label>
                <input type="text" value={newIncome.source} onChange={e => setNewIncome({...newIncome, source: e.target.value})} placeholder="e.g., 3 blouse orders" className="premium-input mt-2" required />
              </div>
              <button type="submit" disabled={addIncome.isPending} className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition-colors mt-2 text-sm disabled:opacity-50">
                {addIncome.isPending ? 'Logging...' : 'Log Income'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 space-y-4">
            <h3 className="font-bold text-lg text-[#111827]">Income Trend</h3>
            <div className="premium-card h-[250px] p-6 flex flex-col justify-end border border-surface-200 shadow-sm">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 500}} />
                  <Tooltip cursor={{fill: 'rgba(0,0,0,0.02)'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '12px' }} />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#4F46E5' : '#CBD5E1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-3 pt-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {incomeEntries.length === 0 && <p className="text-sm text-[#6B7280] italic">No income logged.</p>}
              {incomeEntries.slice().reverse().map((inc, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl border border-surface-200 flex justify-between items-center shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-success-50 rounded-full flex items-center justify-center text-success-600">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-[#111827]">{inc.source}</span>
                  </div>
                  <div className="text-right">
                    <span className="block font-bold text-success-600">+₹{inc.amount.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] font-medium text-[#6B7280]">{new Date(inc.date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeContent>
      )}

      {/* TASKS TAB */}
      {activeSubTab === 'tasks' && (
        <FadeContent className="max-w-2xl space-y-6">
          <form onSubmit={handleAddTask} className="flex gap-2 bg-white p-2 rounded-[16px] shadow-sm border border-surface-200 focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-all">
            <div className="pl-3 flex items-center text-surface-400">
              <Plus className="w-5 h-5" />
            </div>
            <input 
              type="text" 
              value={newTask.title} 
              onChange={e => setNewTask({...newTask, title: e.target.value})} 
              placeholder="What needs to be done?" 
              className="flex-1 bg-transparent px-2 outline-none text-[#111827] text-sm" 
            />
            <button type="submit" disabled={!newTask.title} className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl font-bold disabled:opacity-50 text-sm transition-colors">
              Add Task
            </button>
          </form>

          <div className="space-y-3">
            {tasks.length === 0 && (
              <div className="border border-dashed border-surface-200 rounded-2xl p-10 text-center">
                <p className="text-sm text-[#6B7280] font-medium">No tasks pending. You're all caught up!</p>
              </div>
            )}
            {tasks.map((task, idx) => (
              <div key={idx} className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${task.completed ? 'bg-surface-50 border-surface-100 opacity-60' : 'bg-white border-surface-200 shadow-sm hover:shadow-premium-hover cursor-pointer'}`} onClick={() => handleToggleTask(idx)}>
                <div className={`w-6 h-6 rounded-md flex items-center justify-center border-2 transition-colors ${task.completed ? 'bg-primary-500 border-primary-500 text-white' : 'border-surface-300 text-transparent'}`}>
                  <CheckSquare className="w-4 h-4 opacity-100" />
                </div>
                <span className={`flex-1 text-sm ${task.completed ? 'line-through text-[#6B7280]' : 'font-semibold text-[#111827]'}`}>
                  {task.title}
                </span>
              </div>
            ))}
          </div>
        </FadeContent>
      )}

    </FadeContent>
  );
}
