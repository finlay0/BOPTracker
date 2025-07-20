BOP Tracker – Project Plan
Overview
BOP Tracker is a multi-tenant winery workflow app.
UI: Fully built, mobile-friendly, and PWA-ready, with all core screens and flows present.
Backend: Supabase/Postgres, architected for security, per-winery data isolation, and automation.
Goal: Connect the UI to the backend, ensure all flows are functional, and polish for production.
Features & Status
1. Authentication & Access
Login/Logout:
UI: Present
Backend: Needs Supabase Auth integration
Join Winery via Code:
UI: Present
Backend: Needs backend action to validate/join
Create New Winery:
UI: Present
Backend: Needs backend action to create/assign owner
2. Today Tab (Task Dashboard)
View Today’s Tasks:
UI: Present (grouped, progress ring, navigation)
Backend: Needs real data connection
Mark Task as Done:
UI: Present (with animation)
Backend: Needs backend update
Overdue Tasks:
UI: Present (highlighted)
Backend: Needs backend logic
3. Batches Tab
View/Search/Filter/Sort Batches:
UI: Present (search, filter, sort, list)
Backend: Needs real data connection
Open Batch Detail:
UI: Present
Backend: Needs backend fetch
4. Batch Detail View
View/Edit Batch Details:
UI: Present
Backend: Needs backend read/update
Override Stage Dates:
UI: Present
Backend: Needs backend update
Mark Batch as Complete:
UI: Present
Backend: Needs backend update
Notes:
UI: Present
Backend: Needs backend update
5. New Batch Tab
Create New Batch:
UI: Present (form works, can be filled out)
Backend: Needs backend create (currently only updates UI state)
Automatic Date Calculation:
UI: Present (including Sunday rule)
Backend: Backend triggers must match UI logic
6. Settings Tab
View Current Email:
UI: Present
Backend: Needs Supabase Auth fetch
Change Email:
UI: Present (form, confirmation)
Backend: Needs Supabase Auth integration
Change Password:
UI: Present (modal)
Backend: Needs Supabase Auth integration
Winery Access Code:
UI: Present
Backend: Needs backend fetch
Toggle Dark Mode:
UI: Fully functional (client only)
Backend: Nothing needed
Open User Guide:
UI: Present
Backend: Nothing needed
Send Support Message:
UI: Present (form, confirmation)
Backend: Needs backend store
App Version:
UI: Present
Backend: Nothing needed
Log Out:
UI: Present (button, modal)
Backend: Needs Supabase Auth sign out
TEMP: Go to Admin Panel:
UI: Present
Backend: Remove before production
7. User Guide
User Guide:
UI: Present and accessible
Backend: Nothing needed
8. PWA/Responsive
Responsive Design:
UI: Fully mobile-friendly
Backend: Nothing needed
PWA Install/Offline:
UI: Ready
Backend: Needs manifest.json and service worker
Backend Architecture
Supabase/Postgres with:
Multi-tenant schema, per-winery data isolation
Row Level Security (RLS) for all tables
Per-winery BOP number generation (serial, not global)
Secure join code system (6-digit, rate-limited)
Date calculation triggers (Sunday rule, timezone support)
All functions secured with SECURITY DEFINER and correct search_path
No duplicate email columns; all user emails from auth.users
Admin-only SQL functions and RLS overrides
Support messages table for user feedback
Security test script for validation
Admin Panel
Fully functional and secure
Winery/user/support management
Role-based access (middleware, server actions, admin check)
All import/type issues fixed
Temporary navigation button in settings (to be removed)
Immediate Next Steps
Connect all Auth flows (login, logout, email, password) to Supabase
Implement backend actions for join winery, create winery, and batch CRUD
Wire up Today tab, Batches tab, and Batch Detail to real backend data
Store support messages in backend
Add PWA manifest and service worker
Remove TEMP admin panel button before production
Test all flows end-to-end

Where We Are
Phase 1: Backend, schema, RLS, admin panel, and all UI screens are complete.
Phase 2: Ready to connect the UI to the backend, starting with authentication and user onboarding.
Phase 2: Authentication & User Onboarding
Step 1: Supabase Auth Integration
Connect login page to Supabase Auth (email/password).
Implement session management:
Show/hide protected routes based on login state.
Redirect unauthenticated users to login.
Wire up logout to Supabase sign out.
Step 2: Join Winery Flow
Connect join code UI to backend:
Validate 6-digit code.
On success, associate user with the correct winery.
Handle errors (invalid/expired code, already joined, etc.).
Test:
New user can join a winery and see the correct data.
Step 3: Winery Creation Flow
Connect new winery UI to backend:
Create winery in DB.
Assign user as owner.
Generate and display join code.
Test:
New owner can create a winery and access the dashboard.
Step 4: Settings – Email & Password
Connect “Change Email” to Supabase Auth:
Send confirmation link.
Handle errors and success messages.
Connect “Change Password” modal to Supabase Auth:
Update password securely.
Show confirmation/error.
Test:
User can change email and password, and see correct feedback.
Phase 3: Batch Management & Task Flows
Step 5: Batch CRUD Integration
Wire up “Create New Batch” form to backend:
Save batch to DB.
Use backend triggers for date calculations and BOP number.
Wire up batch list and detail views:
Fetch real batch data for the user’s winery.
Support search, filter, and sort.
Enable batch editing:
Update batch details, notes, and override dates.
Mark batch as complete.
Step 6: Today Tab & Task Completion
Connect Today tab to backend:
Fetch today’s tasks for the user’s winery.
Mark tasks as done (persist to DB).
Animate completion as in UI.
Ensure overdue logic matches backend calculations.
Phase 4: Support, PWA, and Polish
Step 7: Support Messages
Connect support form to backend:
Store messages in DB for admin review.
Show confirmation to user.
Step 8: PWA Enablement
Add manifest.json and service worker.
Test installability and offline support on mobile.
Step 9: Final Polish & Testing
Remove TEMP admin panel button from settings.
Test all flows end-to-end (auth, join, batch, settings, support).
Accessibility and mobile polish (keyboard nav, color contrast, etc.).
Bugfixes and final QA.
Summary Table (Phase 2 & 3 Focus)
Step	Description	Status/Next Action
Supabase Auth Integration	Login, logout, session, protected routes	Start now
Join Winery Flow	Validate/join via code	After auth
Winery Creation	Owner creates new winery	After join flow
Change Email/Password	Settings tab, Supabase Auth	After onboarding
Batch CRUD	Create, edit, view, complete batches	After onboarding
Today Tab/Task Completion	Real data, mark done, overdue logic	After batch CRUD
Support Messages	Store/send to backend	After core flows
PWA/Polish	Manifest, service worker, mobile QA	Final step
