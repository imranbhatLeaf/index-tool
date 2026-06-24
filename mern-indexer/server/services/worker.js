/**
 * Background queue processor.
 *
 * MVP design: a setInterval loop polls Mongo for `queued` jobs and submits
 * them in batches via IndexNow (primary), generating a sitemap snapshot as
 * the fallback channel. Swap this loop for a BullMQ + Redis worker pool when
 * moving to a multi-process deployment (see ARCHITECTURE.md).
 */
import UrlJob from "../models/UrlJob.js";
import { submitUrlsIndexNow } from "./indexnow.js";
import { generateSitemapXml } from "./sitemap.js";

// Demo IndexNow credentials — replace with a key you actually host at
// https://<your-domain>/<key>.txt for real submissions to take effect.
const INDEXNOW_HOST = process.env.INDEXNOW_HOST || "example.com";
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || "demo-key-replace-me";

const BATCH_SIZE = 50;
const POLL_INTERVAL_MS = 5000;

async function processBatch(jobs) {
  const urls = jobs.map((j) => j.url);

  const result = await submitUrlsIndexNow(urls, INDEXNOW_HOST, INDEXNOW_KEY);

  // Always also generate the sitemap snapshot as the secondary channel —
  // in the scaled version this gets written to a hosted path and pinged
  // via services/sitemap.js -> pingSitemap().
  generateSitemapXml(urls);

  const now = new Date();
  await Promise.all(
    jobs.map((job) => {
      job.attempts += 1;
      if (result.success) {
        job.status = "submitted";
        job.methodUsed = "indexnow";
        job.submittedAt = now;
      } else {
        job.status = "failed";
        job.methodUsed = "indexnow";
        job.errorMessage = String(result.body || result.error || "unknown error");
      }
      return job.save();
    })
  );
}

export function startWorker() {
  setInterval(async () => {
    const jobs = await UrlJob.find({ status: "queued" }).limit(BATCH_SIZE);
    if (!jobs.length) return;

    await UrlJob.updateMany(
      { _id: { $in: jobs.map((j) => j._id) } },
      { $set: { status: "submitting" } }
    );

    await processBatch(jobs);
  }, POLL_INTERVAL_MS);

  console.log("Worker started — polling every", POLL_INTERVAL_MS / 1000, "s");
}
