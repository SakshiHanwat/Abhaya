'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, User, Phone, KeyRound } from 'lucide-react'
import { sendOTP, verifyOTP, saveProfile } from '@/lib/auth'

interface AuthScreenProps {
  onAuthSuccess: () => void
}

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [step, setStep] = useState<'enter-email' | 'enter-details' | 'enter-otp'>('enter-email')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [isNewUser, setIsNewUser] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleEmailSubmit = async () => {
    if (!email) return
    setError('')
    setLoading(true)
    const result = await sendOTP(email)
    if (result.success) {
      setSuccessMessage('OTP sent to your email!')
      setStep('enter-otp')
    } else {
      setError(result.error || 'Failed to send OTP')
    }
    setLoading(false)
  }

  const handleOTPVerify = async () => {
    if (!otp) return
    setError('')
    setLoading(true)
    const result = await verifyOTP(email, otp)
    if (result.success) {
      if (isNewUser && name && phone) {
        await saveProfile(name, phone)
      }
      setSuccessMessage('Welcome to Abhaya! 🙏')
      setTimeout(() => onAuthSuccess(), 1500)
    } else {
      setError(result.error || 'Invalid OTP')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-[#faf5f0] flex items-center justify-center p-4 overflow-hidden">
      {/* Floating particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-[#c9933a]"
            style={{ left: `${5 + i * 6.5}%`, bottom: `-5%` }}
            animate={{ y: [0, -1200], x: [0, i % 2 === 0 ? 15 : -15], opacity: [0, 0.6, 0.6, 0] }}
            transition={{ duration: 10 + (i % 5), repeat: Infinity, delay: i * 0.7, ease: 'linear' }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md z-10 relative"
      >
        {/* Mandala */}
        <motion.div
          className="w-32 h-32 mx-auto mb-8"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" stroke="#4a2c2a" strokeWidth="1">
            <circle cx="100" cy="100" r="95" />
            {Array.from({ length: 8 }).map((_, i) => {
              const rad = ((i * 360) / 8 * Math.PI) / 180
              return <circle key={i} cx={100 + 60 * Math.cos(rad)} cy={100 + 60 * Math.sin(rad)} r="15" opacity="0.6" />
            })}
            <circle cx="100" cy="100" r="50" opacity="0.4" />
            <circle cx="100" cy="100" r="30" opacity="0.6" />
            <circle cx="100" cy="100" r="10" fill="#4a2c2a" />
          </svg>
        </motion.div>

        <motion.h1
          className="text-4xl md:text-5xl font-playfair text-center mb-2 text-[#4a2c2a]"
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          Nirbhaya
        </motion.h1>
        <p className="text-center font-cinzel text-sm text-[#7a5c5a] mb-8">
          Abhaya — Be Fearless, Be Safe
        </p>

        <AnimatePresence mode="wait">

          {/* Step 1 - Email */}
          {step === 'enter-email' && (
            <motion.div key="email" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <p className="text-center text-[#7a5c5a] font-poppins text-sm mb-4">Enter your email to continue</p>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c9933a]"><Mail size={20} /></div>
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-[#e5d8cc] rounded-lg focus:border-[#c9933a] focus:outline-none text-[#4a2c2a] placeholder-[#7a5c5a]"
                />
              </div>

              {/* New user toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="newuser"
                  checked={isNewUser}
                  onChange={(e) => setIsNewUser(e.target.checked)}
                  className="accent-[#c9933a]"
                />
                <label htmlFor="newuser" className="text-[#7a5c5a] text-sm font-poppins">I am a new user</label>
              </div>

              {/* New user fields */}
              <AnimatePresence>
                {isNewUser && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c9933a]"><User size={20} /></div>
                      <input type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-[#e5d8cc] rounded-lg focus:border-[#c9933a] focus:outline-none text-[#4a2c2a] placeholder-[#7a5c5a]" />
                    </div>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c9933a]"><Phone size={20} /></div>
                      <input type="tel" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-[#e5d8cc] rounded-lg focus:border-[#c9933a] focus:outline-none text-[#4a2c2a] placeholder-[#7a5c5a]" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && <p className="text-[#b5836a] text-sm text-center">{error}</p>}
              {successMessage && <p className="text-[#c9933a] text-sm text-center">{successMessage}</p>}

              <motion.button onClick={handleEmailSubmit} disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full py-3 bg-gradient-to-r from-[#c9933a] to-[#b5836a] rounded-lg font-cinzel font-semibold text-[#0a0b1e] disabled:opacity-50">
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </motion.button>

              <motion.button type="button" onClick={() => { setTimeout(onAuthSuccess, 500) }}
                className="w-full text-[#c9933a] text-sm hover:text-[#b5836a] transition-colors">
                Continue as Guest
              </motion.button>
            </motion.div>
          )}

          {/* Step 2 - OTP */}
          {step === 'enter-otp' && (
            <motion.div key="otp" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <p className="text-center text-[#7a5c5a] font-poppins text-sm mb-4">
                OTP sent to <span className="text-[#c9933a] font-semibold">{email}</span>
              </p>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c9933a]"><KeyRound size={20} /></div>
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-[#e5d8cc] rounded-lg focus:border-[#c9933a] focus:outline-none text-[#4a2c2a] placeholder-[#7a5c5a] tracking-widest text-center text-lg"
                />
              </div>

              {error && <p className="text-[#b5836a] text-sm text-center">{error}</p>}
              {successMessage && <p className="text-[#c9933a] text-sm text-center">{successMessage}</p>}

              <motion.button onClick={handleOTPVerify} disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full py-3 bg-gradient-to-r from-[#c9933a] to-[#b5836a] rounded-lg font-cinzel font-semibold text-[#0a0b1e] disabled:opacity-50">
                {loading ? 'Verifying...' : 'Verify OTP'}
              </motion.button>

              <motion.button type="button" onClick={() => { setStep('enter-email'); setOtp(''); setError('') }}
                className="w-full text-[#7a5c5a] text-sm hover:text-[#c9933a] transition-colors">
                ← Change Email
              </motion.button>

              <motion.button type="button" onClick={handleEmailSubmit} disabled={loading}
                className="w-full text-[#c9933a] text-sm hover:text-[#b5836a] transition-colors">
                Resend OTP
              </motion.button>
            </motion.div>
          )}

        </AnimatePresence>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-[#e5d8cc]" />
          <span className="text-[#c9933a]">✦</span>
          <div className="flex-1 h-px bg-[#e5d8cc]" />
        </div>

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="w-full py-3 border border-[#c9933a] rounded-lg font-poppins font-medium text-[#4a2c2a] hover:bg-[#c9933a]/10 transition-colors">
          Continue with Google
        </motion.button>
      </motion.div>
    </main>
  )
}