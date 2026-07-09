import { motion } from 'framer-motion';

export default function StatCard({ title, value, subtitle, icon, badge, children, className = '' }) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={`bg-white rounded-[18px] shadow-premium border border-[#E5E7EB] p-5 flex flex-col justify-between ${className}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon && <div className="text-gray-400">{icon}</div>}
          <h3 className="text-sm font-semibold text-[#111827]">{title}</h3>
        </div>
        {badge && (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${badge.colorClass}`}>
            {badge.text}
          </span>
        )}
      </div>
      
      <div className="mt-2 mb-1">
        {typeof value === 'string' || typeof value === 'number' ? (
          <div className="text-3xl font-display font-bold text-[#111827]">{value}</div>
        ) : (
          value
        )}
      </div>

      {subtitle && (
        <div className="text-xs font-medium mt-1">
          {typeof subtitle === 'string' ? (
            <span className="text-[#6B7280]">{subtitle}</span>
          ) : (
            subtitle
          )}
        </div>
      )}

      {children && <div className="mt-3 pt-3 border-t border-gray-100">{children}</div>}
    </motion.div>
  );
}
