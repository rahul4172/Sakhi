import React, { useState } from 'react';
import FadeContent from './ui/FadeContent';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Wallet, Zap, ArrowUpRight, ArrowDownRight, IndianRupee } from 'lucide-react';
import { useDashboardData } from '../hooks/queries/core';
import { useLanguage } from '../contexts/LanguageContext';

const EXPENSE_COLORS = ['#EF4444', '#F97316', '#F59E0B', '#3B82F6', '#8B5CF6'];

export default function IncomeExpensesDashboard({ sessionId }) {
  const { data, isLoading } = useDashboardData(sessionId);
  const [timeframe, setTimeframe] = useState('month');
  const { t } = useLanguage();

  if (isLoading) {
    return <div className="animate-pulse flex h-64 bg-surface-100 rounded-2xl"></div>;
  }

  const { financials, recentActivity } = data || {};
  const totalIncome = financials?.totalIncome || 0;
  const totalExpenses = financials?.totalExpenses || 0;
  const balance = totalIncome - totalExpenses;

  const expenseData = financials?.expenseBreakdown || [];

  return (
    <FadeContent className="max-w-[1200px] mx-auto pb-12 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-[#111827]">{t('nav_analytics')}</h2>
          <p className="text-sm text-[#6B7280] mt-1">{t('cashflow_desc')}</p>
        </div>
        <select 
          value={timeframe} 
          onChange={(e) => setTimeframe(e.target.value)}
          className="bg-white border border-surface-200 text-[#111827] text-sm rounded-lg px-4 py-2 outline-none focus:border-primary-500 shadow-sm"
        >
          <option value="month">{t('this_month')}</option>
          <option value="quarter">{t('last_3_months')}</option>
          <option value="year">{t('this_year')}</option>
        </select>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Balance Card */}
        <div className="premium-card p-6 bg-gradient-to-br from-[#2D213F] to-[#3F2E56] text-white">
          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mb-4">
            <IndianRupee className="w-5 h-5 text-white" />
          </div>
          <p className="text-white/70 text-sm mb-1 uppercase tracking-wider font-semibold">{t('available_balance')}</p>
          <h3 className="text-3xl font-display font-bold mb-4">₹{balance > 0 ? balance.toLocaleString('en-IN') : 0}</h3>
          
          <div className="flex items-center gap-2 text-xs font-medium text-white/80 bg-white/5 w-fit px-3 py-1.5 rounded-full border border-white/10">
            <span>{t('vs_last_month')}</span>
            <span className="flex items-center text-success-400"><ArrowUpRight className="w-3 h-3"/> 12%</span>
          </div>
        </div>

        {/* Income Card */}
        <div className="premium-card p-6 border border-surface-100 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <ArrowUpRight className="w-32 h-32 text-success-500" />
          </div>
          <p className="text-[#6B7280] text-sm mb-1 uppercase tracking-wider font-semibold">{t('total_income')}</p>
          <h3 className="text-2xl font-display font-bold text-[#111827]">₹{totalIncome.toLocaleString('en-IN')}</h3>
        </div>

        {/* Expense Card */}
        <div className="premium-card p-6 border border-surface-100 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <ArrowDownRight className="w-32 h-32 text-danger-500" />
          </div>
          <p className="text-[#6B7280] text-sm mb-1 uppercase tracking-wider font-semibold">{t('total_expenses')}</p>
          <h3 className="text-2xl font-display font-bold text-[#111827]">₹{totalExpenses.toLocaleString('en-IN')}</h3>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Expenses Breakdown Pie Chart */}
        <div className="premium-card p-6">
          <h3 className="text-lg font-bold text-[#111827] mb-6">{t('expense_breakdown')}</h3>
          {expenseData.length > 0 ? (
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-48 h-48 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {expenseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '12px' }}
                      formatter={(value) => `₹${value}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                  <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Total</span>
                  <span className="text-base font-bold text-[#111827]">₹{totalExpenses}</span>
                </div>
              </div>
              
              <div className="flex-1 space-y-4 w-full">
                {expenseData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: EXPENSE_COLORS[index % EXPENSE_COLORS.length] }}></div>
                      <span className="text-sm font-medium text-[#4B5563]">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold text-[#111827]">₹{item.value.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-12 opacity-60 min-h-[160px]">
              <p className="text-sm font-medium text-[#111827]">{t('no_expenses_recorded')}</p>
              <p className="text-xs text-[#6B7280] mt-1">{t('log_household_expenses')}</p>
            </div>
          )}
        </div>

        {/* Recent Transactions List */}
        <div className="premium-card p-6 flex flex-col h-full">
          <h3 className="text-lg font-bold text-[#111827] mb-6">{t('transaction_history')}</h3>
          <div className="flex-1 space-y-4">
            {recentActivity && recentActivity.length > 0 ? recentActivity.map((activity, idx) => (
              <div key={idx} className="flex items-center justify-between pb-4 border-b border-surface-100 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${activity.type === 'INCOME' ? 'bg-success-50 text-success-600' : 'bg-surface-100 text-[#4B5563]'} flex items-center justify-center`}>
                    {activity.type === 'INCOME' ? <Wallet className="w-5 h-5"/> : <Zap className="w-5 h-5"/>}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#111827]">{activity.description}</p>
                    <p className="text-xs text-[#6B7280]">{new Date(activity.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${activity.type === 'INCOME' ? 'text-success-600' : 'text-[#111827]'}`}>
                    {activity.type === 'INCOME' ? '+' : '-'} ₹{activity.amount}
                  </p>
                  <p className="text-xs text-[#6B7280] capitalize font-medium">{activity.type === 'INCOME' ? t('total_income') : t('total_expenses')}</p>
                </div>
              </div>
            )) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60 min-h-[200px]">
                <p className="text-sm font-medium text-[#111827]">No transactions yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </FadeContent>
  );
}
