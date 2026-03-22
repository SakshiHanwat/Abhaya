import { supabase } from './supabase'

// Send OTP to email
export async function sendOTP(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true
    }
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

// Verify OTP
export async function verifyOTP(email: string, otp: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: otp,
    type: 'email'
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, user: data.user }
}

// Save profile
export async function saveProfile(name: string, phone: string) {
  const user = await getUser()

  if (!user) {
    return { success: false, error: 'User not logged in' }
  }

  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    name,
    phone
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

// Get current user
export async function getUser() {
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error) {
    return null
  }

  return user
}

// Get contacts
export async function getContacts() {
  const user = await getUser()

  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', user.id)

  if (error) {
    return []
  }

  return data || []
}

// Add contact
export async function addContact(
  name: string,
  phone: string,
  relation: string
) {
  const user = await getUser()

  if (!user) {
    return { success: false, error: 'User not logged in' }
  }

  const { error } = await supabase.from('contacts').insert({
    user_id: user.id,
    name,
    phone,
    relation
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

// Save SOS + Send SMS to contacts
export async function saveSOS(lat: number, lng: number) {
  const user = await getUser()

  if (!user) {
    return { success: false, error: 'User not logged in' }
  }

  const { error: sosError } = await supabase.from('sos_alerts').insert({
    user_id: user.id,
    latitude: lat,
    longitude: lng,
    message: 'EMERGENCY! I need help!'
  })

  if (sosError) {
    return { success: false, error: sosError.message }
  }

  const contacts = await getContacts()
  const phones = contacts.map((c: any) => c.phone).filter(Boolean)

  if (phones.length > 0) {
    const locationLink =
      lat !== 0 && lng !== 0
        ? `https://maps.google.com/?q=${lat},${lng}`
        : 'Location unavailable'

    try {
      const response = await fetch('/api/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phones,
          message: `EMERGENCY ALERT! Madad chahiye! Location: ${locationLink} - Abhaya App`
        })
      })

      if (!response.ok) {
        return { success: false, error: 'SOS saved but SMS failed to send' }
      }
    } catch (err) {
      return { success: false, error: 'SOS saved but SMS request failed' }
    }
  }

  return { success: true }
}

// Update live location
export async function updateLocation(
  lat: number,
  lng: number,
  isTracking: boolean
) {
  const user = await getUser()

  if (!user) {
    return { success: false, error: 'User not logged in' }
  }

  const { error } = await supabase.from('locations').upsert({
    user_id: user.id,
    latitude: lat,
    longitude: lng,
    is_tracking: isTracking,
    updated_at: new Date().toISOString()
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

// Save incident report
export async function saveIncident(
  type: string,
  lat: number,
  lng: number,
  description: string = ''
) {
  const user = await getUser()

  if (!user) {
    return { success: false, error: 'User not logged in' }
  }

  const { error } = await supabase.from('incidents').insert({
    user_id: user.id,
    type,
    latitude: lat,
    longitude: lng,
    description
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

// Get safe spots
export async function getSafeSpots() {
  const { data, error } = await supabase.from('safe_spots').select('*')

  if (error) {
    return []
  }

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

  if (!user) {
    return { success: false, error: 'User not logged in' }
  }

  const { error } = await supabase.from('safe_spots').insert({
    name,
    type,
    latitude: lat,
    longitude: lng,
    added_by: user.id
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}