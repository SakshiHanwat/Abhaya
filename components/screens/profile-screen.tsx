'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Phone, Mail, Plus, Trash2, LogOut, Shield, Bell, Globe } from 'lucide-react'
import { MandalaBackground } from '@/components/mandala-background'
import { useLanguage } from '@/components/language-context'
import { getUser, getContacts, addContact, signOut, saveProfile } from '@/lib/auth'

interface Contact {
  id: string
  name: string
  phone: string
  relation: string
}

interface ProfileScreenProps {
  onLogout?: () => void
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="relative flex items-center justify-center">
      {/* Mandala ring */}
      {[1, 2].map((ring) => (
        <motion.div
          key={ring}
          className="absolute rounded-full border border-[#c9933a]/40"
          style={{ width: 90 + ring * 20, height: 90 + ring * 20 }}
          animate={{ rotate: ring % 2 === 0 ? 360 : -360 }}
          transition={{ duration: 20 * ring, repeat: Infinity, ease: 'linear' }}
        />
      ))}
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold z-10"
        style={{
          background: 'linear-gradient(135deg, #4a2c2a 0%, #b5836a 100%)',
          color: '#faf5f0',
          fontFamily: 'var(--font-playfair)',
          boxShadow: '0 4px 20px rgba(74, 44, 42, 0.3)',
        }}
      >
        {initials || '🪷'}
      </div>
    </div>
  )
}

function AddContactModal({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean
  onClose: () => void
  onAdd: (name: string, phone: string, relation: string) => void
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [relation, setRelation] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!name || !phone) return
    setLoading(true)
    await onAdd(name, phone, relation)
    setName('')
    setPhone('')
    setRelation('')
    setLoading(false)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl p-6"
            style={{ background: '#faf5f0' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
          >
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full bg-[#c9933a]/40" />
            </div>

            <h3
              className="text-xl text-[#4a2c2a] font-medium mb-6"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              🪷 Rakshak Jodein
            </h3>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Naam *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-[#e5d8cc] rounded-xl py-3 px-4 text-[#4a2c2a] placeholder-[#7a5c5a] focus:border-[#c9933a] focus:outline-none"
              />
              <input
                type="tel"
                placeholder="Phone Number *"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white border border-[#e5d8cc] rounded-xl py-3 px-4 text-[#4a2c2a] placeholder-[#7a5c5a] focus:border-[#c9933a] focus:outline-none"
              />
              <input
                type="text"
                placeholder="Relation (Maa, Papa, Dost...)"
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                className="w-full bg-white border border-[#e5d8cc] rounded-xl py-3 px-4 text-[#4a2c2a] placeholder-[#7a5c5a] focus:border-[#c9933a] focus:outline-none"
              />
            </div>

            <motion.button
              className="w-full mt-4 py-3 rounded-xl font-medium flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #4a2c2a 0%, #b5836a 100%)', color: '#faf5f0' }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={loading || !name || !phone}
            >
              {loading ? (
                <motion.div
                  className="w-5 h-5 border-2 border-[#faf5f0] border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Rakshak Jodein</span>
                </>
              )}
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export function ProfileScreen({ onLogout }: ProfileScreenProps) {
  const { t } = useLanguage()
  const [user, setUser] = useState<any>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddContact, setShowAddContact] = useState(false)
  const [profileName, setProfileName] = useState('')
  const [profilePhone, setProfilePhone] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const currentUser = await getUser()
    if (currentUser) {
      setUser(currentUser)
      setProfileName(currentUser.user_metadata?.name || '')
      setProfilePhone(currentUser.user_metadata?.phone || '')
    }
    const userContacts = await getContacts()
    setContacts(userContacts)
    setLoading(false)
  }

  const handleAddContact = async (name: string, phone: string, relation: string) => {
    const result = await addContact(name, phone, relation)
    if (result?.success) {
      const updated = await getContacts()
      setContacts(updated)
    }
  }

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    await saveProfile(profileName, profilePhone)
    setSavingProfile(false)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2000)
  }

  const handleLogout = async () => {
    await signOut()
    if (onLogout) onLogout()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf5f0]">
        <motion.div
          className="w-12 h-12 rounded-full border-4 border-[#c9933a] border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen pb-24">
      <MandalaBackground />

      {/* Header */}
      <motion.div
        className="px-4 py-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1
          className="text-2xl font-serif text-[#c9933a] text-center"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          Mera Profile
        </h1>
        <p className="text-xs text-[#4a2c2a]/50 text-center mt-1">(My Profile)</p>
      </motion.div>

      {/* Avatar + User Info */}
      <motion.div
        className="flex flex-col items-center py-6 px-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Avatar name={profileName || user?.email || 'User'} />

        <div className="mt-4 text-center">
          <p
            className="text-xl text-[#4a2c2a] font-medium"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            {profileName || 'Abhaya User'}
          </p>
          <p className="text-sm text-[#7a5c5a] mt-1">{user?.email}</p>
        </div>
      </motion.div>

      {/* Edit Profile Card */}
      <motion.div
        className="mx-4 mb-4 card-mandala rounded-xl p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3
          className="text-base font-serif text-[#c9933a] mb-3 flex items-center gap-2"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          <User className="w-4 h-4" />
          Profile Update Karo
        </h3>

        <div className="space-y-3">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c9933a]" />
            <input
              type="text"
              placeholder="Aapka naam"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="w-full bg-[#faf5f0] border border-[#e5d8cc] rounded-xl py-2.5 pl-10 pr-4 text-[#4a2c2a] placeholder-[#7a5c5a] focus:border-[#c9933a] focus:outline-none text-sm"
            />
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c9933a]" />
            <input
              type="tel"
              placeholder="Phone number"
              value={profilePhone}
              onChange={(e) => setProfilePhone(e.target.value)}
              className="w-full bg-[#faf5f0] border border-[#e5d8cc] rounded-xl py-2.5 pl-10 pr-4 text-[#4a2c2a] placeholder-[#7a5c5a] focus:border-[#c9933a] focus:outline-none text-sm"
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a5c5a]" />
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full bg-[#f0ebe3] border border-[#e5d8cc] rounded-xl py-2.5 pl-10 pr-4 text-[#7a5c5a] text-sm cursor-not-allowed"
            />
          </div>
        </div>

        <motion.button
          className="w-full mt-3 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2"
          style={{
            background: profileSaved
              ? 'linear-gradient(135deg, #4caf50, #2e7d32)'
              : 'linear-gradient(135deg, #4a2c2a 0%, #b5836a 100%)',
            color: '#faf5f0',
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSaveProfile}
          disabled={savingProfile}
        >
          {savingProfile ? (
            <motion.div className="w-4 h-4 border-2 border-[#faf5f0] border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
          ) : profileSaved ? (
            <span>✓ Save ho gaya!</span>
          ) : (
            <span>Profile Save Karo</span>
          )}
        </motion.button>
      </motion.div>

      {/* Trusted Contacts */}
      <motion.div
        className="mx-4 mb-4 card-mandala rounded-xl p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3
            className="text-base font-serif text-[#c9933a] flex items-center gap-2"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            <Shield className="w-4 h-4" />
            Rakshak Gana ({contacts.length})
          </h3>
          <motion.button
            className="p-2 rounded-full"
            style={{ background: 'rgba(201, 147, 58, 0.15)', color: '#c9933a' }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddContact(true)}
          >
            <Plus className="w-4 h-4" />
          </motion.button>
        </div>

        {contacts.length === 0 ? (
          <motion.div
            className="text-center py-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-sm text-[#7a5c5a]">Koi rakshak nahi hai abhi</p>
            <p className="text-xs text-[#7a5c5a]/60 mt-1">+ button se jodein</p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {contacts.map((contact, index) => (
              <motion.div
                key={contact.id}
                className="flex items-center gap-3 p-3 bg-[#faf5f0] rounded-xl border border-[#e5d8cc]"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #c9933a, #b5836a)', color: '#faf5f0' }}
                >
                  {contact.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#4a2c2a]">{contact.name}</p>
                  <p className="text-xs text-[#7a5c5a]">{contact.phone} • {contact.relation}</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-[#4caf50]" title="Active" />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Settings Card */}
      <motion.div
        className="mx-4 mb-4 card-mandala rounded-xl p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3
          className="text-base font-serif text-[#c9933a] mb-3"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          ⚙️ Settings
        </h3>

        {[
          { icon: Bell, label: 'Notifications', sub: 'SOS aur safety alerts' },
          { icon: Shield, label: 'Privacy', sub: 'Location sharing settings' },
          { icon: Globe, label: 'Language', sub: '8 Indian languages' },
        ].map((item, index) => (
          <motion.button
            key={item.label}
            className="w-full flex items-center gap-3 p-3 rounded-xl mb-2 text-left"
            style={{ background: '#faf5f0', border: '1px solid #e5d8cc' }}
            whileHover={{ scale: 1.01, borderColor: '#c9933a' }}
            whileTap={{ scale: 0.99 }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
          >
            <item.icon className="w-4 h-4 text-[#c9933a]" />
            <div>
              <p className="text-sm font-medium text-[#4a2c2a]">{item.label}</p>
              <p className="text-xs text-[#7a5c5a]">{item.sub}</p>
            </div>
          </motion.button>
        ))}
      </motion.div>

      {/* Logout Button */}
      <motion.div
        className="mx-4 mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <motion.button
          className="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2"
          style={{
            background: 'rgba(181, 131, 106, 0.15)',
            border: '1px solid rgba(181, 131, 106, 0.4)',
            color: '#b5836a',
          }}
          whileHover={{ scale: 1.02, background: 'rgba(181, 131, 106, 0.25)' }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </motion.button>
      </motion.div>

      {/* Add Contact Modal */}
      <AddContactModal
        isOpen={showAddContact}
        onClose={() => setShowAddContact(false)}
        onAdd={handleAddContact}
      />
    </div>
  )
}