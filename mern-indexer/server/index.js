import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

import jobsRouter from "./routes/jobs.js";
import { startWorker } from "./services/worker.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", jobsRouter);

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/indexer";
const PORT = process.env.PORT || 5000;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    startWorker();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });
