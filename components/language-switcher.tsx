"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { useLanguage, languages, Language } from "./language-context"

interface LanguageSwitcherProps {
  isOpen: boolean
  onClose: () => void
}

export function LanguageSwitcher({ isOpen, onClose }: LanguageSwitcherProps) {
  const { language: currentLanguage, setLanguage } = useLanguage()

  const handleSelectLanguage = (lang: Language) => {
    setLanguage(lang)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden"
            style={{ background: "#faf5f0" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Gold border on top */}
            <div className="h-0.5 bg-gradient-to-r from-[#c9933a]/30 via-[#c9933a] to-[#c9933a]/30" />

            {/* Handle */}
            <div className="flex justify-center pt-3">
              <div className="w-12 h-1 rounded-full bg-[#c9933a]/40" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4">
              <h2 
                className="text-xl text-[#4a2c2a]"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                Select Language
              </h2>
              <motion.button
                onClick={onClose}
                className="p-2 rounded-full border border-[#c9933a]/30 hover:border-[#c9933a]"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-4 h-4 text-[#c9933a]" />
              </motion.button>
            </div>

            {/* Language Grid - 2x4 */}
            <div className="grid grid-cols-2 gap-3 px-4 pb-8">
              {languages.map((lang, index) => {
                const isSelected = currentLanguage === lang.code
                
                return (
                  <motion.button
                    key={lang.code}
                    className="relative p-4 rounded-xl text-left overflow-hidden"
                    style={{
                      background: isSelected 
                        ? "linear-gradient(135deg, rgba(201, 147, 58, 0.2), rgba(201, 147, 58, 0.05))"
                        : "#f5ede8",
                      border: isSelected 
                        ? "1.5px solid #c9933a"
                        : "1px solid rgba(201, 147, 58, 0.2)",
                      boxShadow: isSelected 
                        ? "0 0 20px rgba(201, 147, 58, 0.3)"
                        : "none",
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectLanguage(lang.code)}
                  >
                    {/* Mandala dot indicator */}
                    <div className="absolute top-3 right-3">
                      <div className="relative">
                        {isSelected ? (
                          <>
                            <motion.div
                              className="absolute inset-0 rounded-full bg-[#c9933a]"
                              style={{ width: 8, height: 8 }}
                              animate={{ 
                                boxShadow: ["0 0 5px #c9933a", "0 0 15px #c9933a", "0 0 5px #c9933a"]
                              }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            />
                            <div className="w-2 h-2 rounded-full bg-[#c9933a]" />
                          </>
                        ) : (
                          <div className="w-2 h-2 rounded-full border border-[#c9933a]/40" />
                        )}
                      </div>
                    </div>

                    {/* Flag emoji */}
                    <span className="text-2xl mb-2 block">{lang.flag}</span>

                    {/* Language name in native script */}
                    <p 
                      className={`text-lg font-medium ${isSelected ? "text-[#c9933a]" : "text-[#4a2c2a]"}`}
                      style={{ fontFamily: 'var(--font-playfair)' }}
                    >
                      {lang.nativeName}
                    </p>

                    {/* English name */}
                    <p className="text-xs text-[#4a2c2a]/50 mt-0.5">
                      {lang.name}
                    </p>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
