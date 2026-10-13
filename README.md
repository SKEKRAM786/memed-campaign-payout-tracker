# Meme’d — Campaign Payout Tracker 🚀

> A full-stack creator marketplace web application where brands launch campaigns with tiered milestone payout ladders and strict budget caps, while creators submit posts and track earnings as simulated views climb.

---

## 🌐 Live Deployed Application

* **Frontend Live Link**: https://memed-campaign-payout-tracker-dusky.vercel.app/creator
* **Backend API Live**: [https://memed-campaign-payout-tracker.onrender.com](https://memed-campaign-payout-tracker.onrender.com)
* **GitHub Repository**: [https://github.com/SKEKRAM786/memed-campaign-payout-tracker](https://github.com/SKEKRAM786/memed-campaign-payout-tracker)

---

## ⚡ Tech Stack

* **Backend**: Node.js, TypeScript, Express.js, MongoDB (Mongoose), ioredis
* **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
* **Testing**: Jest, ts-jest (16 Unit Tests passing)
* **DevOps**: Docker, Docker Compose

---

## 🏗️ Repository Architecture

```text
memed-campaign-payout-tracker/
├── backend/
│   ├── src/
│   │   ├── config/          # MongoDB Atlas & Redis caching configuration
│   │   ├── controllers/     # Auth, Campaign, and Submission controllers
│   │   ├── middleware/      # JWT verification & Role guards (brand/creator)
│   │   ├── models/          # User, Campaign, and Submission schemas
│   │   ├── routes/          # Express API route endpoints
│   │   ├── services/        # Milestone calculation & budget capping algorithms
│   │   ├── app.ts           # Express app setup with CORS and JSON body parser
│   │   └── server.ts        # Server entrypoint with DB connection
│   ├── tests/               # Jest test suite (calculation, caps, idempotency)
│   ├── Dockerfile           # Multi-stage production container build
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   └── app/
│   │       ├── brand/       # Brand dashboard: create campaign, spent vs remaining
│   │       ├── creator/     # Creator dashboard: live campaigns, submit post, view simulator
│   │       ├── login/       # Login page with redirect
│   │       ├── signup/      # Signup page (Brand / Creator role select)
│   │       ├── components/  # Navbar, ThemeToggle (Light/Dark mode)
│   │       ├── lib/         # API fetch client & localStorage auth manager
│   │       ├── layout.tsx   # Root layout with theme script
│   │       └── page.tsx     # Modern landing page
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml       # Complete stack: Backend, Frontend, MongoDB, Redis
├── .env.example             # Global environment variables template
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
* Node.js 18+ and npm
* MongoDB Atlas cluster or local MongoDB instance
* *(Optional)* Redis (if testing bonus caching locally)

---

### Method 1: Local Development Setup

#### 1. Backend Setup
```bash
cd backend
npm install

# Create environment configuration
cp .env.example .env
# Set your MONGODB_URI and JWT_SECRET in .env

# Run unit tests
npm test

# Start backend dev server
npm run dev
# Server runs on http://localhost:5000
```

#### 2. Frontend Setup
```bash
cd frontend
npm install

# Create environment configuration
cp .env.example .env.local

# Start Next.js dev server
npm run dev
# App runs on http://localhost:3000
```

---

### Method 2: Docker Compose Setup

Run the entire stack (Backend, Frontend, MongoDB, Redis) in isolated containers:

```bash
docker-compose up --build
```
* **Frontend**: `http://localhost:3000`
* **Backend API**: `http://localhost:5000`

---

## 🔑 Environment Variables Reference

| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `PORT` | Backend HTTP Port | `5000` |
| `MONGODB_URI` | MongoDB Atlas / Local URI | `mongodb+srv://user:pass@cluster.mongodb.net/memed` |
| `JWT_SECRET` | Secret key for signing auth tokens | `your_32_character_jwt_secret_key` |
| `REDIS_URL` | Redis instance connection URL *(Bonus)* | `redis://localhost:6379` |
| `NEXT_PUBLIC_API_URL` | Frontend API client base URL | `http://localhost:5000/api` |

Sample templates are provided at:
* [`.env.example`](.env.example) (Root)
* [`backend/.env.example`](backend/.env.example)
* [`frontend/.env.example`](frontend/.env.example)

---

## 📐 Product Decisions & Stated Assumptions

Where the assignment brief was open, the following real-world product decisions were implemented:

1. **Highest Milestone Payout Rule**:
   * Payout is calculated based on the **highest milestone crossed**, rather than cumulative summing.
   * *Example*: If ladder is `10k views → ₹500` and `50k views → ₹2,000`, a creator with 60,000 views receives **₹2,000 total**, not ₹2,500.

2. **Crossing Multiple Milestones in a Single View Update**:
   * If a post jumps from `0` straight to `100k views`, the system awards the full highest tier payout (`₹5,000`) in one transaction, without requiring intermediate step increments.

3. **Budget Exhaustion Mid-Payout (Partial Payout)**:
   * A campaign **must never exceed its total budget**.
   * If a creator earns an additional `₹2,000` but the campaign only has `₹800` remaining, the creator receives the remaining `₹800`, and the campaign's remaining budget becomes `₹0`. Future updates disburse `₹0`.

4. **Monotonic Creator Earnings (No Clawbacks on View Drops)**:
   * If simulated views decrease (e.g., social network bot cleanups), previously disbursed creator earnings are **never clawed back**.

5. **Concurrency & Double-Pay Prevention**:
   * `PATCH /api/submissions/:id/views` uses multi-document transactions with conditional budget updates (`$inc: { spentBudget: additionalPayout }` guarded by remaining budget).
   * Two simultaneous view update requests can **never** overspend the brand's budget, and repeated requests with the same views disburse `₹0` (strict idempotency).

6. **View Spike Anomaly Flagging**:
   * Posts with an unusual surge (`>= 100,000` views in a single update or velocity `> 200 views/sec` within 2 minutes) are marked with `isFlagged: true` and flagged with an audit reason on the dashboard for brand review.

7. **Redis Caching with Graceful Fallback**:
   * `GET /api/campaigns` is cached in Redis with a 60-second TTL.
   * Creating a campaign immediately invalidates the cache.
   * If Redis is offline or absent, the app gracefully falls back to MongoDB with zero downtime.

---

## 🧪 Unit Testing

Unit tests are written with **Jest** covering payout calculation edge cases, budget caps, idempotency, and view spike detection:

```bash
cd backend
npm test
```

### Test Coverage Highlights (16 Passing Tests):
* ✅ Returns 0 when below first milestone
* ✅ Awards highest milestone payout when crossing intermediate and peak tiers
* ✅ Handles jumping multiple milestones in a single update
* ✅ Caps payout at remaining budget when budget is partially depleted
* ✅ Returns 0 additional payout when budget is completely exhausted
* ✅ Idempotent repeated view updates (zero double payout)
* ✅ View drops preserve earned payouts without clawbacks
* ✅ Flags abnormal single-step view jumps and velocity spikes
* ✅ Rejects negative or non-finite view counts

---

## 📈 Scaling Note: How Would Meme’d Scale to 10,000 Creators?

To support **10,000 active creators** updating views, submitting posts, and checking earnings concurrently, we would evolve the architecture as follows:

### 1. Asynchronous Ingestion & Message Queues
* Instead of processing view updates synchronously in Express HTTP requests, incoming view events from social media webhooks (Instagram Graph API, YouTube Data API v3) are pushed to a high-throughput **Apache Kafka** or **Redis Streams** topic.
* Background worker pools (using **BullMQ** or Go-based workers) consume view batches, calculate milestone differences, and process payouts in throttled micro-batches.

### 2. Distributed Locking & Concurrency Protection
* At scale, concurrent updates targeting the same campaign budget can cause lock contention on a single MongoDB document.
* We would implement **distributed locking via Redis (Redlock algorithm)** or maintain campaign budget ledgers as an append-only transaction ledger (`payout_events` collection) aggregated via atomic rollups, eliminating row-level locking bottlenecks.

### 3. Database Partitioning & Read Replicas
* **Read-Write Separation**: Route `GET` requests (campaign browsing, creator earnings dashboards) to MongoDB Secondary Read Replicas, keeping Primary replicas dedicated exclusively to writes.
* **Sharding**: Shard the `submissions` collection by `campaignId` (hashed or compound with `creatorId`) across MongoDB cluster shards.
* **Indexing**: Composite indexes on `{ campaignId: 1, creatorId: 1 }` and `{ creatorId: 1, createdAt: -1 }` maintain sub-millisecond query execution.

### 4. Multi-Layered Caching & Edge Delivery
* Cache live campaign metadata, creator aggregated balances, and milestone configurations in a **Redis Cluster** with read-through / write-behind caching.
* Serve static assets and Next.js frontend pages from global CDN edge nodes (Cloudflare / Vercel Edge Network), reducing server load by >85%.

### 5. Rate Limiting & Fraud Defense
* Implement token-bucket rate limiting via **Redis Rate Limiter** on public endpoints (`PATCH /api/submissions/:id/views`).
* Enforce automated fraud review queues for flagged view spike anomalies before payouts are authorized for bank settlement.

---

## 👥 Roles & Demo Walkthrough

### 1. Brand Role
1. Sign up as a **Brand**.
2. Go to **Brand Dashboard** (`/brand`).
3. Fill in campaign name, platform (Instagram / YouTube), total budget (e.g., `₹50,000`), and configure milestone tiers.
4. View the real-time budget progress bar tracking **Spent vs. Remaining Budget**.

### 2. Creator Role
1. Sign up as a **Creator**.
2. Go to **Creator Dashboard** (`/creator`).
3. View **Total Creator Earnings**.
4. Browse live brand campaigns and select one to submit a post URL.
5. In the **My Submissions** section, use the **View Simulator buttons** (`+10k`, `+50k`, `+100k`, or custom number) to simulate views and watch earnings and campaign remaining budgets update instantly.

---

## 📄 License
ISC
