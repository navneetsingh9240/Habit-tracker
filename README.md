# Full-Stack Production-Minded Habit Tracker

A production-minded, full-stack Habit Tracker web application built with React, Vite, Tailwind CSS, Node.js, Express, JavaScript, PostgreSQL, and Prisma ORM.

---

## 🚀 Overview & Features

* **Authentication & Authorization**: Secure registration and login using bcrypt password hashing and JWT authorization tokens. IDOR protection ensures users can only access and modify their own habits.
* **IANA Timezone Awareness**: Each user is assigned an explicit IANA timezone (e.g., `Asia/Kolkata`, `America/New_York`). Calendar day calculations operate strictly relative to the user's timezone rather than server time or UTC elapsed hours.
* **Habit Management**: Create, view, and delete habits with detailed stats and completion history.
* **Timezone-Aware Check-ins**: Check in for the current local day or backfill missed past local days. Future local dates are strictly rejected on both frontend and backend.
* **Database Enforced Uniqueness**: Database-level `@@unique([habitId, localDate])` constraint prevents duplicate check-ins even under concurrent API calls.
* **Streak Calculations**: Dedicated streak service calculates both **Current Streak** (active consecutive completed calendar days ending today or yesterday) and **Longest Streak** (maximum sequence of consecutive completed calendar days).
* **Responsive Modern UI**: Built with Tailwind CSS, supporting loading states, empty states, disabled controls, and real-time feedback.

---

## 📂 Project Structure

```text
habit-tracker/
├── frontend/             # React + Vite + Tailwind CSS Frontend Application
│   ├── src/
│   │   ├── components/   # AuthForm, HabitCard, HabitDetailModal, CreateHabitModal
│   │   ├── hooks/        # useAuth
│   │   ├── utils/        # timezones
│   │   ├── App.jsx       # Main Dashboard application
│   │   └── main.jsx
│   └── vite.config.js
│
├── backend/              # Express + Node.js Backend Application
│   ├── src/
│   │   ├── services/     # timezone.service.js, streak.service.js
│   │   ├── modules/      # auth, habits, dashboard routers
│   │   ├── middleware/   # auth, authorizeHabit, error handling
│   │   ├── schemas/      # validation.schemas.js (Zod)
│   │   └── server.js     # Entry point
│   ├── prisma/
│   │   ├── schema.prisma # Prisma database models
│   │   └── migrations/   # SQL migration files
│   └── vitest.config.js
│
├── README.md
└── .env.example
```

---

## 🛠 Technology Stack

* **Frontend**: React + Vite + JavaScript + Tailwind CSS
* **Backend**: Node.js + Express + JavaScript (CommonJS)
* **Database**: PostgreSQL
* **ORM**: Prisma ORM
* **Validation**: Zod
* **Authentication**: JWT + bcrypt
* **Timezone & Date Handling**: Luxon
* **Testing**: Vitest + Supertest + Playwright (Visual Verification)

---

## 🕒 Timezone & Local-Day Logic

### Location of Logic
* `backend/src/services/timezone.service.js`

### Design Rationale
In habit tracking applications, standard UTC date comparison or elapsed hour calculations break down when users span different timezones or when servers reside in different regions.

Our application treats the user's assigned **IANA timezone as the absolute source of truth**:
1. When a check-in occurs or dashboard data is requested, the system reads the user's IANA timezone (e.g., `Asia/Kolkata`).
2. `TimezoneService.getTodayLocalDate(timezone)` uses Luxon to convert the current timestamp into the user's current local date in standard `YYYY-MM-DD` string format.
3. Check-ins store the normalized `YYYY-MM-DD` local calendar date in the database as a string (`localDate`).
4. All business logic (future date checks, backfilling, streak calculations) operates exclusively on normalized `YYYY-MM-DD` strings.

---

## 🔥 Streak Algorithm

### Location of Logic
* `backend/src/services/streak.service.js`

### Algorithm Explanation
1. Check-in dates for a habit are deduplicated and sorted in ascending chronological order (`YYYY-MM-DD`).
2. **Longest Streak**: The service iterates through sorted dates, checking if adjacent dates represent consecutive calendar days (difference of exactly 1 day). The max consecutive sequence length found is the `longestStreak`.
3. **Current Streak**:
   - A streak is active if checked in on **Today** or **Yesterday** (in the user's local timezone).
   - If checked in today, the algorithm counts backwards consecutive days starting from today.
   - If checked in yesterday (but not yet today), the streak remains active, and the algorithm counts backwards from yesterday.
   - If neither today nor yesterday is checked in, the `currentStreak` is `0`.

---

## 🗄 Database Design

### Models (`backend/prisma/schema.prisma`)
* **User**: `id`, `email`, `passwordHash`, `timezone`, `createdAt`, `updatedAt`
* **Habit**: `id`, `userId`, `name`, `description`, `createdAt`, `updatedAt`
* **HabitCheckIn**: `id`, `habitId`, `localDate`, `createdAt`

### Integrity & Indexing
* `@@unique([habitId, localDate])`: Ensures database-level uniqueness for check-ins per habit and local calendar date.
* `@@index([userId])`: Index on `Habits` for fast user retrieval.
* Foreign keys with `onDelete: Cascade` clean up child records when parent users or habits are deleted.

---

## 🔒 Security Decisions

1. **Password Hashing**: Passwords are hashed using `bcrypt` with a work factor of 10. Plaintext passwords are never stored or logged.
2. **JWT Authentication**: Secured with secret key. Middleware verifies bearer token on all private API endpoints.
3. **IDOR & Authorization**: All operations derive `userId` directly from the verified JWT payload. `verifyHabitOwnership` middleware verifies resource ownership before executing habit queries/mutations.
4. **Input Validation**: Zod schemas validate registration (email format, minimum password length, valid IANA timezone), login, habit creation, and check-in date formats.
5. **Safe Error Handling**: Centralized error middleware prevents leakage of stack traces or sensitive database details in production responses.

---

## 🧪 Testing & Results

### Unit & Integration Tests (`backend/src/tests/`)
* `timezone.service.test.js`: Verifies IANA timezone validation, date formatting across global timezone boundaries, and future date checks.
* `streak.service.test.js`: Verifies empty check-ins, single-day streaks, active yesterday streaks, broken streaks, backfilled dates, and unsorted inputs.
* `api.integration.test.js`: Verifies registration, login, auth middleware, habit creation, today check-in, duplicate check-in rejection (409 Conflict), future date rejection (400 Bad Request), and IDOR authorization blocks (403 Forbidden).

To execute tests:
```bash
cd backend
npm test
```

*Results*: **24/24 tests passed (100% pass rate)**.

---

## ⚙️ How to Run Locally

### 1. Prerequisites
* Node.js v18+
* PostgreSQL running locally on port 5432

### 2. Database Setup
Create database `habit_tracker` in PostgreSQL:
```bash
sudo -u postgres psql -c "CREATE DATABASE habit_tracker;"
```

### 3. Environment Variables
Create `.env` file in `backend/`:
```env
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/habit_tracker?schema=public"
JWT_SECRET="super-secret-jwt-key-for-habit-tracker"
CLIENT_URL="http://localhost:5173"
```

### 4. Install Dependencies & Run Migrations
```bash
# Backend setup
cd backend
npm install
npx prisma migrate dev --name init

# Frontend setup
cd ../frontend
npm install
```

### 5. Start Application
Run Backend Server:
```bash
cd backend
npm run dev
```

Run Frontend Client:
```bash
cd frontend
npm run dev
```

Open browser at `http://localhost:5173`.

---

## 📡 REST API Overview

* `POST /api/auth/register` - Register a new user (requires email, password, valid IANA timezone)
* `POST /api/auth/login` - User login
* `GET /api/auth/me` - Get authenticated user profile
* `GET /api/dashboard` - Get dashboard stats & habit summaries
* `GET /api/habits` - List user habits
* `POST /api/habits` - Create a habit
* `GET /api/habits/:id` - Get single habit detail
* `DELETE /api/habits/:id` - Delete a habit
* `GET /api/habits/:id/check-ins` - Get check-in history
* `POST /api/habits/:id/check-ins` - Check in today or backfill past local date (`{ localDate: 'YYYY-MM-DD' }`)
