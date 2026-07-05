import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { faqs } from '../../data/mockData'

export default function FaqAccordion() {
  const [open, setOpen] = useState(0)

  return (
    <div className="max-w-3xl mx-auto space-y-3">
      {faqs.map((item, i) => (
        <div key={item.q} className="glass-card overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? -1 : i)}
            className="w-full flex items-center justify-between px-5 py-4 text-left"
          >
            <span className="font-medium text-sm md:text-base">{item.q}</span>
            <ChevronDown
              className={`w-4 h-4 shrink-0 transition-transform duration-300 ${open === i ? 'rotate-180 text-neon-light' : ''}`}
            />
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <p className="px-5 pb-4 text-sm text-white/50 leading-relaxed">{item.a}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}
