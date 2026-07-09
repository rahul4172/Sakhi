import { motion } from 'framer-motion';

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="premium-card flex flex-col items-center justify-center text-center py-12"
    >
      <div className="w-16 h-16 bg-surface-50 rounded-full flex items-center justify-center text-surface-400 mb-4">
        {Icon && <Icon className="w-8 h-8" />}
      </div>
      <h3 className="text-lg font-semibold text-[#111827] mb-2">{title}</h3>
      <p className="text-sm text-[#6B7280] max-w-md mb-6">{description}</p>
      
      {actionLabel && onAction && (
        <button 
          onClick={onAction}
          className="premium-button text-sm"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
}
