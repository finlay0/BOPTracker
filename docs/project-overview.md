# BOP Tracker — Functional Spec

This file explains what the app does and why.
It should be read by AI helpers and developers alike.

Log-in & Security


Any staff member can create their own account with an email + password.


The first time they sign in the app asks for a six-digit Winery Join Code (e.g. “4F7A2B”).


Entering that code locks their profile to only that winery. From then on, every record silently checks “Does this belong to my winery?” before it appears.


Owners/Admins can rotate the code at any time if it leaks.


Add a New Batch (the green “Start” button)


Five quick fields: customer, wine kit name, kit length (4/5/6/8-week), date of sale, and “Started yet?” Yes/No.


If “Yes”, today becomes the Put-Up date. If “No”, they pick the future Put-Up date.


Behind the scenes the app auto-calculates:


Rack = Put-Up + 14 days


Filter = Rack + (2/3/4/6 weeks depending on kit)


Bottle = Filter + 1 day (slides to Monday if it lands on Sunday)


Staff see the full timeline preview, press Save, and the batch is born.


Today Page (home screen)


A single color-coded checklist of everything due today:


Start (yellow) Rack (purple) Filter (teal) Bottle (blue) Overdue (soft red)


Tap Mark as Done → the card fades, the progress ring fills, and when the last task finishes a small confetti burst pops from the ring.


View Other Days


Tiny left/right arrows beside the date let staff peek at yesterday, tomorrow, or next week.


Future tasks are visible but disabled; missed tasks slide into Overdue automatically each morning.


All Batches Page


Searchable, sortable grid of every batch in motion.


Quick filters by kit length or status (In Progress, Completed, Overdue).


Click a row to open the Batch Detail drawer.


Batch Detail


Full timeline for that single batch.


Staff can override any date, jot customer notes, or mark the whole batch complete.


Updates ripple instantly back to Today and the master table.


Settings


Change email or password.


Toggle dark mode.


Two-minute User Guide link.


Message Support form → lands in an internal inbox + email so you can reply.


Admin Panel (you & grandfather only)


Create new wineries (auto-generates a fresh Join Code).


Regenerate a winery’s code with one click if it ever leaks.


Add or disable staff accounts.


View every support ticket across all wineries.


Under-the-Hood Math & Safety Nets


All date math runs automatically on every create or edit—no calculators needed.


Row-Level Security guarantees Winery A can’t even peek at Winery B’s data.


Every save shows a green toast; any error shows a clear red alert so nothing feels lost.


Why It Matters
Staff: one glance → exact next actions.


Owners: spotless records, zero missed bottlings.


You & Grandfather: working proof you can design, build, and ship production-grade workflow software—ready to roll out to real wineries (and beyond) today.