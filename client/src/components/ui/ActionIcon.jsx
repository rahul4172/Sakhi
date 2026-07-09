import { motion } from 'framer-motion';

export default function ActionIcon({ icon: Icon, label, sublabel, colorClass, onClick }) {
  return (
    <motion.button 
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 group w-24"
    >
      <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm transition-shadow group-hover:shadow-md ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-center">
        <div className="text-[11px] font-bold text-[#111827] leading-tight mb-0.5">{label}</div>
        {sublabel && <div className="text-[9px] text-[#6B7280] leading-tight">{sublabel}</div>}
      </div>
    </motion.button>
  );
}
