# Supabase Setup Guide

## Step 1: Environment Variables

1. Copy `env.example` to `.env.local`
2. Fill in your Supabase project credentials:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

## Step 2: Database Schema Setup

### Option A: Using Supabase Dashboard (Recommended for first setup)

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/schema.sql`
4. Run the SQL script

### Option B: Using Supabase CLI

1. Install Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Link your project: `supabase link --project-ref your-project-ref`
4. Push the schema: `supabase db push`

## Step 3: Authentication Setup

1. In Supabase Dashboard, go to Authentication > Settings
2. Configure your site URL (e.g., `http://localhost:3000` for development)
3. Set up email templates (optional but recommended)

## Step 4: Row Level Security (RLS)

The schema.sql file includes all necessary RLS policies. Verify they're working:

1. Go to Authentication > Policies in Supabase Dashboard
2. Ensure all tables have RLS enabled
3. Verify policies are in place for each table

## Step 5: Test the Setup

1. Start your development server: `pnpm dev`
2. Try to sign up a new user
3. Verify the user record is created in the `users` table
4. Test the join code flow

## Database Schema Overview

### Tables Created:

1. **wineries** - Stores winery information with auto-generated join codes
2. **users** - Extends Supabase auth.users with winery association
3. **winery_bop_sequences** - **CRITICAL**: Manages per-winery BOP number sequences
4. **batches** - Stores all wine batch data with automated BOP numbers and date calculations
5. **support_messages** - Stores support requests

### ✅ Key Features Implemented:

- **✅ Automated BOP Numbers**: Per-winery sequences (1, 2, 3...) assigned automatically via triggers
- **✅ Automated Date Calculations**: Rack, filter, and bottle dates calculated automatically with Sunday rule
- **✅ Auto-Generated Join Codes**: Secure 6-character codes generated on winery creation
- **✅ Row Level Security**: Users can only see data from their winery
- **✅ Timezone Support**: Default America/Halifax, expandable per winery
- **✅ Sunday Rule Handling**: Bottle dates automatically slide to Monday
- **✅ Automatic User Creation**: Trigger creates user record on signup
- **✅ Overdue Computation**: Calculated on-the-fly, no midnight jobs needed

### Critical Implementation Details:

#### Automated Batch Creation
```sql
-- When you insert a batch, the trigger automatically:
INSERT INTO batches (winery_id, customer, wine_kit, kit_weeks, date_of_sale, put_up_date)
VALUES ('winery-uuid', 'Customer Name', 'Cabernet Sauvignon', 6, '2024-01-01', '2024-01-15');

-- The trigger calc_batch_dates() automatically sets:
-- bop_number = get_next_bop_number(winery_id)  -- 1, 2, 3, etc.
-- rack_date = put_up_date + 14 days
-- filter_date = rack_date + (kit_weeks - 2) weeks
-- bottle_date = calculate_bottle_date(filter_date)  -- Handles Sunday rule
```

#### Per-Winery BOP Numbers
```sql
-- BOP numbers are unique per winery, not global
UNIQUE(winery_id, bop_number)

-- Automatically assigned via trigger:
-- Winery A: #1, #2, #3, #4...
-- Winery B: #1, #2, #3, #4...  (separate sequence!)
```

#### Sunday Rule
```sql
-- If bottle date lands on Sunday, automatically slides to Monday
SELECT calculate_bottle_date('2024-12-15'::DATE);
-- If Dec 16 is Sunday, returns Dec 17 (Monday)
```

#### Auto-Generated Join Codes
```sql
-- Wineries get secure join codes automatically on creation
INSERT INTO wineries (name) VALUES ('New Winery');
-- join_code automatically set to something like 'A7B2K9'
```

### Indexes for Performance:

- Users by winery_id
- Batches by winery_id, dates, and BOP number
- Support messages by winery_id and status
- BOP sequences by winery_id

## Next Steps

After completing this setup:

1. Implement authentication flow in the login page
2. Create the join winery flow for new users
3. Connect the batch creation form to use `createBatch()` (simplified!)
4. Implement the task generation system with `getBatchesForDate()`

## Rate Limiting Considerations

For production, implement rate limiting on join code attempts:
- 5 attempts per IP per hour
- Use Supabase Edge Functions or Next.js API routes
- Store attempt counts in Redis or database

## Testing the Automated System

```sql
-- Create a test winery (join code auto-generated)
INSERT INTO wineries (name) VALUES ('Test Winery');

-- Get the winery ID and join code
SELECT id, name, join_code FROM wineries WHERE name = 'Test Winery';

-- Create a test batch (everything auto-calculated)
INSERT INTO batches (winery_id, customer, wine_kit, kit_weeks, date_of_sale, put_up_date)
VALUES ('your-winery-uuid', 'Test Customer', 'Cabernet Sauvignon', 6, '2024-01-01', '2024-01-15');

-- Check the results - should have:
-- bop_number: 1 (first batch for this winery)
-- rack_date: 2024-01-29 (put_up + 14 days)
-- filter_date: 2024-02-26 (rack + 4 weeks for 6-week kit)
-- bottle_date: 2024-02-27 (filter + 1 day, or Monday if Sunday)
SELECT * FROM batches WHERE customer = 'Test Customer';
```

## Simplified Usage

With the new trigger system, creating batches is much simpler:

```typescript
// Old way (manual):
const dates = calculateBatchDates(formData)
const bopNumber = await getNextBopNumber(wineryId)
await createBatchWithBopNumber({ ...formData, ...dates, bop_number: bopNumber })

// New way (automatic):
await createBatch({
  winery_id: wineryId,
  customer: formData.customer,
  wine_kit: formData.wineKit,
  kit_weeks: formData.kitWeeks,
  date_of_sale: formData.dateOfSale,
  put_up_date: formData.putUpDate
})
// BOP number and all dates calculated automatically!
```

## Troubleshooting

### Common Issues:

1. **RLS blocking queries**: Check that policies are correctly set up
2. **User not created**: Verify the trigger is working
3. **BOP numbers not incrementing**: Check winery_bop_sequences table
4. **Dates not calculating**: Verify the calc_batch_dates trigger is active
5. **Join codes not generating**: Check the generate_join_code() function

### Testing Queries:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check RLS policies
SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- Check triggers
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- Test join code generation
SELECT generate_join_code();

-- Check BOP sequences
SELECT * FROM winery_bop_sequences;

-- Test date calculation
SELECT calculate_bottle_date('2024-12-15'::DATE);
``` 