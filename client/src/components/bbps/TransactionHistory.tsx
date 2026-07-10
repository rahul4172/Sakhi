import React from 'react';
import { useTransactionHistory } from '../../hooks/useBBPS';
import { Download, AlertCircle, CheckCircle2, Clock, Activity } from 'lucide-react';
import { API_BASE_URL } from '../../api/client';

export default function TransactionHistory({ sessionId }: { sessionId: string }) {
  const { data: history, isLoading } = useTransactionHistory(sessionId);

  if (isLoading) return <div className="animate-pulse h-32 bg-surface-100 rounded-2xl mt-6"></div>;

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-surface-200 mt-6 flex flex-col items-center">
        <Activity className="w-12 h-12 text-surface-300 mb-3" />
        <p className="text-[#6B7280] font-medium">No recent transactions found.</p>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS': return <CheckCircle2 className="w-5 h-5 text-success-500" />;
      case 'FAILED': 
      case 'TIMEOUT': return <AlertCircle className="w-5 h-5 text-danger-500" />;
      default: return <Clock className="w-5 h-5 text-warning-500" />;
    }
  };

  return (
    <div className="bg-white rounded-[16px] shadow-sm border border-surface-200 overflow-hidden mt-6">
      <div className="px-6 py-5 border-b border-surface-200 bg-surface-50 flex items-center gap-2">
        <Activity className="w-5 h-5 text-primary-600" />
        <h3 className="font-bold text-[#111827]">Recent Transactions</h3>
      </div>
      <div className="divide-y divide-surface-100 max-h-[500px] overflow-y-auto custom-scrollbar">
        {history.map((tx: any) => (
          <div key={tx.transactionId} className="p-4 sm:px-6 hover:bg-surface-50 transition-colors flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="bg-white p-2.5 rounded-xl shadow-sm border border-surface-200 group-hover:scale-105 transition-transform">
                {getStatusIcon(tx.status)}
              </div>
              <div>
                <p className="font-bold text-[#111827]">{tx.billerId} Bill</p>
                <div className="flex text-[11px] font-medium text-[#6B7280] gap-2 items-center mt-0.5">
                  <span>{new Date(tx.date).toLocaleDateString()}</span>
                  <span className="w-1 h-1 bg-surface-300 rounded-full"></span>
                  <span className={`uppercase tracking-wider font-bold ${
                    tx.status === 'SUCCESS' ? 'text-success-600' : 
                    tx.status === 'FAILED' ? 'text-danger-600' : 'text-warning-600'
                  }`}>{tx.status}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-bold text-[#111827] text-lg">₹{tx.amount}</span>
              {tx.status === 'SUCCESS' && (
                <a 
                  href={`${API_BASE_URL}/api/bbps/receipt/${tx.transactionId}`}
                  target="_blank"
                  className="p-2 text-primary-600 hover:bg-primary-50 hover:text-primary-700 rounded-full transition-colors border border-transparent hover:border-primary-100"
                  title="Download Receipt"
                >
                  <Download className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
