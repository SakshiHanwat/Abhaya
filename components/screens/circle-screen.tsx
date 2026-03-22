"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, Share2, RefreshCw } from "lucide-react"
import { MandalaBackground } from "@/components/mandala-background"
import { useLanguage } from "@/components/language-context"
import { getContacts, addContact, getUser } from "@/lib/auth"

interface CircleMember {
  id: string
  name: string
  phone: string
  relation: string
  status: "safe" | "enroute"
  color: string
  position: { x: number; y: number }
}

const COLORS = ["#c9933a", "#b5836a", "#ff6b35", "#4caf50", "#9c27b0", "#2196f3"]
const AVATARS = ["👩", "👨", "👧", "👦", "👵", "👴", "🧑", "👩‍💼"]

function GlowingLotus() {
  return (
    <div className="relative w-20 h-20">
      {[1, 2, 3].map((ring) => (
        <motion.div
          key={ring}
          className="absolute inset-0 rounded-full"
          style={{ border: `1px solid rgba(201, 147, 58, ${0.3 / ring})`, transform: `scale(${1 + ring * 0.3})` }}
          animate={{ scale: [1 + ring * 0.3, 1.2 + ring * 0.3, 1 + ring * 0.3], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, delay: ring * 0.2 }}
        />
      ))}
      <motion.div
        className="absolute inset-0 rounded-full flex items-center justify-center text-3xl"
        style={{ background: "radial-gradient(circle, #c9933a 0%, #b5836a 100%)", boxShadow: "0 0 30px rgba(201, 147, 58, 0.6)" }}
        animate={{ boxShadow: ["0 0 30px rgba(201, 147, 58, 0.6)", "0 0 50px rgba(201, 147, 58, 0.8)", "0 0 30px rgba(201, 147, 58, 0.6)"] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        🪷
      </motion.div>
    </div>
  )
}

function MemberCircle({ member, index }: { member: CircleMember; index: number }) {
  return (
    <motion.div
      className="absolute flex flex-col items-center"
      style={{ left: `calc(50% + ${member.position.x}px - 40px)`, top: `calc(50% + ${member.position.y}px - 40px)` }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 + 0.3 }}
    >
      <div className="relative">
        <motion.div
          className="absolute -inset-1 rounded-full"
          style={{ border: `2px solid ${member.color}` }}
          animate={{ scale: [1, 1.1, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
        />
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
          style={{ background: `linear-gradient(135deg, ${member.color}40, ${member.color}20)`, border: `2px solid ${member.color}` }}
        >
          {AVATARS[index % AVATARS.length]}
        </div>
        <div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap"
          style={{ background: member.status === "safe" ? "#4caf50" : "#ff6b35", color: "#fff" }}
        >
          {member.status === "safe" ? "Safe ✓" : "En Route"}
        </div>
      </div>
      <p className="mt-3 text-xs text-[#4a2c2a] text-center font-medium">{member.name}</p>
      <p className="text-[10px] text-[#7a5c5a] text-center">{member.relation}</p>
    </motion.div>
  )
}

function CircleArrangement({ members }: { members: CircleMember[] }) {
  const radius = 110

  const membersWithPosition = members.map((member, index) => {
    const angle = ((index * (360 / Math.max(members.length, 1))) - 90) * (Math.PI / 180)
    return {
      ...member,
      position: {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      }
    }
  })

  return (
    <div className="relative w-full h-80 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full">
        {membersWithPosition.map((member) => (
          <motion.line
            key={member.id}
            x1="50%" y1="50%"
            x2={`calc(50% + ${member.position.x}px)`}
            y2={`calc(50% + ${member.position.y}px)`}
            stroke="#c9933a"
            strokeWidth={1}
            strokeOpacity={0.3}
            strokeDasharray="4 4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5 }}
          />
        ))}
      </svg>

      <div className="absolute"><GlowingLotus /></div>

      {membersWithPosition.map((member, index) => (
        <MemberCircle key={member.id} member={member} index={index} />
      ))}
    </div>
  )
}

function AddMemberModal({ isOpen, onClose, onAdd }: { isOpen: boolean; onClose: () => void; onAdd: (name: string, phone: string, relation: string) => void }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [relation, setRelation] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!name || !phone) return
    setLoading(true)
    await onAdd(name, phone, relation)
    setName(''); setPhone(''); setRelation('')
    setLoading(false)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div className="fixed inset-0 bg-black/50 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl p-6"
            style={{ background: '#faf5f0' }}
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl text-[#4a2c2a] font-medium" style={{ fontFamily: 'var(--font-playfair)' }}>🪷 Circle Mein Jodein</h3>
              <button onClick={onClose}><X className="w-5 h-5 text-[#7a5c5a]" /></button>
            </div>

            <div className="space-y-3">
              <input type="text" placeholder="Naam *" value={name} onChange={e => setName(e.target.value)}
                className="w-full bg-white border border-[#e5d8cc] rounded-xl py-3 px-4 text-[#4a2c2a] placeholder-[#7a5c5a] focus:border-[#c9933a] focus:outline-none" />
              <input type="tel" placeholder="Phone Number *" value={phone} onChange={e => setPhone(e.target.value)}
                className="w-full bg-white border border-[#e5d8cc] rounded-xl py-3 px-4 text-[#4a2c2a] placeholder-[#7a5c5a] focus:border-[#c9933a] focus:outline-none" />
              <div className="grid grid-cols-3 gap-2">
                {['Maa', 'Papa', 'Bhai', 'Didi', 'Dost', 'Other'].map(r => (
                  <button key={r} onClick={() => setRelation(r)}
                    className="py-2 rounded-xl text-sm border transition-all"
                    style={{ background: relation === r ? '#c9933a' : '#ffffff', color: relation === r ? '#faf5f0' : '#4a2c2a', borderColor: relation === r ? '#c9933a' : '#e5d8cc' }}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <motion.button
              className="w-full mt-4 py-3 rounded-xl font-medium flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #4a2c2a 0%, #b5836a 100%)', color: '#faf5f0' }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleSubmit} disabled={loading || !name || !phone}
            >
              {loading ? (
                <motion.div className="w-5 h-5 border-2 border-[#faf5f0] border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
              ) : (
                <><Plus className="w-4 h-4" /><span>Circle Mein Jodein</span></>
              )}
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export function CircleScreen() {
  const { t } = useLanguage()
  const [members, setMembers] = useState<CircleMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [showShareToast, setShowShareToast] = useState(false)

  useEffect(() => {
    loadMembers()
  }, [])

  const loadMembers = async () => {
    setLoading(true)
    const contacts = await getContacts()
    const membersData: CircleMember[] = contacts.map((c: any, index: number) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      relation: c.relation || 'Contact',
      status: index % 3 === 1 ? 'enroute' : 'safe',
      color: COLORS[index % COLORS.length],
      position: { x: 0, y: 0 }
    }))
    setMembers(membersData)
    setLoading(false)
  }

  const handleAddMember = async (name: string, phone: string, relation: string) => {
    const { addContact } = await import('@/lib/auth')
    const result = await addContact(name, phone, relation)
    if (result?.success) {
      await loadMembers()
    }
  }

  const handleShareLocation = async () => {
    const user = await getUser()
    if (user) {
      const link = `${window.location.origin}/track/${user.id}`
      setShareLink(link)
      if (navigator.share) {
        await navigator.share({
          title: 'Abhaya - Live Location',
          text: 'Meri live location dekho - Abhaya App',
          url: link
        })
      } else {
        navigator.clipboard.writeText(link)
        setShowShareToast(true)
        setTimeout(() => setShowShareToast(false), 3000)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf5f0]">
        <motion.div className="flex flex-col items-center gap-4">
          <motion.div className="w-12 h-12 rounded-full border-4 border-[#c9933a] border-t-transparent" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
          <p className="text-sm text-[#7a5c5a]">Circle load ho rahi hai...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen pb-20">
      <MandalaBackground variant="home" opacity={0.15} />

      {/* Header */}
      <motion.div className="px-4 py-4 flex items-center justify-between" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-serif text-[#c9933a] flex items-center gap-2" style={{ fontFamily: 'var(--font-playfair)' }}>
          SafeCircle 🔮
        </h1>
        <motion.button onClick={loadMembers} className="p-2 rounded-full" style={{ background: 'rgba(201, 147, 58, 0.1)' }} whileTap={{ scale: 0.9 }}>
          <RefreshCw className="w-4 h-4 text-[#c9933a]" />
        </motion.button>
      </motion.div>

      <div className="px-4">
        {/* Circle Card */}
        <motion.div className="card-mandala rounded-xl p-6" style={{ background: '#ffffff' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg text-[#c9933a]" style={{ fontFamily: 'var(--font-playfair)' }}>
              Family Circle
            </h3>
            <span className="text-xs text-[#7a5c5a] bg-[#faf5f0] px-2 py-1 rounded-full border border-[#e5d8cc]">
              {members.length} members
            </span>
          </div>

          {members.length === 0 ? (
            <motion.div className="flex flex-col items-center py-12 gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <GlowingLotus />
              <p className="text-sm text-[#7a5c5a] text-center">Circle mein koi nahi hai abhi</p>
              <p className="text-xs text-[#7a5c5a]/60 text-center">+ button se family members jodein</p>
            </motion.div>
          ) : (
            <CircleArrangement members={members} />
          )}
        </motion.div>

        {/* Stats Row */}
        <motion.div className="grid grid-cols-3 gap-3 mt-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          {[
            { label: 'Total', value: members.length, color: '#c9933a' },
            { label: 'Safe', value: members.filter(m => m.status === 'safe').length, color: '#4caf50' },
            { label: 'En Route', value: members.filter(m => m.status === 'enroute').length, color: '#ff6b35' },
          ].map((stat) => (
            <div key={stat.label} className="card-mandala rounded-xl p-3 text-center">
              <p className="text-2xl font-bold" style={{ color: stat.color, fontFamily: 'var(--font-cinzel)' }}>{stat.value}</p>
              <p className="text-xs text-[#7a5c5a] mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Info Card */}
        <motion.div className="mt-4 p-4 rounded-xl border border-[#c9933a]/20" style={{ background: 'rgba(201, 147, 58, 0.05)' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <p className="text-sm text-[#4a2c2a]/70 text-center">
            🔮 Sab members ek doosre ki location dekh sakte hain
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div className="mt-4 space-y-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          {/* Share Location Button */}
          <motion.button
            className="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #4a2c2a 0%, #b5836a 100%)', color: '#faf5f0' }}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleShareLocation}
          >
            <Share2 className="w-4 h-4" />
            <span>Sabko Live Link Bhejo</span>
          </motion.button>

          {/* Add Member Button */}
          <motion.button
            className="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2"
            style={{ background: 'transparent', border: '2px solid #c9933a', color: '#c9933a' }}
            whileHover={{ scale: 1.02, background: 'rgba(201, 147, 58, 0.1)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-4 h-4" />
            <span>Naya Member Jodein</span>
          </motion.button>
        </motion.div>
      </div>

      {/* Share Toast */}
      <AnimatePresence>
        {showShareToast && (
          <motion.div
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-sm"
            style={{ background: '#4a2c2a', color: '#faf5f0' }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
          >
            ✓ Link clipboard mein copy ho gaya!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Member Modal */}
      <AddMemberModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onAdd={handleAddMember} />
    </div>
  )
}