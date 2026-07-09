import { useState, useEffect } from 'react';
import { Gift, Zap, TrendingUp, CheckCircle, ShieldAlert, Award, Loader2, Sparkles, Receipt, Copy, Check, ExternalLink } from 'lucide-react';
import FadeContent from './ui/FadeContent';

export default function RewardsDashboard({ sessionId, profile, onScoreUpdate }) {
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState([]);
  const [walletAddress, setWalletAddress] = useState('');
  const [blockchainNetwork, setBlockchainNetwork] = useState('');
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [message, setMessage] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchRewardsData = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/rewards/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setBalance(data.tokenBalance);
        setHistory(data.tokenHistory || []);
        setWalletAddress(data.walletAddress || '');
        setBlockchainNetwork(data.blockchainNetwork || 'local-mock');
      }
    } catch (err) {
      console.error('Error fetching rewards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId) {
      fetchRewardsData();
    }
  }, [sessionId]);

  const earnPoints = async (amount, description) => {
    setClaiming(true);
    try {
      const res = await fetch(`http://localhost:5000/api/rewards/earn/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, description })
      });
      if (res.ok) {
        const data = await res.json();
        setBalance(data.tokenBalance);
        setHistory(data.tokenHistory);
        showFeedback(`Successfully minted ${amount} SAKHI coins on-chain!`, 'success');
      }
    } catch (err) {
      console.error(err);
      showFeedback('Failed to claim coins. Try again.', 'error');
    } finally {
      setClaiming(false);
    }
  };

  const redeemReward = async (rewardId, cost, label) => {
    if (balance < cost) {
      showFeedback('Insufficient SAKHI Coins!', 'error');
      return;
    }
    setClaiming(true);
    try {
      const res = await fetch(`http://localhost:5000/api/rewards/redeem/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewardId, cost, label })
      });
      if (res.ok) {
        const data = await res.json();
        setBalance(data.tokenBalance);
        setHistory(data.tokenHistory);
        showFeedback(`Redeemed ${label} successfully on-chain!`, 'success');
        
        // If they bought a trust score boost, trigger score update callback on parent dashboard
        if (rewardId === 'trust_boost' && onScoreUpdate) {
          onScoreUpdate();
        }
      } else {
        const errData = await res.json();
        showFeedback(errData.error || 'Failed to redeem reward.', 'error');
      }
    } catch (err) {
      console.error(err);
      showFeedback('Redemption failed. Try again.', 'error');
    } finally {
      setClaiming(false);
    }
  };

  const copyToClipboard = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getExplorerLink = (txHash) => {
    if (!txHash) return '#';
    if (blockchainNetwork === 'base-sepolia') {
      return `https://sepolia.basescan.org/tx/${txHash}`;
    }
    // Fallback/Mock explorer
    return `https://sepolia.basescan.org/tx/${txHash}`;
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const showFeedback = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const isProfileSetupClaimed = history.some(item => 
    item.description && 
    (item.description.includes('Profile Setup Bonus') || item.description.includes('Profile Setup')) &&
    item.status === 'success'
  );

  const STORE_ITEMS = [
    { id: 'recharge_50', label: '₹50 Mobile Recharge Voucher', cost: 500, description: 'Get ₹50 off on your next mobile prepaid/postpaid recharge.', icon: <Zap className="w-6 h-6 text-warning-500" /> },
    { id: 'grocery_100', label: '₹100 Grocery Voucher', cost: 1000, description: 'Redeem for local store grocery purchase discounts.', icon: <Sparkles className="w-6 h-6 text-success-500" /> },
    { id: 'trust_boost', label: 'SakhiScore Trust Boost (+5)', cost: 300, description: 'Instantly add +5 points to your SakhiScore for faster loan matching.', icon: <Award className="w-6 h-6 text-primary-500" /> },
    { id: 'advisor_premium', label: 'Premium Financial Advisory', cost: 400, description: 'Unlock 1-on-1 advisor chat for scheme application assistance.', icon: <Gift className="w-6 h-6 text-info-500" /> }
  ];

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <FadeContent className="space-y-8 pb-24">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#2D213F] to-[#432A5B] rounded-[18px] p-8 shadow-premium text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <Gift className="w-48 h-48" />
        </div>
        
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-semibold text-white/90 mb-3 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-warning-400" /> Blockchain Rewards Enabled
          </div>
          <h2 className="text-3xl font-display font-bold text-white mb-2">Real Digital Reward Assets</h2>
          <p className="text-white/80 leading-relaxed text-sm">
            Earn SAKHI tokens directly to your custodial blockchain wallet by using the app, quiz participation, and paying bills. Redeem tokens for real-value vouchers and credit trust score boosts!
          </p>

          {/* Wallet Address Info */}
          {walletAddress && (
            <div className="mt-4 inline-flex flex-col md:flex-row items-start md:items-center gap-3 bg-black/25 px-4 py-2.5 rounded-xl border border-white/10 text-xs">
              <div>
                <span className="text-white/50 block text-[9px] uppercase tracking-wider font-semibold">Your Wallet Address</span>
                <span className="font-mono text-white/90 select-all font-medium">{walletAddress}</span>
              </div>
              <div className="flex items-center gap-2 self-stretch md:self-auto justify-end md:border-l md:border-white/10 md:pl-3">
                <button
                  onClick={copyToClipboard}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1.5 text-white/80"
                  title="Copy address"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-success-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                  blockchainNetwork === 'base-sepolia' 
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/35' 
                    : 'bg-orange-500/20 text-orange-300 border border-orange-500/35'
                }`}>
                  {blockchainNetwork === 'base-sepolia' ? 'Base Sepolia' : 'Not Configured'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Balance Card */}
        <div className="relative z-10 bg-white/10 border border-white/20 p-6 rounded-2xl flex flex-col items-center justify-center min-w-[200px] backdrop-blur-sm shadow-inner">
          <span className="text-xs uppercase tracking-widest text-white/70 font-semibold mb-1">On-Chain Balance</span>
          <div className="text-4xl font-display font-extrabold text-[#E5B59E] flex items-center gap-2 animate-pulse">
            🪙 {balance}
          </div>
          <span className="text-[10px] text-white/60 mt-1">SAKHI Tokens</span>
        </div>
      </div>

      {/* Floating feedback message */}
      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 shadow-md animate-fade-in ${
          message.type === 'success' 
            ? 'bg-success-50 border-success-100 text-success-800' 
            : 'bg-danger-50 border-danger-100 text-danger-800'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 text-success-500" /> : <ShieldAlert className="w-5 h-5 text-danger-500" />}
          <span className="text-sm font-semibold">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Earn Points & Shop (Spans 8) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Earn Section */}
          <div className="premium-card p-6">
            <h3 className="text-lg font-bold text-[#111827] mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-600" /> Ways to Earn Tokens
            </h3>
            <p className="text-xs text-[#6B7280] mb-6">Complete activities to receive direct on-chain token distributions.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-surface-50 border border-surface-100 rounded-xl flex items-start gap-4 hover:shadow-sm transition-shadow">
                <div className="p-2.5 bg-primary-50 rounded-lg text-primary-600">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-[#111827]">Complete Profile</h4>
                  <p className="text-xs text-[#6B7280] mt-0.5">Tell us more about your business.</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-lg">
                      +100 SAKHI
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isProfileSetupClaimed 
                        ? 'bg-success-100 text-success-800' 
                        : 'bg-warning-100 text-warning-800'
                    }`}>
                      {isProfileSetupClaimed ? 'Claimed' : 'Earned on setup'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-surface-50 border border-surface-100 rounded-xl flex items-start gap-4 hover:shadow-sm transition-shadow">
                <div className="p-2.5 bg-success-50 rounded-lg text-success-600">
                  <Receipt className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-[#111827]">Pay Utility Bills</h4>
                  <p className="text-xs text-[#6B7280] mt-0.5">Pay electric, water, or phone bills in BBPS.</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-success-600 bg-success-50 px-2.5 py-1 rounded-lg">
                      +50 SAKHI per Bill
                    </span>
                    <span className="text-[10px] font-bold text-success-800 bg-success-100 px-2 py-0.5 rounded-full">
                      Automatic on payment
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-surface-50 border border-surface-100 rounded-xl flex items-start gap-4 hover:shadow-sm transition-shadow">
                <div className="p-2.5 bg-warning-50 rounded-lg text-warning-600">
                  <Award className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-[#111827]">Financial Literacy</h4>
                  <p className="text-xs text-[#6B7280] mt-0.5">Learn about savings & credit rules.</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-warning-600 bg-warning-50 px-2.5 py-1 rounded-lg">
                      +25 SAKHI
                    </span>
                    <span className="text-[10px] font-bold text-[#8659AD] bg-[#FAF7FC] px-2 py-0.5 rounded-full border border-[#EBE2F4]">
                      Earned on quiz completion
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-surface-50 border border-surface-100 rounded-xl flex items-start gap-4 hover:shadow-sm transition-shadow">
                <div className="p-2.5 bg-info-50 rounded-lg text-info-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-[#111827]">Weekly Log Streak</h4>
                  <p className="text-xs text-[#6B7280] mt-0.5">Keep household logs daily for 7 days.</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-info-600 bg-info-50 px-2.5 py-1 rounded-lg">
                      +50 SAKHI
                    </span>
                    <span className="text-[10px] font-bold text-[#5569B3] bg-[#F0F2FA] px-2 py-0.5 rounded-full border border-[#D3D9ED]">
                      Earned on 7-day streak
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Shop Section */}
          <div className="premium-card p-6">
            <h3 className="text-lg font-bold text-[#111827] mb-2 flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary-600" /> Rewards Shop
            </h3>
            <p className="text-xs text-[#6B7280] mb-6">Burn your tokens to redeem helpful vouchers or credit score boosts.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {STORE_ITEMS.map((item) => {
                const canAfford = balance >= item.cost;
                return (
                  <div key={item.id} className="p-5 border border-surface-100 rounded-xl flex flex-col justify-between hover:shadow-md transition-all bg-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-surface-50 to-transparent rounded-bl-full z-0 group-hover:scale-105 transition-transform" />
                    
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-surface-50 rounded-xl">
                          {item.icon}
                        </div>
                        <span className="text-xs font-bold text-[#B3648B] bg-[#FDF4F8] px-2.5 py-1 rounded-full border border-[#FBE3EE]">
                          🪙 {item.cost} SAKHI
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-[#111827] mb-1">{item.label}</h4>
                      <p className="text-xs text-[#6B7280] leading-relaxed mb-6">{item.description}</p>
                    </div>

                    <button
                      disabled={!canAfford || claiming}
                      onClick={() => redeemReward(item.id, item.cost, item.label)}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all relative z-10 cursor-pointer ${
                        canAfford 
                          ? 'bg-[#2D213F] text-white hover:bg-[#3F2E56]' 
                          : 'bg-surface-100 text-surface-400 cursor-not-allowed'
                      }`}
                    >
                      {claiming ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : canAfford ? 'Redeem Voucher' : 'Not Enough Tokens'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Side: Ledger / Transaction History (Spans 4) */}
        <div className="lg:col-span-4 premium-card p-6 flex flex-col min-h-[400px]">
          <h3 className="text-sm font-bold text-[#111827] mb-6 flex items-center gap-2 border-b border-surface-100 pb-3">
            🪙 Ledger Transaction History
          </h3>
          
          <div className="flex-1 overflow-y-auto max-h-[500px] space-y-4 pr-1">
            {history.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-65 p-6">
                <div className="w-12 h-12 bg-surface-50 rounded-full flex items-center justify-center text-surface-400 mb-3 border border-surface-100">
                  <Receipt className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-[#111827]">No Ledger History</p>
                <p className="text-[10px] text-[#6B7280] mt-0.5">Your on-chain transfers and redemptions will appear here.</p>
              </div>
            ) : (
              [...history].reverse().map((item, index) => {
                const isEarn = item.type === 'earn';
                return (
                  <div key={index} className="p-3 rounded-lg bg-surface-50 border border-surface-100 text-xs hover:bg-surface-100/50 transition-colors flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5 pr-2">
                        <p className="font-semibold text-[#111827] leading-tight truncate max-w-[130px]">{item.description}</p>
                        <p className="text-[10px] text-[#6B7280]">{new Date(item.date).toLocaleDateString()}</p>
                      </div>
                      <span className={`font-bold px-2 py-0.5 rounded text-[10px] whitespace-nowrap ${
                        isEarn 
                          ? 'text-success-700 bg-success-50 border border-success-100' 
                          : 'text-danger-700 bg-danger-50 border border-danger-100'
                      }`}>
                        {isEarn ? `+ ${item.amount}` : `- ${item.amount}`}
                      </span>
                    </div>

                    {/* On-chain Details & Tx Hash link */}
                    {item.transactionHash && (
                      <div className="flex items-center justify-between border-t border-surface-100/80 pt-2 text-[10px] text-[#6B7280]">
                        <span className="flex items-center gap-1 font-medium">
                          ⛓️ On-Chain: 
                          <span className={`px-1.5 py-0.2 rounded font-bold uppercase text-[8px] ${
                            item.status === 'failed' ? 'bg-danger-100 text-danger-700' : 'bg-success-100 text-success-700'
                          }`}>
                            {item.status || 'success'}
                          </span>
                        </span>
                        
                        <a
                          href={getExplorerLink(item.transactionHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-800 font-mono flex items-center gap-0.5 transition-colors font-semibold"
                          title="View on block explorer"
                        >
                          {formatAddress(item.transactionHash)}
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </FadeContent>
  );
}
