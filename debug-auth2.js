import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !anonKey) {
  console.error('Missing env variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, anonKey)

const email = 'testuser@example.com'
const password = 'TestPassword123!'

console.log('Signing up user...')
const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password })
console.log('signUp error:', signUpError?.message)
console.log('signUp data:', signUpData)

console.log('Signing in user...')
const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
console.log('signIn error:', signInError?.message)
console.log('signIn data:', signInData)

