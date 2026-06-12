import { AnimatePresence, motion } from 'framer-motion';

export type ToastItem = {
  id: string;
  title: string;
  detail?: string;
  tone?: 'info' | 'success' | 'danger';
};

export function ToastHost({ items }: { items: ToastItem[] }) {
  return (
    <div className="pointer-events-none fixed right-6 top-6 z-50 grid w-96 gap-3">
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: 24, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, scale: 0.96 }}
            className={`rounded-2xl border bg-[#101014]/95 p-4 shadow-2xl backdrop-blur-xl ${
              item.tone === 'danger' ? 'border-red-400/25' : item.tone === 'success' ? 'border-emerald-400/25' : 'border-violet-400/25'
            }`}
          >
            <p className="font-black text-white">{item.title}</p>
            {item.detail && <p className="mt-1 text-sm text-zinc-400">{item.detail}</p>}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
