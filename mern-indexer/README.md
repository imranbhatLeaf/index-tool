# URL Indexing Tool — MERN Stack MVP

A zero-cost MVP proving the architecture for a bulk URL indexing service,
built on MongoDB, Express, React, and Node. Designed to scale conceptually
to 20,000 links/day; demoed at small scale.

## What it does

1. Upload/paste a list of URLs.
2. Each URL becomes a job: `queued -> submitting -> submitted/failed`.
3. A background worker (Node `setInterval` loop) submits URLs via:
   - **IndexNow protocol** — free, instant, supported by Bing & Yandex, no API key billing
   - **Sitemap generation** — fallback channel, ready to wire up to Bing's sitemap ping
   (Google retired its public sitemap ping + restricts its Indexing API to
   JobPosting/BroadcastEvent content — that's why this MVP uses the free,
   working alternatives. Google Search Console's URL Inspection API is the
   "paid-tier" upgrade path in the full pitch — see ARCHITECTURE.md.)
4. A React dashboard polls `/api/stats` and `/api/jobs` to show live progress.

## Why this stack (zero cost)

| Layer | Choice | Why |
|---|---|---|
| Backend | Express (Node) | Lightweight, async-friendly for I/O-bound submission calls |
| DB | MongoDB | Free locally (or free-tier Atlas), flexible schema for job/status tracking |
| Queue | In-process `setInterval` worker | No Redis cost for MVP; swap for BullMQ+Redis at scale |
| Submission | IndexNow + Sitemap | 100% free, no Google Cloud billing |
| Frontend | React (Vite) | Fast dev loop, component-based dashboard |

## Run it

**1. Start MongoDB locally** (or use a free MongoDB Atlas cluster and put its
connection string in `.env`):
```bash
mongod
```

**2. Start the server**
```bash
cd server
cp .env.example .env
npm install
npm start
```
Server runs on http://localhost:5000

**3. Start the client**
```bash
cd client
npm install
npm run dev
```
Open http://localhost:5173 — paste URLs, watch them get queued and submitted.

## Project structure

```
mern-indexer/
├── server/
│   ├── index.js                # Express app entrypoint
│   ├── models/
│   │   ├── UrlJob.js            # Mongoose schema for jobs
│   │   └── Batch.js             # Mongoose schema for upload batches
│   ├── routes/
│   │   └── jobs.js              # /api/submit, /upload-csv, /stats, /jobs
│   ├── services/
│   │   ├── indexnow.js          # IndexNow submission client
│   │   ├── sitemap.js           # Sitemap generation + Bing ping
│   │   └── worker.js            # Background queue processor
│   ├── package.json
│   └── .env.example
├── client/
│   ├── src/
│   │   ├── App.jsx              # Main dashboard UI
│   │   ├── main.jsx
│   │   ├── index.css
│   │   └── components/
│   │       ├── StatsBar.jsx
│   │       └── JobsTable.jsx
│   ├── index.html
│   ├── vite.config.js           # Proxies /api to server on :5000
│   └── package.json
├── README.md
└── ARCHITECTURE.md              # Full scale-up design (20k/day, pricing)
```

## Path to 20,000/day (no money, conceptually)

See ARCHITECTURE.md for full detail, but in short:
- IndexNow supports bulk URL submission in a single request — scaling is a
  batching/queue-throughput problem, not an account-limit problem.
- Sitemaps are capped at 50,000 URLs/file (spec limit) — shard into multiple
  files and re-ping as new batches land.
- Swap the in-process worker for **BullMQ + Redis** (still free, self-hosted)
  to run multiple worker processes once you outgrow a single Node process.
- The real bottleneck at scale is the search engine's own crawl budget for
  the target domains, not your submission throughput.
