"use client"

import { motion } from "framer-motion"

interface MandalaBackgroundProps {
  variant?: "home" | "track" | "safety"
  opacity?: number
}

function HomeMandalaSVG() {
  return (
    <svg viewBox="0 0 400 400" className="w-full h-full">
      {/* 16-point star pattern */}
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (360 / 16) * i
        return (
          <g key={i} transform={`rotate(${angle} 200 200)`}>
            <path
              d={`M 200 200 L 200 50 L 210 100 L 200 200`}
              fill="#4a2c2a"
              fillOpacity={0.15}
            />
            <path
              d={`M 200 200 L 190 100 L 200 50 L 200 200`}
              fill="#b5836a"
              fillOpacity={0.1}
            />
          </g>
        )
      })}
      
      {/* Concentric circles */}
      {[50, 80, 110, 140, 170].map((r, i) => (
        <circle
          key={i}
          cx={200}
          cy={200}
          r={r}
          fill="none"
          stroke="#4a2c2a"
          strokeWidth={1}
          strokeOpacity={0.2}
          strokeDasharray={i % 2 === 0 ? "none" : "4 4"}
        />
      ))}
      
      {/* Lotus petals at edge */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (360 / 12) * i
        return (
          <g key={`lotus-${i}`} transform={`rotate(${angle} 200 200)`}>
            <ellipse
              cx={200}
              cy={40}
              rx={15}
              ry={30}
              fill="#b5836a"
              fillOpacity={0.1}
            />
          </g>
        )
      })}
    </svg>
  )
}

function TrackMandalaSVG() {
  return (
    <svg viewBox="0 0 400 400" className="w-full h-full">
      {/* Diamond pattern */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (360 / 8) * i
        return (
          <g key={i} transform={`rotate(${angle} 200 200)`}>
            <polygon
              points="200,50 230,200 200,350 170,200"
              fill="none"
              stroke="#4a2c2a"
              strokeWidth={1}
              strokeOpacity={0.15}
            />
          </g>
        )
      })}
      
      {/* Inner geometric pattern */}
      {[60, 100, 140].map((r, i) => (
        <polygon
          key={i}
          points={Array.from({ length: 6 })
            .map((_, j) => {
              const angle = ((360 / 6) * j - 90) * (Math.PI / 180)
              return `${200 + r * Math.cos(angle)},${200 + r * Math.sin(angle)}`
            })
            .join(" ")}
          fill="none"
          stroke="#b5836a"
          strokeWidth={1}
          strokeOpacity={0.15}
        />
      ))}
      
      {/* Central eye motif */}
      <ellipse cx={200} cy={200} rx={30} ry={20} fill="#4a2c2a" fillOpacity={0.1} />
      <circle cx={200} cy={200} r={10} fill="#b5836a" fillOpacity={0.15} />
    </svg>
  )
}

function SafetyMandalaSVG() {
  return (
    <svg viewBox="0 0 400 400" className="w-full h-full">
      {/* Shield-inspired pattern */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (360 / 12) * i
        return (
          <g key={i} transform={`rotate(${angle} 200 200)`}>
            <path
              d={`M 200 200 Q 250 100 200 30 Q 150 100 200 200`}
              fill="#4a2c2a"
              fillOpacity={0.08}
            />
          </g>
        )
      })}
      
      {/* Triangular patterns */}
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (360 / 6) * i
        return (
          <g key={`tri-${i}`} transform={`rotate(${angle} 200 200)`}>
            <polygon
              points="200,80 220,150 180,150"
              fill="#b5836a"
              fillOpacity={0.1}
            />
          </g>
        )
      })}
      
      {/* Outer ring with dots */}
      <circle cx={200} cy={200} r={170} fill="none" stroke="#4a2c2a" strokeWidth={2} strokeOpacity={0.15} />
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = ((360 / 24) * i) * (Math.PI / 180)
        return (
          <circle
            key={`dot-${i}`}
            cx={200 + 170 * Math.cos(angle)}
            cy={200 + 170 * Math.sin(angle)}
            r={3}
            fill="#4a2c2a"
            fillOpacity={0.2}
          />
        )
      })}
    </svg>
  )
}

export function MandalaBackground({ variant = "home", opacity = 0.5 }: MandalaBackgroundProps) {
  const MandalaSVG = {
    home: HomeMandalaSVG,
    track: TrackMandalaSVG,
    safety: SafetyMandalaSVG,
  }[variant]

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      <motion.div
        className="w-[150vw] h-[150vw] max-w-[800px] max-h-[800px]"
        style={{ opacity }}
        animate={{ rotate: 360 }}
        transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
      >
        <MandalaSVG />
      </motion.div>
    </div>
  )
}
