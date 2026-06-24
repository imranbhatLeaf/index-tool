import { useEffect, useState } from "react";
import axios from "axios";
import StatsBar from "./components/StatsBar.jsx";
import JobsTable from "./components/JobsTable.jsx";

export default function App() {
  const [input, setInput] = useState("");
  const [stats, setStats] = useState({ total: 0, queued: 0, submitted: 0, failed: 0 });
  const [jobs, setJobs] = useState([]);

  const refresh = async () => {
    const [statsRes, jobsRes] = await Promise.all([
      axios.get("/api/stats"),
      axios.get("/api/jobs?limit=50"),
    ]);
    setStats(statsRes.data);
    setJobs(jobsRes.data);
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 4000);
    return () => clearInterval(id);
  }, []);

  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

  const submitUrls = async () => {
    const urls = input.split("\n").map((u) => u.trim()).filter(Boolean);
    if (!urls.length) return;
    await axios.post("/api/submit", { urls });
    setInput("");
    refresh();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadMsg("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post("/api/upload-csv", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadMsg(`Queued ${res.data.queued} URLs from ${file.name}`);
      refresh();
    } catch (err) {
      setUploadMsg(`Upload failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setUploading(false);
      e.target.value = ""; // reset so the same file can be re-uploaded if needed
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: "0 20px", fontFamily: "-apple-system, Arial, sans-serif" }}>
      <h1 style={{ fontSize: 22 }}>URL Indexing Tool — Dashboard</h1>

      <h3>Submit URLs (one per line)</h3>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={"https://example.com/page1\nhttps://example.com/page2"}
        style={{ width: "100%", height: 140, fontFamily: "monospace", padding: 10 }}
      />
      <br />
      <button
        onClick={submitUrls}
        style={{ background: "#111", color: "#fff", border: "none", padding: "10px 18px", borderRadius: 6, marginTop: 8, cursor: "pointer" }}
      >
        Queue for Indexing
      </button>

      <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #eee" }}>
        <h3>Or upload a CSV file (one URL per line)</h3>
        <input
          type="file"
          accept=".csv,.txt"
          onChange={handleFileChange}
          disabled={uploading}
        />
        {uploading && <span style={{ marginLeft: 10, color: "#666" }}>Uploading...</span>}
        {uploadMsg && (
          <p style={{ marginTop: 8, fontSize: 13, color: uploadMsg.startsWith("Upload failed") ? "#b3261e" : "#1a7a3a" }}>
            {uploadMsg}
          </p>
        )}
      </div>

      <StatsBar stats={stats} />
      <h3>Recent Jobs</h3>
      <JobsTable jobs={jobs} />
    </div>
  );
}
