// ═══════════════════════════════════════════════════════════════
// THE HIVE OS V4 - Loading Screen Component
// ═══════════════════════════════════════════════════════════════

import { motion } from 'framer-motion';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <motion.div
        className="flex flex-col items-center gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Animated Logo */}
        <motion.div
          className="relative w-16 h-16"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700" />
          <div className="absolute inset-2 rounded-xl bg-slate-50 flex items-center justify-center">
            <span className="text-2xl font-bold text-slate-900">H</span>
          </div>
        </motion.div>

        {/* Loading dots */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-slate-400"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                repeat: Infinity,
                duration: 1,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>

        <p className="text-sm text-slate-500">Chargement de THE HIVE...</p>
      </motion.div>
    </div>
  );
}
