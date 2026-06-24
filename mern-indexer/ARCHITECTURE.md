# Architecture — Scale-up to 20,000 links/day (MERN)

## 1. Target architecture diagram

```
┌──────────────┐      ┌───────────────┐      ┌─────────────────────┐
│  React Client │─────▶│  Express API  │─────▶│   Job Queue          │
│ (CSV upload,  │      │  (Node.js)    │      │   (BullMQ + Redis)   │
│  dashboard)   │      └──────┬────────┘      └──────────┬──────────┘
└──────────────┘             │                            │
                       ┌──────▼───────┐            ┌──────▼──────────┐
                       │   MongoDB     │            │  Worker Pool     │
                       │ (urls, jobs,  │◀──────────▶│  (N Node          │
                       │  batches,     │            │  processes,      │
                       │  status log)  │            │  autoscaled)     │
                       └──────────────┘            └──────┬──────────┘
                                              ┌─────────────┼─────────────┐
                                              ▼             ▼             ▼
                                       IndexNow API   Sitemap+Ping   Google Search
                                       (free, Bing/    (Bing sitemap  Console API
                                       Yandex)         spec)          (paid tier /
                                                                       quota-limited)
                                              │
                                       ┌──────▼───────┐
                                       │ Verification  │
                                       │ Job (cron)    │
                                       │ re-checks      │
                                       │ index status   │
                                       └───────────────┘
```

## 2. Why three submission channels, not one

| Channel | Cost | Speed | Reliability | Scale limit |
|---|---|---|---|---|
| IndexNow | Free | Near-instant for Bing/Yandex | High (official protocol) | None published — batch-friendly |
| Sitemap + ping | Free | Hours–days | Medium (depends on crawl budget) | 50,000 URLs/sitemap file, unlimited files |
| Google Search Console URL Inspection API | Free quota, Google-account-gated | Hours–days | High but rate-limited | ~200 requests/day per account |

Google has no free, general-purpose "instant index my URL" API — the real
Indexing API is officially restricted to JobPosting/BroadcastEvent structured
data. Tools claiming to "force Google index" are using URL Inspection API
quota tricks or crawl-bait techniques. Calling this out in your presentation
shows you understand the real constraint, not just the API docs.

## 3. Scaling math for 20,000 URLs/day with zero budget

- **IndexNow**: supports bulk submission in a single POST — 20,000/day is a
  batching/queue-throughput problem, not an account-limit problem.
- **Sitemap+ping**: shard URLs into files of ~10,000 each (under the 50k cap),
  regenerate and re-ping after each new batch.
- **Bottleneck**: the target domains' crawl frequency by search engines, not
  your infrastructure — every commercial indexing tool has this same ceiling.

## 4. Scaling the MERN infrastructure itself (still free/open-source)

| Layer | MVP (this scaffold) | Scaled version |
|---|---|---|
| Queue | Node `setInterval` polling loop | BullMQ + Redis (self-hosted, free) |
| DB | Single MongoDB instance | MongoDB replica set / sharded cluster (free self-hosted; Atlas paid tier optional) |
| Workers | 1 Node process | N worker processes via BullMQ workers, PM2 cluster mode, or Docker Compose |
| Submission | Sequential batches of 50 | Larger IndexNow batches + parallel sitemap shards |
| Monitoring | Dashboard polling DB every 4s | Add Bull Board (free, open-source BullMQ dashboard) + structured logs |

Everything above runs on a single free-tier VM or your own laptop for a
demo — no paid APIs, no billing account anywhere in this design.

## 5. Pricing model (business-case slide)

- **Per-URL credits**: $0.01–0.05/URL (industry norm for paid-tier speed/accuracy)
- **Free tier**: IndexNow + sitemap only, capped at e.g. 500 URLs/day
- **Paid tier**: adds Google Search Console API rotation (user connects their
  own Search Console accounts) for faster/more reliable Google indexing
- **Enterprise**: custom volume, dedicated worker capacity, SLA on submission
  speed (not indexing speed — never guaranteed by anyone in this space)

## 6. Risks to mention in your pitch

- No method guarantees indexing — only improves odds/speed of discovery.
- Aggressive use of quota-restricted Google APIs for non-whitelisted content
  risks account suspension — explicitly avoided in this design.
- Crawl budget is controlled by the search engine, not the tool — set this
  expectation clearly in any pricing/SLA language.
