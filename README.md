# KMR Remind — Production-Ready Installable Reminder & To-Do PWA

**KMR Remind** is a minimal, responsive, accessible, fast, and secure Progressive Web App (PWA) designed for reliable task scheduling, recurring reminders, and background Web Push alerts.

Built with **React**, **Vite**, **TypeScript**, **Tailwind CSS**, and backed by **Supabase** (Auth, PostgreSQL, Row-Level Security, pg_cron, and Edge Functions).

---

## 🌟 Key Features

1. **Full Task & Reminder Management**
   - Title, notes/description, local date and time picker.
   - Preserves user's local IANA time zone (e.g., `Asia/Kolkata`, `America/New_York`, `UTC`) across Daylight Saving Time (DST) changes.
   - Priorities: Low, Medium, High.
   - Categories: General, Work, Personal, Health, Finance, Learning.
   - Fast inline Quick Add input on the dashboard.

2. **Accurate Recurrence Engine**
   - One-time reminders (`none`).
   - Daily (`daily`).
   - Weekdays only (`weekdays` — Monday to Friday, automatically skipping weekends).
   - Weekly (`weekly` — advances in 7-day increments).
   - Monthly (`monthly` — handles month-end dates gracefully, e.g. clamping January 31 to February 28/29 or April 30).
   - Custom repeat intervals.
   - Optional repeat-until date cutoff.
   - Pause and resume recurring reminder series.

3. **Repeat-Until-Stopped Alerts**
   - Configurable repeat intervals (1, 5, 10, or 15 minutes).
   - Maximum repeat alert attempts (1 to 10).
   - Explicit state machine: Pending &rarr; Alerting &rarr; Snoozed &rarr; Dismissed &rarr; Completed.
   - Prevents duplicate delivery races via database constraints and atomic claim locks.

4. **Snooze, Dismiss, and Complete Semantics**
   - **Snooze**: 5, 10, 15, 30 minutes, or custom intervals. Sets `snooze_until` and pauses repeat alerts until the window expires.
   - **Dismiss**: Immediately ceases repeated alerts for that occurrence while keeping the task incomplete.
   - **Complete**: Marks the occurrence complete, ceases pending alerts, plays success audio, triggers celebration confetti, and automatically calculates the next occurrence if recurring.
   - **Reopen**: Re-activates any completed task.

5. **PWA & Web Push Notification System**
   - Compliant W3C Web Push with VAPID signing.
   - Standalone installable PWA with manifest, icons, and offline app shell caching (`sw.js`).
   - Interactive system notification actions: Complete (`✓`), Snooze (`⏰ 10m`), Dismiss (`✕`).
   - Custom synthesized Web Audio API chime sounds (no external audio assets required).
   - Multi-device support: each browser/device can be registered independently under the user's account.

6. **Footer ⏰ Admin Dashboard (PIN-Protected: `188199`)**
   - Accessible via the discreet ⏰ alarm button in the footer.
   - Prompts for a 6-digit security PIN (`188199`).
   - Displays real-time metrics across all users:
     - Total registered users and profiles
     - Total reminders and active reminders
     - Pending occurrences and active repeat alerts
     - Registered Web Push devices and status
     - Notification delivery history log with idempotency keys
     - Manual "Run Scheduler Now" trigger for on-demand execution
     - One-click copy for the full Supabase SQL Migration

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite 6, TypeScript 5.
- **Styling**: Tailwind CSS with custom brand palette and dark/light mode toggle.
- **Icons**: Lucide React.
- **Forms & Validation**: React Hook Form with Zod schemas.
- **Backend & Database**: Supabase Auth, PostgreSQL 15, Row Level Security (RLS), Edge Functions (Deno).
- **Scheduling**: Supabase `pg_cron` invoking Edge Functions minutely with atomic lock claims.
- **Testing**: Vitest, React Testing Library, and date-fns-tz test fixtures.
- **Hosting**: Vercel.

---

## 📁 Repository Structure

```
├── public/
│   ├── icons/
│   │   ├── icon-192.svg           # PWA icon 192x192
│   │   ├── icon-512.svg           # PWA icon 512x512
│   │   ├── icon-512-maskable.svg  # PWA maskable icon
│   │   └── badge-72.svg           # Push notification badge
│   ├── manifest.webmanifest       # Web App Manifest
│   └── sw.js                      # Service Worker (Push, Notification Clicks, Offline Cache)
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   ├── AdminDashboard.tsx # Comprehensive admin control panel
│   │   │   └── AdminPinModal.tsx  # PIN verification modal (188199)
│   │   ├── common/
│   │   │   ├── Badge.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Select.tsx
│   │   ├── dashboard/
│   │   │   ├── NextReminderWidget.tsx
│   │   │   ├── NotificationStatusWidget.tsx
│   │   │   └── StatCard.tsx
│   │   ├── layout/
│   │   │   ├── BottomNav.tsx      # Mobile navigation bar
│   │   │   ├── Footer.tsx         # Footer with ⏰ Admin button
│   │   │   ├── Navbar.tsx         # Top bar with quick add & theme switch
│   │   │   └── Sidebar.tsx        # Desktop sidebar navigation
│   │   ├── pwa/
│   │   │   └── InstallPromptBanner.tsx
│   │   └── reminders/
│   │       ├── QuickAddInput.tsx
│   │       ├── ReminderCard.tsx
│   │       ├── ReminderFormModal.tsx
│   │       └── SnoozeModal.tsx
│   ├── context/
│   │   ├── AuthContext.tsx        # Supabase Auth + Demo offline mode
│   │   ├── ReminderContext.tsx    # State management, occurrences, audio, confetti
│   │   └── ThemeContext.tsx       # Dark & Light mode
│   ├── lib/
│   │   ├── audio.ts               # Web Audio API notification chime generator
│   │   ├── pushManager.ts         # PushManager subscription & VAPID handling
│   │   ├── recurrence.ts          # DST-safe recurrence calculations
│   │   ├── supabase.ts            # Supabase client singleton
│   │   └── utils.ts               # Date & priority styling helpers
│   ├── pages/
│   │   ├── AllTasksPage.tsx       # Search, filter, sort
│   │   ├── CalendarPage.tsx       # Month view with day inspector
│   │   ├── CompletedPage.tsx      # Completion history & task reopen
│   │   ├── DashboardPage.tsx      # Widgets, today's tasks, overdue
│   │   ├── LoginPage.tsx          # Auth and instant demo
│   │   ├── ResetPasswordPage.tsx  # Password recovery
│   │   ├── SettingsPage.tsx       # Profile, timezone, devices, JSON export
│   │   └── UpcomingPage.tsx       # Timeline (Today, Tomorrow, Later)
│   ├── test/
│   │   ├── recurrence.test.ts     # Recurrence engine tests
│   │   ├── setup.ts               # Vitest environment setup
│   │   └── validation.test.ts     # Form schema tests
│   ├── types/
│   │   ├── database.ts            # Supabase DB typings
│   │   └── index.ts               # Form schemas & filter types
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── supabase/
│   ├── cron_setup.sql             # Minutely pg_cron scheduler definition
│   ├── functions/
│   │   ├── process-reminders/     # Edge Function for delivery & repeat alerts
│   │   └── send-test-push/        # Edge Function for test notifications
│   └── migrations/
│       └── 20261029000001_initial_schema.sql # Complete DB schema & RLS
├── .env.example
├── vercel.json                    # SPA routing and cache headers
└── package.json
```

---

## 🚀 Setup & Installation

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-username/kmr-remind.git
cd "KMR Remind"
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Set your configuration values:

```ini
# Supabase Configuration
VITE_SUPABASE_URL=https://wpnyljzdaonygldqhlvs.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwbnlsanpkYW9ueWdsZHFobHZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyMzMyNzQsImV4cCI6MjEwODgwOTI3NH0.XICNbwVK4Xs6nWl4L11FhQMDjfvpkssFB8XtIj-XoYY

# Web Push VAPID Public Key (Safe for client exposure)
VITE_VAPID_PUBLIC_KEY=BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U

# Admin Dashboard Access PIN (Footer ⏰ button)
VITE_ADMIN_PIN=188199
```

---

## 🗄️ Database Setup (Supabase)

1. Open your **Supabase Dashboard** &rarr; **SQL Editor**.
2. Open the file `supabase/migrations/20261029000001_initial_schema.sql` (or copy it directly from the Admin Panel tab in the app).
3. Paste the contents into the SQL Editor and click **Run**.
4. This creates:
   - `profiles` table with automatic signup trigger.
   - `reminders` table with recurrence and repeat alert parameters.
   - `reminder_occurrences` table with atomic scheduler claiming.
   - `push_subscriptions` table for multi-device Web Push.
   - `notification_deliveries` table with idempotency keys.
   - Comprehensive **Row Level Security (RLS)** policies ensuring users can only read and mutate their own records.
   - `claim_due_occurrences` and `admin_get_system_stats` security definer RPC functions.

---

## ⏰ Background Scheduler & Minutely Cron

To automatically trigger Web Push deliveries every minute:

1. In Supabase Dashboard, navigate to **Database** &rarr; **Extensions** and ensure `pg_cron` and `pg_net` are enabled.
2. In the **SQL Editor**, execute `supabase/cron_setup.sql`:
   ```sql
   SELECT cron.schedule(
       'kmr-remind-scheduler-minutely',
       '* * * * *',
       $$
       SELECT net.http_post(
           url := 'https://wpnyljzdaonygldqhlvs.supabase.co/functions/v1/process-reminders',
           headers := jsonb_build_object(
               'Content-Type', 'application/json',
               'Authorization', 'Bearer ' || '<YOUR_SERVICE_OR_ANON_KEY>'
           ),
           body := jsonb_build_object('source', 'pg_cron')
       ) AS request_id;
       $$
   );
   ```
3. Alternatively, you can trigger the scheduler on demand from the **Admin Dashboard** (`Run Scheduler Now` button) or using any standard cron provider (Vercel Cron, GitHub Actions, or cron-job.org).

---

## 🔐 Admin Dashboard Access

- Scroll to the footer of the application.
- Click the alarm clock emoji (**⏰**) on the bottom right of the footer.
- When prompted, enter the 6-digit PIN:
  ```
  188199
  ```
- Click **Unlock Dashboard**.
- You will be redirected to the Admin Dashboard displaying:
  - Total users, active reminders, pending alerts, and push subscriptions.
  - Full user list with timezones and device counts.
  - Recent reminder occurrences and delivery audit logs.
  - One-click button to trigger a scheduler cycle.
  - Database schema copy helper.

---

## 🧪 Automated Testing

Run the test suite using Vitest:

```bash
npm test
```

### Tests Covered:
- **Recurrence Engine (`src/test/recurrence.test.ts`)**:
  - One-time rule verification.
  - Daily recurrence calculation.
  - Weekday recurrence skipping Saturday/Sunday (Friday &rarr; Monday).
  - Weekly recurrence adding 7 calendar days.
  - Month-end clamping (Jan 31 &rarr; Feb 28; Mar 31 &rarr; Apr 30).
  - Recurrence end date cutoffs.
  - Overdue occurrence calculation.
- **Validation Schemas (`src/test/validation.test.ts`)**:
  - Valid task payload acceptance.
  - Title presence requirement.
  - Repeat alert interval constraints (`[1, 5, 10, 15]`).
  - Max alert attempt boundary checks (`[1..10]`).

---

## 📦 Production Build & Deployment

To verify the production build locally:

```bash
npm run build
```

This compiles TypeScript with `tsc -b` and builds the optimized bundle with `vite build`.

### Deploy to Vercel

1. Connect your repository to Vercel.
2. Framework Preset: **Vite**.
3. Build Command: `npm run build`.
4. Output Directory: `dist`.
5. Add Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_VAPID_PUBLIC_KEY`
   - `VITE_ADMIN_PIN` = `188199`
6. Click **Deploy**.

---

## 🛡️ Privacy & Reliability Guarantees

- **No Premature Permission Prompts**: Notification permissions are never requested on page load; only upon deliberate user interaction.
- **Idempotent Notification Dispatch**: Every delivery attempt writes a unique key (`${occurrence_id}_attempt_${count}_${subscription_id}`) to prevent duplicate notification delivery.
- **Safe Offline App Shell**: Static assets and offline tasks are cached via Service Worker, allowing the app to open instantly even when network connectivity is lost.
- **PostgreSQL RLS Isolation**: Every read and mutation verifies `auth.uid() = user_id`, strictly preventing any cross-user data leakage.

#   K M R R e m i n d  
 