import express from "express";
import multer from "multer";
import UrlJob from "../models/UrlJob.js";
import Batch from "../models/Batch.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Submit a JSON list of URLs
router.post("/submit", async (req, res) => {
  const urls = (req.body.urls || []).map((u) => u.trim()).filter(Boolean);
  if (!urls.length) return res.status(400).json({ error: "No URLs provided" });

  const batch = await Batch.create({ totalUrls: urls.length });
  const docs = urls.map((url) => ({ url, status: "queued", batchId: batch._id }));
  await UrlJob.insertMany(docs);

  res.json({ queued: urls.length, batchId: batch._id });
});

// Upload a CSV/text file, one URL per line
router.post("/upload-csv", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const text = req.file.buffer.toString("utf-8");
  const urls = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (!urls.length) return res.status(400).json({ error: "File contained no URLs" });

  const batch = await Batch.create({ totalUrls: urls.length });
  const docs = urls.map((url) => ({ url, status: "queued", batchId: batch._id }));
  await UrlJob.insertMany(docs);

  res.json({ queued: urls.length, batchId: batch._id });
});

// Dashboard summary numbers
router.get("/stats", async (req, res) => {
  const total = await UrlJob.countDocuments();
  const grouped = await UrlJob.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const byStatus = Object.fromEntries(grouped.map((g) => [g._id, g.count]));

  res.json({
    total,
    queued: byStatus.queued || 0,
    submitting: byStatus.submitting || 0,
    submitted: byStatus.submitted || 0,
    failed: byStatus.failed || 0,
  });
});

// Recent jobs list
router.get("/jobs", async (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const jobs = await UrlJob.find().sort({ createdAt: -1 }).limit(limit);
  res.json(jobs);
});

export default router;
