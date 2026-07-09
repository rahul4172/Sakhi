import React from 'react';
import FadeContent from './ui/FadeContent';
import { FileText, CheckCircle2, UploadCloud, Shield, File, AlertCircle } from 'lucide-react';

export default function Documents() {
  const documents = [
    { id: 'aadhar', name: 'Aadhaar Card', status: 'verified', updatedAt: '2025-10-12', type: 'Identity Proof' },
    { id: 'pan', name: 'PAN Card', status: 'verified', updatedAt: '2025-10-12', type: 'Financial Identity' },
    { id: 'bank', name: 'Bank Statement (Last 6 months)', status: 'missing', type: 'Income Proof' },
    { id: 'shg', name: 'SHG Membership Letter', status: 'pending', type: 'Group Affiliation' }
  ];

  return (
    <FadeContent className="max-w-[1200px] mx-auto pb-12 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-[#111827]">My Documents</h2>
          <p className="text-sm text-[#6B7280] mt-1">Manage your KYC and financial documents securely.</p>
        </div>
        <div className="bg-success-50 text-success-700 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold border border-success-100 w-fit">
          <Shield className="w-4 h-4" /> 256-bit Encrypted Vault
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {documents.map(doc => (
          <div key={doc.id} className={`premium-card p-6 flex flex-col justify-between border-2 ${doc.status === 'verified' ? 'border-transparent' : doc.status === 'pending' ? 'border-amber-100 bg-amber-50/10' : 'border-dashed border-surface-200 bg-surface-50/50'}`}>
            <div className="flex justify-between items-start mb-6">
              <div className="flex gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${doc.status === 'verified' ? 'bg-indigo-50 text-indigo-500' : 'bg-surface-100 text-surface-400'}`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#111827]">{doc.name}</h3>
                  <p className="text-xs text-[#6B7280] mt-1">{doc.type}</p>
                </div>
              </div>
              
              {doc.status === 'verified' && (
                <div className="bg-success-50 text-success-600 px-2 py-1 rounded flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-3 h-3" /> Verified
                </div>
              )}
              {doc.status === 'pending' && (
                <div className="bg-amber-100 text-amber-700 px-2 py-1 rounded flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                  <AlertCircle className="w-3 h-3" /> Under Review
                </div>
              )}
              {doc.status === 'missing' && (
                <div className="bg-surface-200 text-surface-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                  Action Required
                </div>
              )}
            </div>

            <div className="mt-auto">
              {doc.status === 'verified' ? (
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#6B7280]">Last updated: {new Date(doc.updatedAt).toLocaleDateString()}</span>
                  <button className="text-xs font-semibold text-primary-600 hover:text-primary-700">View Document</button>
                </div>
              ) : (
                <button className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${doc.status === 'pending' ? 'bg-surface-100 text-surface-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm'}`} disabled={doc.status === 'pending'}>
                  <UploadCloud className="w-4 h-4" /> {doc.status === 'pending' ? 'Review in Progress' : 'Upload File'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </FadeContent>
  );
}
