import { useState, useEffect } from 'react';
import FadeContent from './ui/FadeContent';
import { Users, Target, Flame, Send, MessageCircle, Heart, ShieldCheck } from 'lucide-react';

const MOCK_GROUP = {
  name: 'Saraswati Mahila Mandal',
  goalAmount: 50000,
  currentSavings: 32500,
  trustScore: 78,
  members: [
    { name: 'Priya', streak: 12 },
    { name: 'Sunita', streak: 12 },
    { name: 'Aarti', streak: 8 },
    { name: 'Meena', streak: 10 },
    { name: 'You', streak: 12 }
  ],
  messages: [
    { sender: 'Sunita', text: 'Great job this month everyone! We are so close to our goal.' },
    { sender: 'Aarti', text: 'I am proud of us!' }
  ]
};

export default function GroupDashboard({ sessionId }) {
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/group/${sessionId}`, {
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          setGroup(data);
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (sessionId) fetchGroup();
  }, [sessionId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    // Optimistic UI update
    const optimisticMsg = { sender: 'You', text: newMessage };
    setMessages([...messages, optimisticMsg]);
    const textToSend = newMessage;
    setNewMessage('');

    try {
      const res = await fetch(`http://localhost:5000/api/group/${sessionId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text: textToSend })
      });
      if (res.ok) {
        const data = await res.json();
        setGroup(data);
        setMessages(data.messages);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-12 text-[#6B7280]">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
      <p className="font-medium">Loading your community...</p>
    </div>
  );
  if (!group) return <div className="text-center p-8 text-danger-500 font-medium">Could not load group data.</div>;

  const progress = Math.min(100, Math.round((group.currentSavings / group.goalAmount) * 100));

  return (
    <FadeContent className="max-w-[1200px] mx-auto pb-12 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-[#2D213F] rounded-[18px] p-8 shadow-premium text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <Users className="w-48 h-48" />
        </div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-semibold text-white/90 mb-3 border border-white/20">
            <Users className="w-3.5 h-3.5" /> Self-Help Group
          </div>
          <h3 className="text-3xl font-display font-bold text-white mb-1">{group.name}</h3>
          <p className="text-white/70">Empowering each other towards financial independence.</p>
        </div>
        
        <div className="relative z-10 bg-white/10 border border-white/20 p-5 rounded-2xl flex items-center gap-4 backdrop-blur-sm min-w-[200px]">
          <div className="w-12 h-12 bg-success-50 text-success-600 rounded-full flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-widest text-white/70 font-bold mb-0.5">Trust Score</span>
            <span className="text-2xl font-bold text-white leading-none">{group.trustScore}</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Left Column: Progress & Members */}
        <div className="lg:col-span-7 space-y-6">
          <div className="premium-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <Target className="w-6 h-6 text-primary-500" />
              <h4 className="font-bold text-lg text-[#111827]">Shared Goal Progress</h4>
            </div>
            
            <div className="flex justify-between items-end mb-3">
              <div>
                <span className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Current Savings</span>
                <span className="text-3xl font-display font-bold text-[#111827]">₹{group.currentSavings.toLocaleString('en-IN')}</span>
              </div>
              <div className="text-right">
                <span className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Target Goal</span>
                <span className="text-lg font-bold text-[#4B5563]">₹{group.goalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
            
            <div className="bg-surface-100 rounded-full h-4 w-full overflow-hidden mb-3 border border-surface-200">
              <div 
                className="bg-success-500 h-full transition-all duration-1000 ease-out relative" 
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
              </div>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold text-success-600">{progress}% Achieved</span>
              <span className="text-[#6B7280] font-medium">Keep it up!</span>
            </div>
          </div>
          
          <div className="premium-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Flame className="w-6 h-6 text-amber-500" />
                <h4 className="font-bold text-lg text-[#111827]">Member Streaks</h4>
              </div>
              <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider bg-surface-100 px-3 py-1 rounded-full">
                {group.members.length} Members
              </span>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-3">
              {group.members.map((m, idx) => {
                const isMe = m.name === 'You';
                return (
                  <div key={idx} className={`flex justify-between items-center p-3 rounded-xl border ${isMe ? 'bg-primary-50 border-primary-200 shadow-sm' : 'bg-white border-surface-200'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isMe ? 'bg-primary-600 text-white' : 'bg-surface-100 text-[#4B5563]'}`}>
                        {m.name.charAt(0)}
                      </div>
                      <span className={`font-semibold text-sm ${isMe ? 'text-primary-900' : 'text-[#374151]'}`}>
                        {m.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-bold text-xs shadow-sm">
                      <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> {m.streak} wks
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Chat Board */}
        <div className="lg:col-span-5">
          <div className="premium-card flex flex-col h-[600px]">
            <div className="p-5 border-b border-surface-200 bg-surface-50 rounded-t-[16px] flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-[#111827]">Encouragement Board</h4>
                <span className="text-xs text-[#6B7280] font-medium">Support your sisters</span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#F8FAFC]">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-[#6B7280]">
                  <Heart className="w-8 h-8 text-surface-300 mb-2" />
                  <p className="text-sm font-medium">Be the first to send some love!</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.sender === 'You';
                  return (
                    <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1 px-1">
                        {msg.sender}
                      </span>
                      <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm text-sm ${
                        isMe 
                          ? 'bg-primary-600 text-white rounded-tr-sm' 
                          : 'bg-white border border-surface-200 text-[#111827] rounded-tl-sm'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 bg-white border-t border-surface-200 rounded-b-[16px]">
              <form onSubmit={handleSendMessage} className="flex gap-2 relative">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Cheer on your group..." 
                  className="w-full bg-surface-100 border-none outline-none focus:ring-2 focus:ring-primary-500 rounded-xl pl-4 pr-12 py-3 text-sm text-[#111827]"
                />
                <button 
                  type="submit" 
                  disabled={!newMessage.trim()} 
                  className="absolute right-1 top-1 bottom-1 aspect-square bg-primary-600 hover:bg-primary-700 disabled:bg-surface-300 text-white rounded-lg flex items-center justify-center transition-colors shadow-sm"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
        
      </div>
    </FadeContent>
  );
}
