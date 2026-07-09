import { useState, useEffect } from 'react';
import FadeContent from './ui/FadeContent';
import { Sparkles, Target, Lock, CheckCircle2, Loader2 } from 'lucide-react';
import { useLoanMatches } from '../hooks/queries/core';

export default function SchemeMatchmaker({ profile, sessionId }) {
  const { data: matchData, isLoading, isError } = useLoanMatches(sessionId);

  const eligible = matchData?.eligible || [];
  const ineligible = matchData?.ineligible || [];
  const simulatedScore = profile?.currentScore || 0;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#6B7280] space-y-4">
        <div className="w-12 h-12 border-4 border-surface-200 border-t-primary-600 rounded-full animate-spin"></div>
        <p className="font-semibold text-[#111827] animate-pulse">Matching government schemes & benefits...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-20 space-y-4 bg-white border border-surface-200 rounded-[18px] p-8 max-w-md mx-auto">
        <p className="text-danger-600 font-semibold">Failed to load qualified schemes. Please try again later.</p>
      </div>
    );
  }

  return (
    <FadeContent className="max-w-[1200px] mx-auto pb-12 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-[#2D213F] rounded-[18px] p-8 shadow-premium text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <Sparkles className="w-48 h-48" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h3 className="text-3xl font-display font-bold text-white mb-2">Loan Matchmaker</h3>
          <p className="text-white/80 leading-relaxed">
            Based on your profile as a <strong className="capitalize text-white">{profile?.occupation || 'user'}</strong> and your SakhiScore, here is what you qualify for today. 
            Remember, these are informational — always verify with the official bank branch.
          </p>
        </div>
        <div className="relative z-10 bg-white/10 border border-white/20 p-5 rounded-2xl flex items-center gap-4 backdrop-blur-sm">
          <div className="w-12 h-12 bg-white text-[#2D213F] rounded-full flex items-center justify-center font-bold text-xl shadow-sm">
            {simulatedScore || 45}
          </div>
          <div>
            <span className="block text-xs uppercase tracking-widest text-white/70 font-semibold mb-1">Your Score</span>
            <span className="text-sm font-medium text-white">Unlocks {eligible.length} schemes</span>
          </div>
        </div>
      </div>

      {/* Eligible Schemes */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-6 h-6 text-success-500" />
          <h4 className="text-xl font-bold text-[#111827]">Ready to Apply</h4>
        </div>
        
        {eligible.length === 0 ? (
          <div className="premium-card p-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center text-surface-400 mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <h5 className="font-bold text-[#111827] mb-2">Keep building your score</h5>
            <p className="text-[#6B7280] text-sm max-w-sm">You haven't unlocked any loan schemes yet. Improve your SakhiScore by paying bills on time.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {eligible.map(scheme => (
              <div key={scheme.id} className="premium-card relative overflow-hidden group border border-success-200 shadow-sm hover:shadow-premium-hover transition-all flex flex-col h-full">
                <div className="absolute top-0 right-0 bg-success-500 text-white text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-bl-xl shadow-sm">
                  Qualified
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <h4 className="text-lg font-bold text-[#111827] mt-2 mb-1">{scheme.name}</h4>
                  <span className="inline-block bg-primary-50 text-primary-700 text-xs font-semibold px-2 py-1 rounded w-fit mb-4">
                    {scheme.provider}
                  </span>
                  
                  <p className="text-sm text-[#4B5563] leading-relaxed flex-1">{scheme.description}</p>
                </div>
                
                <div className="bg-surface-50 p-4 border-t border-surface-100 flex justify-between items-center mt-auto">
                  <div>
                    <span className="block text-[10px] text-[#6B7280] uppercase font-bold tracking-wider mb-0.5">Loan Amount</span>
                    <span className="font-bold text-primary-700">{scheme.amount}</span>
                  </div>
                  <button className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg text-xs transition-colors shadow-sm whitespace-nowrap">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ineligible Schemes */}
      {ineligible.length > 0 && (
        <div className="space-y-6 pt-6 border-t border-surface-200">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-6 h-6 text-amber-500" />
            <h4 className="text-xl font-bold text-[#111827]">Within Reach</h4>
            <span className="text-sm text-[#6B7280] font-normal ml-2 hidden md:inline">— Improve your score to unlock these</span>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {ineligible.map(scheme => (
              <div key={scheme.id} className="bg-white rounded-[16px] border border-surface-200 p-6 opacity-75 relative flex flex-col h-full grayscale-[0.3]">
                <div className="absolute top-0 right-0 bg-surface-200 text-[#4B5563] text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-bl-xl">
                  Needs Score: {scheme.minScore}
                </div>
                
                <h4 className="text-lg font-bold text-[#374151] mt-2 mb-1">{scheme.name}</h4>
                <span className="inline-block bg-surface-100 text-[#4B5563] text-xs font-semibold px-2 py-1 rounded w-fit mb-4">
                  {scheme.provider}
                </span>
                
                <p className="text-sm text-[#6B7280] leading-relaxed flex-1">{scheme.description}</p>
                
                <div className="bg-surface-50 p-4 rounded-xl flex justify-between items-center mt-4 border border-surface-100">
                  <span className="text-sm font-bold text-[#374151]">{scheme.amount}</span>
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wide flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Locked
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </FadeContent>
  );
}
