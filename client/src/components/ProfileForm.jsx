import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { API_BASE_URL } from '../api/client';
import SplitText from './ui/SplitText';
import Aurora from './ui/Aurora';
import { ChevronRight, Globe, User, Briefcase, Users, Loader2 } from 'lucide-react';

export default function ProfileForm({ onComplete }) {
  const { t, changeLanguage } = useLanguage();
  const [step, setStep] = useState(0);
  
  const [name, setName] = useState('');
  const [occupation, setOccupation] = useState('');
  const [isSHG, setIsSHG] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const occupations = [
    { id: 'tailoring', label: t('occ_tailoring'), icon: '✂️' },
    { id: 'beauty', label: t('occ_beauty'), icon: '💄' },
    { id: 'tiffin service', label: t('occ_food'), icon: '🍱' },
    { id: 'handicrafts', label: t('occ_handicrafts'), icon: '🧵' },
    { id: 'SHG member', label: t('occ_shg'), icon: '🤝' },
    { id: 'other', label: t('occ_other'), icon: '✨' },
  ];

  const handleNext = () => setStep(s => s + 1);

  const handleCreate = async () => {
    setLoading(true);
    setError('');
    const sessionId = crypto.randomUUID();

    try {
      const res = await fetch(`${API_BASE_URL}/api/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, occupation, isSHG, sessionId })
      });

      if (!res.ok) throw new Error('Failed to create profile');
      const data = await res.json();
      onComplete(data.sessionId);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-surface-50 overflow-hidden font-sans">
      {/* Background Aurora */}
      <div className="absolute inset-0 z-0">
        <Aurora color1="#2D213F" color2="#8F5C9C" />
      </div>
      <div className="absolute inset-0 bg-white/20 backdrop-blur-[100px] z-0"></div>

      <div className="z-10 w-full max-w-md p-6 sm:p-8">
        {step === 0 && (
          <div className="text-center space-y-10 animate-in fade-in zoom-in duration-700 bg-white/60 backdrop-blur-xl p-8 sm:p-12 rounded-[32px] shadow-premium border border-white/50">
            <div>
              <div className="w-16 h-16 bg-[#2D213F] rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg text-white">
                <Globe className="w-8 h-8" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-display font-bold text-[#111827] tracking-tight">
                <SplitText text="SakhiCredit" />
              </h1>
              <p className="text-[#6B7280] font-medium mt-4 text-lg max-w-xs mx-auto">
                Your exclusive platform for financial independence.
              </p>
            </div>

            <button 
              onClick={handleNext}
              className="w-full bg-[#2D213F] text-white py-4 px-6 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group"
            >
              Get Started <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            {/* 3-step visual summary */}
            <div className="grid grid-cols-3 gap-2 pt-8 mt-12 border-t border-surface-200/50">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center font-bold mb-2 shadow-sm border border-primary-100">1</div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-[#6B7280]">Build Score</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center font-bold mb-2 shadow-sm border border-primary-100">2</div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-[#6B7280]">Learn</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center font-bold mb-2 shadow-sm border border-primary-100">3</div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-[#6B7280]">Get Loans</p>
              </div>
            </div>
          </div>
        )}

        {step > 0 && (
          <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[32px] shadow-premium border border-white/50 relative overflow-hidden">
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-surface-200">
              <div 
                className="h-full bg-primary-500 transition-all duration-500 ease-out"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
            
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 pt-4">
                <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl mb-6 flex items-center justify-center border border-primary-100">
                  <Globe className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-display font-bold text-[#111827] mb-2">{t('step_language')}</h2>
                <p className="text-[#6B7280] font-medium mb-8">Select your preferred language.</p>
                <div className="grid grid-cols-1 gap-4">
                  {['en', 'hi', 'bn'].map(lang => (
                    <button
                      key={lang}
                      onClick={() => {
                        changeLanguage(lang);
                        handleNext();
                      }}
                      className="p-5 rounded-2xl border-2 border-surface-200 bg-white hover:bg-surface-50 hover:border-primary-400 hover:shadow-sm transition-all text-xl font-bold text-[#111827] text-left flex justify-between items-center group"
                    >
                      {lang === 'en' && 'English'}
                      {lang === 'hi' && 'हिन्दी'}
                      {lang === 'bn' && 'বাংলা'}
                      <ChevronRight className="w-5 h-5 text-surface-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 pt-4">
                <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl mb-6 flex items-center justify-center border border-primary-100">
                  <User className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-display font-bold text-[#111827] mb-2">{t('step_name')}</h2>
                <p className="text-[#6B7280] font-medium mb-8">What should we call you?</p>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('step_name_placeholder')}
                  className="w-full bg-white border-2 border-surface-200 rounded-2xl px-5 py-4 text-xl font-bold text-[#111827] placeholder:text-surface-400 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all mb-8 shadow-sm"
                  autoFocus
                />
                <button 
                  onClick={handleNext}
                  disabled={!name.trim()}
                  className="w-full bg-primary-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-primary-700 disabled:opacity-50 disabled:shadow-none transition-all flex justify-center items-center gap-2"
                >
                  {t('next')} <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 pt-4">
                <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl mb-6 flex items-center justify-center border border-primary-100">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-display font-bold text-[#111827] mb-2">{t('step_occupation')}</h2>
                <p className="text-[#6B7280] font-medium mb-8">Tell us about your work.</p>
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {occupations.map(occ => (
                    <button
                      key={occ.id}
                      onClick={() => {
                        setOccupation(occ.id);
                        if (occ.id === 'SHG member') setIsSHG(true);
                      }}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3 text-center
                        ${occupation === occ.id 
                          ? 'border-primary-500 bg-primary-50/50 shadow-inner' 
                          : 'border-surface-200 bg-white hover:border-primary-300 hover:shadow-sm'}`}
                    >
                      <span className="text-3xl filter drop-shadow-sm">{occ.icon}</span>
                      <span className="text-sm font-bold text-[#111827] leading-tight">{occ.label}</span>
                    </button>
                  ))}
                </div>
                <button 
                  onClick={handleNext}
                  disabled={!occupation}
                  className="w-full bg-primary-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-primary-700 disabled:opacity-50 disabled:shadow-none transition-all flex justify-center items-center gap-2"
                >
                  {t('next')} <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {step === 4 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 pt-4">
                <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl mb-6 flex items-center justify-center border border-primary-100">
                  <Users className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-display font-bold text-[#111827] mb-2">{t('step_shg')}</h2>
                <p className="text-[#6B7280] font-medium mb-8">Are you part of a Self Help Group?</p>
                <div className="flex gap-4 mb-8">
                  <button
                    onClick={() => setIsSHG(true)}
                    className={`flex-1 py-5 rounded-2xl border-2 transition-all font-bold text-lg
                      ${isSHG === true ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-inner' : 'border-surface-200 bg-white hover:border-primary-300 text-[#4B5563] hover:shadow-sm'}`}
                  >
                    {t('yes')}
                  </button>
                  <button
                    onClick={() => setIsSHG(false)}
                    className={`flex-1 py-5 rounded-2xl border-2 transition-all font-bold text-lg
                      ${isSHG === false ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-inner' : 'border-surface-200 bg-white hover:border-primary-300 text-[#4B5563] hover:shadow-sm'}`}
                  >
                    {t('no')}
                  </button>
                </div>
                
                {error && <p className="text-danger-500 mt-4 text-center font-medium bg-danger-50 p-3 rounded-xl mb-4">{error}</p>}

                <button 
                  onClick={handleCreate}
                  disabled={isSHG === null || loading}
                  className="w-full bg-[#2D213F] text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl hover:bg-[#201730] disabled:opacity-50 disabled:shadow-none transition-all relative overflow-hidden flex justify-center items-center gap-2"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                    {loading ? t('creating') : t('create_profile')}
                  </span>
                  {!loading && <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-transparent via-white to-transparent -translate-x-full hover:animate-[shimmer_1.5s_infinite]" />}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
