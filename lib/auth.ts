import { supabase } from './supabase'

// Send OTP to email
export async function sendOTP(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: undefined,
    }
  })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

// Verify OTP
export async function verifyOTP(email: string, otp: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: otp,
    type: 'email'
  })
  if (error) return { success: false, error: error.message }
  return { success: true, user: data.user }
}

// Save profile
export async function saveProfile(name: string, phone: string) {
  const user = await getUser()
  if (!user) return { success: false }
  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    name,
    phone
  })
  return { success: !error }
}

// Sign out
export async function signOut() {
  await supabase.auth.signOut()
}

// Get current user
export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Get contacts
export async function getContacts() {
  const user = await getUser()
  if (!user) return []
  const { data } = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', user.id)
  return data || []
}

// Add contact
export async function addContact(
  name: string,
  phone: string,
  relation: string
) {
  const user = await getUser()
  if (!user) return { success: false }
  const { error } = await supabase.from('contacts').insert({
    user_id: user.id,
    name,
    phone,
    relation
  })
  return { success: !error }
}

// Save SOS + Send SMS to contacts
export async function saveSOS(lat: number, lng: number) {
  const user = await getUser()

  if (user) {
    // Database mein save karo
    await supabase.from('sos_alerts').insert({
      user_id: user.id,
      latitude: lat,
      longitude: lng,
      message: 'EMERGENCY! I need help!'
    })

    // Contacts fetch karo
    const contacts = await getContacts()
    const phones = contacts
      .map((c: any) => c.phone)
      .filter(Boolean)

    if (phones.length > 0) {
      const locationLink = lat !== 0
        ? `maps.google.com/?q=${lat},${lng}`
        : 'Location unavailable'

      // SMS bhejo
      await fetch('/api/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phones,
          message: `EMERGENCY ALERT! Madad chahiye! Location: ${locationLink} - Abhaya App`
        })
      })
    }
  }
}

// Update live location
export async function updateLocation(
  lat: number,
  lng: number,
  isTracking: boolean
) {
  const user = await getUser()
  if (!user) return
  await supabase.from('locations').upsert({
    user_id: user.id,
    latitude: lat,
    longitude: lng,
    is_tracking: isTracking,
    updated_at: new Date().toISOString()
  })
}

// Save incident report
export async function saveIncident(
  type: string,
  lat: number,
  lng: number,
  description: string = ''
) {
  const user = await getUser()
  if (!user) return { success: false }
  const { error } = await supabase.from('incidents').insert({
    user_id: user.id,
    type,
    latitude: lat,
    longitude: lng,
    description
  })
  return { success: !error }
}

// Get safe spots
export async function getSafeSpots() {
  const { data } = await supabase.from('safe_spots').select('*')
  return data || []
}

// Add safe spot
export async function addSafeSpot(
  name: string,
  type: string,
  lat: number,
  lng: number
) {
  const user = await getUser()
  if (!user) return { success: false }
  const { error } = await supabase.from('safe_spots').insert({
    name,
    type,
    latitude: lat,
    longitude: lng,
    added_by: user.id
  })
  return { success: !error }
}