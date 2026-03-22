"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

function MandalaRing({ 
  radius, 
  petals, 
  delay, 
  reverse = false,
  color = "#4a2c2a"
}: { 
  radius: number
  petals: number
  delay: number
  reverse?: boolean
  color?: string
}) {
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0, rotate: 0 }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        rotate: reverse ? -360 : 360 
      }}
      transition={{
        opacity: { duration: 0.5, delay },
        scale: { duration: 0.8, delay },
        rotate: { duration: 60, repeat: Infinity, ease: "linear", delay }
      }}
    >
      {Array.from({ length: petals }).map((_, i) => {
        const angle = (360 / petals) * i
        return (
          <g key={i} transform={`rotate(${angle})`}>
            {/* Lotus petal shape */}
            <path
              d={`M 0 ${-radius + 15} 
                  Q ${8} ${-radius - 5} 0 ${-radius - 20}
                  Q ${-8} ${-radius - 5} 0 ${-radius + 15}`}
              fill={color}
              fillOpacity={0.8}
            />
            {/* Small decorative circle */}
            <circle
              cx={0}
              cy={-radius}
              r={3}
              fill={color}
              fillOpacity={0.6}
            />
          </g>
        )
      })}
      {/* Ring circle */}
      <circle
        cx={0}
        cy={0}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={1}
        strokeOpacity={0.3}
      />
    </motion.g>
  )
}

function AnimatedMandala() {
  const rings = [
    { radius: 30, petals: 6, delay: 0, color: "#4a2c2a" },
    { radius: 50, petals: 8, delay: 0.15, color: "#b5836a", reverse: true },
    { radius: 70, petals: 10, delay: 0.3, color: "#4a2c2a" },
    { radius: 90, petals: 12, delay: 0.45, color: "#b5836a", reverse: true },
    { radius: 110, petals: 14, delay: 0.6, color: "#4a2c2a" },
    { radius: 130, petals: 16, delay: 0.75, color: "#b5836a", reverse: true },
    { radius: 150, petals: 18, delay: 0.9, color: "#4a2c2a" },
    { radius: 170, petals: 20, delay: 1.05, color: "#b5836a", reverse: true },
  ]

  return (
    <svg
      viewBox="-200 -200 400 400"
      className="w-72 h-72 md:w-80 md:h-80"
    >
      {/* Center lotus */}
      <motion.g
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <circle cx={0} cy={0} r={15} fill="#c9933a" />
        <circle cx={0} cy={0} r={8} fill="#b5836a" />
        <circle cx={0} cy={0} r={4} fill="#4a2c2a" />
      </motion.g>
      
      {/* Mandala rings */}
      {rings.map((ring, index) => (
        <MandalaRing
          key={index}
          radius={ring.radius}
          petals={ring.petals}
          delay={ring.delay}
          reverse={ring.reverse}
          color={ring.color}
        />
      ))}
      
      {/* Outer decorative ring */}
      <motion.circle
        cx={0}
        cy={0}
        r={185}
        fill="none"
        stroke="#c9933a"
        strokeWidth={2}
        strokeDasharray="5 5"
        initial={{ opacity: 0, pathLength: 0 }}
        animate={{ opacity: 0.5, pathLength: 1 }}
        transition={{ duration: 2, delay: 1.2 }}
      />
    </svg>
  )
}

export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [showText, setShowText] = useState(false)
  const [showTagline, setShowTagline] = useState(false)

  useEffect(() => {
    const textTimer = setTimeout(() => setShowText(true), 1500)
    const taglineTimer = setTimeout(() => setShowTagline(true), 2000)
    const completeTimer = setTimeout(() => onComplete(), 3500)

    return () => {
      clearTimeout(textTimer)
      clearTimeout(taglineTimer)
      clearTimeout(completeTimer)
    }
  }, [onComplete])

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#faf5f0]"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Floating warm particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-[#c9933a]"
            style={{
              left: `${Math.random() * 100}%`,
              bottom: `-5%`,
            }}
            animate={{
              y: [0, -window.innerHeight - 100],
              x: [0, Math.random() * 40 - 20],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 6 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Animated Mandala */}
      <AnimatedMandala />

      {/* App Name */}
      <AnimatePresence>
        {showText && (
          <motion.h1
            className="mt-8 text-4xl md:text-5xl font-serif text-[#4a2c2a]"
            style={{ fontFamily: 'var(--font-playfair)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Abhaya
          </motion.h1>
        )}
      </AnimatePresence>

      {/* Tagline */}
      <AnimatePresence>
        {showTagline && (
          <motion.p
            className="mt-4 text-lg text-[#4a2c2a]/80 tracking-wider"
            style={{ fontFamily: 'var(--font-cinzel)' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Your Shield. Your Journey.
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
