import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'

/**
 * Generic CRUD form modal.
 * `fields`: [{ key, label, type: 'text'|'number'|'textarea'|'select'|'checkbox'|'date', options?, required? }]
 * `initialValues`: object to prefill (edit mode) or {} (create mode)
 * `onSave(values)`: async function that performs the actual Supabase insert/update
 */
export default function CrudModal({ title, fields, initialValues = {}, onSave, onClose }) {
  const [values, setValues] = useState(() => {
    const defaults = {}
    fields.forEach((f) => {
      if (f.key in initialValues && initialValues[f.key] != null) {
        defaults[f.key] = initialValues[f.key]
      } else if (f.type === 'checkbox') {
        defaults[f.key] = false
      } else if (f.type === 'select') {
        defaults[f.key] = f.options?.[0]?.value ?? ''
      } else {
        defaults[f.key] = ''
      }
    })
    return defaults
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (key, val) => setValues((v) => ({ ...v, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await onSave(values)
      onClose()
    } catch (err) {
      setError(err.message || 'Gagal menyimpan data.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-card w-full max-w-lg max-h-[85vh] overflow-y-auto p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-lg">{title}</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="block text-xs text-white/40 mb-1.5">{f.label}{f.required && ' *'}</label>

                {f.type === 'textarea' ? (
                  <textarea
                    rows={3}
                    required={f.required}
                    value={values[f.key]}
                    onChange={(e) => set(f.key, e.target.value)}
                    className="input-glass resize-none"
                  />
                ) : f.type === 'select' ? (
                  <select
                    required={f.required}
                    value={values[f.key]}
                    onChange={(e) => set(f.key, e.target.value)}
                    className="input-glass"
                  >
                    <option value="" disabled>Pilih {f.label}</option>
                    {f.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : f.type === 'checkbox' ? (
                  <label className="flex items-center gap-2 text-sm text-white/70">
                    <input
                      type="checkbox"
                      checked={!!values[f.key]}
                      onChange={(e) => set(f.key, e.target.checked)}
                      className="w-4 h-4 accent-neon"
                    />
                    Aktif
                  </label>
                ) : (
                  <input
                    type={f.type || 'text'}
                    required={f.required}
                    step={f.type === 'number' ? 'any' : undefined}
                    value={values[f.key]}
                    onChange={(e) => set(f.key, f.type === 'number' ? e.target.valueAsNumber || 0 : e.target.value)}
                    className="input-glass"
                  />
                )}
              </div>
            ))}

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-outline flex-1">Batal</button>
              <button type="submit" disabled={saving} className="btn-neon flex-1 flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Simpan
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
