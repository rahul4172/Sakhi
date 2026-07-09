import React, { useState } from 'react';
import FadeContent from './ui/FadeContent';
import { Target, PiggyBank, ArrowRight, Plus, Trophy } from 'lucide-react';

export default function GoalsDashboard({ sessionId }) {
  const [goals] = useState([
    {
      id: 1,
      name: 'Sewing Machine for Business',
      targetAmount: 15000,
      currentAmount: 4500,
      dueDate: '2027-01-15',
      icon: <Target className="w-5 h-5 text-indigo-500" />,
      color: 'indigo'
    },
    {
      id: 2,
      name: "Children's Education Fund",
      targetAmount: 50000,
      currentAmount: 32000,
      dueDate: '2027-06-01',
      icon: <PiggyBank className="w-5 h-5 text-pink-500" />,
      color: 'pink'
    }
  ]);

  return (
    <FadeContent className="max-w-[1200px] mx-auto pb-12 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-[#111827]">Financial Goals</h2>
          <p className="text-sm text-[#6B7280] mt-1">Track your progress and build your savings step-by-step.</p>
        </div>
        <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm w-fit">
          <Plus className="w-4 h-4" /> Add New Goal
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {goals.map(goal => {
          const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
          return (
            <div key={goal.id} className="premium-card p-6 flex flex-col group hover:shadow-premium-hover transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-${goal.color}-50 flex items-center justify-center`}>
                    {goal.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#111827]">{goal.name}</h3>
                    <p className="text-xs text-[#6B7280] mt-1">Target: by {new Date(goal.dueDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <button className="text-surface-400 hover:text-primary-600 transition-colors p-2">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 mt-auto">
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-[#111827]">₹{goal.currentAmount.toLocaleString('en-IN')}</span>
                  <span className="text-[#6B7280] font-medium">of ₹{goal.targetAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="h-2 w-full bg-surface-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-${goal.color}-500 rounded-full transition-all duration-1000 ease-out relative`} 
                    style={{ width: `${progress}%` }}
                  >
                  </div>
                </div>
                <p className="text-right text-[10px] font-bold text-primary-600">{Math.round(progress)}% completed</p>
              </div>
            </div>
          );
        })}

        {/* Empty / Reward State */}
        <div className="premium-card p-6 bg-gradient-to-br from-primary-50 to-white border-primary-100 flex flex-col items-center justify-center text-center min-h-[200px]">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-primary-100 mb-4">
            <Trophy className="w-8 h-8 text-primary-500" />
          </div>
          <h3 className="font-bold text-[#111827] mb-2">You're doing great!</h3>
          <p className="text-sm text-[#6B7280] max-w-xs">Saving consistently unlocks better loan rates. Keep pushing towards your goals.</p>
        </div>
      </div>
    </FadeContent>
  );
}
