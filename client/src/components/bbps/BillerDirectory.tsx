import React, { useState } from 'react';
import { useBillers } from '../../hooks/useBBPS';
import { Search, Wallet } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface BillerDirectoryProps {
  onSelectBiller: (biller: any) => void;
}

export default function BillerDirectory({ onSelectBiller }: BillerDirectoryProps) {
  const { data: billers, isLoading } = useBillers();
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useLanguage();

  if (isLoading) {
    return <div className="animate-pulse space-y-6">
      <div className="h-12 bg-surface-200 rounded-xl w-full"></div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[1,2,3,4,5,6].map(i => <div key={i} className="h-32 bg-surface-100 rounded-xl"></div>)}
      </div>
    </div>;
  }

  const filteredBillers = billers?.filter((b: any) => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-xl text-[#111827] flex items-center gap-2">
          <Wallet className="w-5 h-5 text-primary-500" />
          {t('select_biller')}
        </h3>
      </div>
      
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-surface-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder={t('search_biller_placeholder')} 
          className="w-full pl-12 pr-4 py-3.5 bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all shadow-sm text-sm font-medium text-[#111827] placeholder:text-surface-400"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {filteredBillers?.map((biller: any) => (
          <button 
            key={biller.billerId}
            onClick={() => onSelectBiller(biller)}
            className="flex flex-col items-center p-6 bg-white border border-surface-200 rounded-2xl hover:border-primary-300 hover:shadow-premium-hover transition-all group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="text-4xl mb-3 group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300 relative z-10 filter drop-shadow-sm">{biller.logo}</div>
            <h3 className="text-sm font-bold text-[#111827] text-center leading-tight mb-1 relative z-10">{biller.name}</h3>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-primary-600 relative z-10">{biller.category}</span>
          </button>
        ))}
      </div>
      {filteredBillers?.length === 0 && (
        <div className="text-center py-12 border border-dashed border-surface-200 rounded-2xl bg-surface-50">
          <Search className="w-8 h-8 text-surface-300 mx-auto mb-3" />
          <p className="text-[#6B7280] font-medium">{t('no_billers_found')} "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
}
