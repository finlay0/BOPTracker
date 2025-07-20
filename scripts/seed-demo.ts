/**
 * BOP Tracker – Demo Seeder (Admin API way)
 * -----------------------------------------
 * Usage:
 *   1. Ensure you have a local env file (e.g. .env.local) with:
 *        NEXT_PUBLIC_SUPABASE_URL=<your-project-url>
 *        SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
 *   2. pnpm add -D ts-node @types/node (if not already)
 *   3. Run:  npx ts-node scripts/seed-demo.ts
 *
 * This script will:
 *   • create a winery
 *   • create an Auth user (email already confirmed)
 *   • link the user as owner of the winery
 *   • insert one sample batch and a support message
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing env vars: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  }

  const admin = createClient(supabaseUrl, serviceKey)

  // ▼ CONFIGURABLE SEED DATA
  const ownerEmail = 'owner@demo.com'
  const ownerPassword = 'Password123!'
  const wineryName = 'Demo Winery'
  const timezone = 'America/Halifax'

  // 1) create winery --------------------------------------------------
  const { data: winery, error: newWineryErr } = await admin
    .from('wineries')
    .insert({ name: wineryName, timezone })
    .select('id')
    .single()
  if (newWineryErr) throw newWineryErr

  // 2) create auth user ----------------------------------------------
  const { data: newUserData, error: userErr } = await admin.auth.admin.createUser({
    email: ownerEmail,
    password: ownerPassword,
    email_confirm: true
  })
  if (userErr) throw userErr
  const userId = newUserData.user?.id as string

  // 3) link user as owner --------------------------------------------
  const { error: linkErr } = await admin
    .from('users')
    .update({ winery_id: winery.id, role: 'owner' })
    .eq('id', userId)
  if (linkErr) throw linkErr

  // 4) sample batch ---------------------------------------------------
  await admin.from('batches').insert({
    winery_id: winery.id,
    customer: 'Sample Customer',
    wine_kit: 'Merlot 6-Week Kit',
    kit_weeks: 6,
    date_of_sale: new Date().toISOString().slice(0, 10),
    put_up_date : new Date().toISOString().slice(0, 10)
  })

  // 5) sample support message ----------------------------------------
  await admin.from('support_messages').insert({
    winery_id: winery.id,
    user_id: userId,
    subject: 'Getting started',
    message: 'Just setting things up – looks great so far!'
  })

  console.log('\n✅  Demo data seeded!')
  console.log('   Login with:', ownerEmail, '/', ownerPassword)
}

main().catch((err) => {
  console.error('Seeder failed:', err)
  process.exit(1)
}) 