import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { API_BASE_URL } from '../api/client';
import FadeContent from './ui/FadeContent';
import { Mic, MicOff, Volume2, VolumeX, BookOpen, Bot, Sprout, CalendarDays, Star, Handshake, TrendingUp, Flag, Check } from 'lucide-react';

const LESSONS = [
  {
    id: 1, icon: <Sprout className="w-6 h-6 text-emerald-500" />, title: 'What is Interest?',
    content: 'Interest is the extra money you pay when you borrow, or the extra money you earn when you save. Think of it like renting a sewing machine: you pay for the time you use it. When you save money in a bank, the bank pays YOU rent for using your money!'
  },
  {
    id: 2, icon: <CalendarDays className="w-6 h-6 text-blue-500" />, title: 'What is EMI?',
    content: 'EMI stands for Equated Monthly Installment. It means breaking down a large loan into small, equal monthly pieces. It is like buying bulk raw materials for your shop and paying your supplier a little bit every month instead of all at once.'
  },
  {
    id: 3, icon: <Star className="w-6 h-6 text-amber-500" />, title: 'Why does a Credit Score matter?',
    content: 'A credit score is your financial reputation as a number. If you are known in the market for always paying suppliers on time, they trust you with more goods. A good score makes banks trust you with bigger, cheaper loans.'
  },
  {
    id: 4, icon: <Handshake className="w-6 h-6 text-purple-500" />, title: 'What is an SHG?',
    content: 'A Self-Help Group (SHG) is a small group of women who save money together and lend to each other. Once the group builds trust and savings, banks will often give the whole group a large loan without needing property as a guarantee.'
  },
  {
    id: 5, icon: <TrendingUp className="w-6 h-6 text-pink-500" />, title: 'Power of Compounding',
    content: 'Compounding is when your savings earn interest, and then that interest earns more interest! It is like planting a mango tree. First it grows branches, then those branches grow more branches, until it gives fruit every season.'
  },
  {
    id: 6, icon: <Flag className="w-6 h-6 text-red-500" />, title: 'Avoid Predatory Lenders',
    content: 'Predatory lenders charge extremely high daily or weekly interest and may harass you. Red flags include: no paperwork, asking for blank cheques, and refusing to tell you the total interest amount. Always use formal banks or trusted SHGs.'
  }
];

export default function FinancialLiteracy({ sessionId }) {
  const { language, bcp47 } = useLanguage();
  const [activeTab, setActiveTab] = useState('lessons');
  const [chatMessages, setChatMessages] = useState([{ role: 'assistant', text: 'Hi! I am Sakhi. What would you like to know about money, loans, or savings today?' }]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [readLessons, setReadLessons] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Speech Recognition setup
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!recognitionRef.current && SpeechRecognition) {
    recognitionRef.current = new SpeechRecognition();
  }
  const recognition = recognitionRef.current;

  if (recognition) {
    recognition.lang = bcp47;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setChatInput(transcript);
      handleSendChat(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  }

  const toggleListening = () => {
    if (isListening) {
      recognition?.stop();
      setIsListening(false);
    } else {
      recognition?.start();
      setIsListening(true);
    }
  };

  const speakText = (text) => {
    if (!isVoiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = bcp47;
    
    const voices = window.speechSynthesis.getVoices();
    const matchVoice = voices.find(v => v.lang.includes(bcp47.split('-')[0]));
    if (matchVoice) {
      utterance.voice = matchVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (sessionId) {
      const stored = localStorage.getItem(`readLessons_${sessionId}`);
      if (stored) setReadLessons(JSON.parse(stored));
    }
  }, [sessionId]);

  const markAsRead = (id) => {
    if (!readLessons.includes(id)) {
      const updated = [...readLessons, id];
      setReadLessons(updated);
      if (sessionId) localStorage.setItem(`readLessons_${sessionId}`, JSON.stringify(updated));
    }
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSendChat = async (text) => {
    if (!text.trim()) return;
    const newMessages = [...chatMessages, { role: 'user', text }];
    setChatMessages(newMessages);
    setChatInput('');
    setIsTyping(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/literacy/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: text, history: chatMessages.filter(m => m.role !== 'system'), language })
      });
      const data = await res.json();
      setChatMessages([...newMessages, { role: 'assistant', text: data.reply }]);
      speakText(data.reply);
    } catch (err) {
      setChatMessages([...newMessages, { role: 'assistant', text: "I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const progressPercentage = Math.round((readLessons.length / LESSONS.length) * 100);

  return (
    <FadeContent className="max-w-[1200px] mx-auto pb-12 space-y-6">
      
      <div>
        <h2 className="text-2xl font-display font-bold text-[#111827]">Financial Learn</h2>
        <p className="text-sm text-[#6B7280] mt-1">Enhance your financial knowledge through mini-lessons or ask Sakhi AI.</p>
      </div>

      <div className="flex space-x-6 border-b border-surface-200 mb-6">
        <button 
          onClick={() => setActiveTab('lessons')} 
          className={`pb-3 font-semibold text-sm transition-colors flex items-center gap-2 ${activeTab === 'lessons' ? 'border-b-2 border-primary-600 text-primary-600' : 'border-b-2 border-transparent text-[#6B7280] hover:text-[#111827]'}`}
        >
          <BookOpen className="w-4 h-4" /> Mini Lessons
        </button>
        <button 
          onClick={() => setActiveTab('chat')} 
          className={`pb-3 font-semibold text-sm transition-colors flex items-center gap-2 ${activeTab === 'chat' ? 'border-b-2 border-primary-600 text-primary-600' : 'border-b-2 border-transparent text-[#6B7280] hover:text-[#111827]'}`}
        >
          <Bot className="w-4 h-4" /> Ask Sakhi AI (Voice)
        </button>
      </div>

      {activeTab === 'lessons' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-primary-50 to-white border border-primary-100 rounded-2xl py-5 px-6 flex flex-col md:flex-row items-center justify-between shadow-sm">
            <span className="font-bold text-[#111827] flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary-600"/> Your Progress</span>
            <div className="flex-1 w-full md:w-auto md:mx-6 my-4 md:my-0 bg-surface-200 h-2 rounded-full overflow-hidden">
              <div className="bg-primary-600 h-full transition-all duration-700 ease-out" style={{ width: `${progressPercentage}%` }}></div>
            </div>
            <span className="text-sm font-bold text-primary-700 bg-primary-100 px-3 py-1 rounded-full">{progressPercentage}%</span>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {LESSONS.map(lesson => {
              const isRead = readLessons.includes(lesson.id);
              return (
                <div key={lesson.id} className={`premium-card flex flex-col justify-between transition-all duration-300 border ${isRead ? 'opacity-60 bg-surface-50 border-surface-200 shadow-none' : 'hover:-translate-y-1 hover:shadow-premium-hover border-transparent'}`}>
                  <div className="p-6">
                    <div className="text-3xl mb-4 flex justify-between items-start">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-surface-100">{lesson.icon}</div>
                      {isRead && (
                        <span className="flex items-center gap-1 text-success-500 bg-success-50 rounded-full px-2 py-0.5 text-xs font-bold tracking-wide uppercase">
                          Done <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <h4 className={`text-base font-bold mb-3 ${isRead ? 'text-[#4B5563]' : 'text-[#111827]'}`}>{lesson.title}</h4>
                    <p className={`text-xs leading-relaxed ${isRead ? 'text-[#6B7280]' : 'text-[#4B5563]'}`}>{lesson.content}</p>
                  </div>
                  {!isRead && (
                    <div className="p-4 pt-0">
                      <button onClick={() => markAsRead(lesson.id)} className="w-full bg-primary-50 text-primary-700 hover:bg-primary-100 font-semibold text-xs py-2 rounded-lg transition-colors">
                        Mark as Read
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'chat' && (
        <div className="premium-card flex flex-col h-[600px] max-w-4xl mx-auto overflow-hidden relative shadow-premium border border-surface-200">
          
          <div className="bg-[#FAF7FC] p-4 flex justify-between items-center border-b border-[#EBE2F4]">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-[#2D213F] rounded-full flex items-center justify-center text-white">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="w-3 h-3 rounded-full bg-success-500 border-2 border-white absolute bottom-0 right-0"></div>
              </div>
              <div>
                <h3 className="font-bold text-[#111827] text-sm">Sakhi AI Assistant</h3>
                <span className="text-[#6B7280] text-[10px]">Online • Replies instantly</span>
              </div>
            </div>
            <button 
              onClick={() => {
                setIsVoiceEnabled(!isVoiceEnabled);
                if (isVoiceEnabled) window.speechSynthesis?.cancel();
              }}
              className={`p-2 rounded-lg transition-colors ${isVoiceEnabled ? 'bg-primary-100 text-primary-700 hover:bg-primary-200' : 'bg-surface-100 text-surface-500 hover:bg-surface-200'}`}
              title={isVoiceEnabled ? "Mute Sakhi" : "Unmute Sakhi"}
            >
              {isVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-6 p-6 pb-32 bg-[#F8FAFC]">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-[#2D213F] flex-shrink-0 flex items-center justify-center text-white mr-3 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div className={`max-w-[75%] rounded-2xl p-4 text-sm shadow-sm leading-relaxed ${msg.role === 'user' ? 'bg-primary-600 text-white rounded-tr-sm' : 'bg-white text-[#111827] rounded-tl-sm border border-surface-200'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start items-center">
                <div className="w-8 h-8 rounded-full bg-[#2D213F] flex-shrink-0 flex items-center justify-center text-white mr-3">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-surface-200 rounded-2xl rounded-tl-sm p-4 shadow-sm flex items-center gap-1.5 h-12">
                  <div className="w-2 h-2 rounded-full bg-primary-400 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{animationDelay: '150ms'}}></div>
                  <div className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{animationDelay: '300ms'}}></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-surface-200 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
            <form onSubmit={(e) => { e.preventDefault(); handleSendChat(chatInput); }} className="flex gap-3">
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Type or speak..." 
                  className="w-full bg-surface-50 border border-surface-200 focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-50 rounded-xl py-3.5 pl-4 pr-12 text-sm text-[#111827] outline-none transition-all duration-200"
                />
                {recognition && (
                  <button 
                    type="button" 
                    onClick={toggleListening}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${isListening ? 'bg-danger-100 text-danger-600 animate-pulse' : 'bg-transparent text-[#6B7280] hover:text-primary-600 hover:bg-primary-50'}`}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                )}
              </div>

              <button type="submit" disabled={!chatInput.trim() || isTyping} className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl text-sm transition-colors shadow-sm">
                Send
              </button>
            </form>
          </div>
        </div>
      )}

    </FadeContent>
  );
}
