✅ BOP Tracker MVP Feature Checklist
Authentication & User Onboarding

 Login (real Supabase auth)

 Signup (join existing winery)

 Logout (real session termination)

Multi-Winery Support & Security

 Multi-tenant login/data isolation (RLS)

 Winery join via secure join code

 Winery creation for new owners

Batch Management

 Unique auto-generated BOP number

 Batch creation form (real data persistence)

 Auto-calculated dates (Put-Up, Rack, Filter, Bottle)

 Batch editing (persistent changes)

 Manual date overrides (persistent, logical validation)

Daily Job List

 Today’s tasks dashboard (real data integration)

 Mark tasks/stages done (updates database)

 Overdue tasks clearly highlighted

Support & Administration

 Submit support messages (real DB integration)

 Basic admin panel (manage wineries/users/support)

General UI & UX

 Responsive/mobile-friendly UI

 Clean light-mode UI (dark mode optional)

 Basic PWA installability (manifest, service worker)

 #	What users/admins must be able to do	How it should work front-to-back
1. Sign-up & Login (join-only)	• A new staffer enters email + password + winery access code.
• If the code is valid they land in the app; if not, they’re blocked.
• No one can create a winery from this screen.	Front: real form calls signUp() → on success immediately calls joinWinery(code).
Back:
1. Supabase Auth creates the user.
2. A secure RPC finds the winery by code (bypassing RLS safely) and updates users.winery_id & role.
3. RLS now lets the user read only their winery’s rows.
2. Admin creates / manages wineries	Only admins can add a new winery or edit its name.	Admin Panel: calls admin_create_winery(name) (RPC). Trigger sets unique join-code & starts BOP sequence at 1.
3. Create a batch	Staff fill customer + kit length + Date of Sale + Put-Up Date → hit Save.	Back-end trigger math (per spec):
• Rack = Put-Up + 14 days
• Filter = Rack + weeks (2, 3, 4 or 6)
• Bottle = Filter + 1 day but never on Sunday (shift to Monday).
• Unique BOP number increments per winery.
4. Edit batch / override dates	Staff can tweak any date or note later.	UI calls updateBatch(). Trigger fires only on INSERT (not on UPDATE) so overrides stick.
5. “Today” task list	Opens to the current calendar day every time the page loads or the date rolls over at midnight. Groups tasks:
• Put-Up, Rack, Filter, Bottle
• Overdue (any stage scheduled before today that isn’t done)	Query: getBatchesForDate(today) + getOverdueBatches(). Component uses current_stage to show only the next needed stage. Optional client-side setInterval or SW sync can refresh the date at midnight.
6. Mark stage done	Click ✔ → task disappears; next stage appears on its scheduled day.	Action markStageComplete(batch_id, stage):
• Advances current_stage.
• Sets status='done' when Bottle completed.
7. Support messages	Staff open Settings → Message Support, submit subject + body, get “Sent!” toast.	Insert into support_messages with user_id & winery_id.
8. Admin views & resolves support	Admin panel shows sortable table: **Subject	Winery
9. Real-time date/clock correctness	Any place that shows “Today”, “Tomorrow”, or a date should always match real-world time for the user’s browser (PEI or elsewhere).	Use new Date().toLocaleDateString() client-side for labels; all DB date comparisons done in UTC but converted in UI.
10. Security & hygiene	• No secrets in repo.
• RLS ON for every table.
• Service-role key only on server actions.
• CI lints & builds clean.	Follow rapid-polish checklist (rotate keys, Prettier, .env.example, GitHub Actions).

Current Overview of the BOP Project

Purpose
Track — in one place — the full production timeline for every wine kit a winery sells and bottles on-premise (“BOP” = Bottling On Premise).

Key Features
Unique BOP number for each batch (numbering starts at 1 per winery and auto-increments).

Date tracking for every batch

Date of Sale (when the kit is sold)

Put-Up Date (when the kit is mixed)

Racking Date – always 14 days after Put-Up

Filtering Date – varies by kit duration (see table below)

Bottling Date – 1 day after Filtering or any later date the customer requests, but never on Sundays (if 1 day later is Sunday, move to Monday).

Kit-duration rules for automatic Filtering calculation

Kit length	Filter ___ weeks after Racking
4-week kit	2 weeks
5-week kit	3 weeks
6-week kit	4 weeks
8-week kit	6 weeks

Daily job list

The app shows staff exactly what needs to be Put-Up, Racked, Filtered, Bottled, or is Overdue each day, based on the dates above.

Tasks disappear when a stage is marked done and re-appear in Overdue if a scheduled stage isn’t completed on time.

Multi-winery login isolation – each winery only sees its own batches, tasks, and support tickets.

Support messaging – staff can send an in-app help ticket; admins see which winery and user submitted it.

This is the full set of functions the MVP must deliver, end-to-end.