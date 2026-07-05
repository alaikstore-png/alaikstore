import { motion } from 'framer-motion'
import { howToSteps } from '../../data/mockData'

export default function HowToTopUp() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {howToSteps.map((step, i) => (
        <motion.div
          key={step.title}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: i * 0.1 }}
          className="glass-card p-6 relative"
        >
          <span className="absolute -top-3 -left-3 w-9 h-9 rounded-full bg-neon flex items-center justify-center font-display font-bold text-sm shadow-neon">
            {i + 1}
          </span>
          <h3 className="font-semibold mt-2 mb-2">{step.title}</h3>
          <p className="text-sm text-white/50 leading-relaxed">{step.desc}</p>
        </motion.div>
      ))}
    </div>
  )
}
