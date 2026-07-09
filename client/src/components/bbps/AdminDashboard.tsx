import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Activity, CheckCircle, XCircle, DollarSign, Loader2, Server, ShieldAlert } from 'lucide-react';
import FadeContent from '../ui/FadeContent';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [statsRes, logsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/admin/stats'),
          axios.get('http://localhost:5000/api/admin/audit-logs')
        ]);
        setStats(statsRes.data);
        setLogs(logsRes.data);
      } catch (err) {
        console.error('Failed to fetch admin data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;

  return (
    <FadeContent className="space-y-8 pb-24">
      {/* Header */}
      <div className="bg-[#2D213F] rounded-[18px] p-8 shadow-premium text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <Server className="w-48 h-48" />
        </div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-semibold text-white/90 mb-3 border border-white/20">
            <ShieldAlert className="w-3.5 h-3.5" /> Internal Use Only
          </div>
          <h2 className="text-3xl font-display font-bold text-white mb-2">BBPS Admin Console</h2>
          <p className="text-white/80 max-w-lg leading-relaxed">
            Live monitoring of all bill payment transactions and system audit logs across the SakhiCredit platform.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-surface-200 hover:border-primary-200 transition-colors">
          <div className="flex items-center gap-2 mb-3 text-[#6B7280] font-bold text-xs uppercase tracking-wider"><Activity className="w-4 h-4 text-primary-500"/> Total Volume</div>
          <p className="text-3xl font-display font-bold text-[#111827]">{stats?.totalVolume.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-surface-200 hover:border-success-200 transition-colors">
          <div className="flex items-center gap-2 mb-3 text-[#6B7280] font-bold text-xs uppercase tracking-wider"><CheckCircle className="w-4 h-4 text-success-500"/> Success Rate</div>
          <p className="text-3xl font-display font-bold text-[#111827]">{stats?.successRate}%</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-surface-200 hover:border-danger-200 transition-colors">
          <div className="flex items-center gap-2 mb-3 text-[#6B7280] font-bold text-xs uppercase tracking-wider"><XCircle className="w-4 h-4 text-danger-500"/> Failures</div>
          <p className="text-3xl font-display font-bold text-[#111827]">{stats?.failures.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-surface-200 hover:border-accent-200 transition-colors">
          <div className="flex items-center gap-2 mb-3 text-[#6B7280] font-bold text-xs uppercase tracking-wider"><DollarSign className="w-4 h-4 text-accent-500"/> Revenue</div>
          <p className="text-3xl font-display font-bold text-[#111827]">₹{(stats?.revenue / 100000).toFixed(1)}L</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-surface-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-surface-200 bg-surface-50 flex items-center justify-between">
          <h3 className="font-bold text-[#111827]">Live Audit Logs</h3>
          <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider bg-white px-3 py-1 rounded-full border border-surface-200">Last 50 Events</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#4B5563]">
            <thead className="text-[10px] uppercase font-bold tracking-wider bg-white text-[#6B7280] border-b border-surface-200">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-[#6B7280]">{new Date(log.timestamp).toLocaleTimeString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-widest font-bold border ${
                      log.action.includes('SUCCESS') 
                        ? 'bg-success-50 text-success-700 border-success-200' 
                        : 'bg-danger-50 text-danger-700 border-danger-200'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs font-medium">{log.userId}</td>
                  <td className="px-6 py-4 text-xs font-medium truncate max-w-xs" title={JSON.stringify(log.details)}>{JSON.stringify(log.details)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </FadeContent>
  );
}
