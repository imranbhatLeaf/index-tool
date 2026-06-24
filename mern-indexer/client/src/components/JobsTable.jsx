const badgeColors = {
  submitted: { background: "#d4f4dd", color: "#1a7a3a" },
  failed: { background: "#fbdada", color: "#b3261e" },
  queued: { background: "#fff3cd", color: "#8a6d00" },
  submitting: { background: "#fff3cd", color: "#8a6d00" },
};

export default function JobsTable({ jobs }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead>
        <tr>
          <th style={th}>URL</th>
          <th style={th}>Status</th>
          <th style={th}>Method</th>
          <th style={th}>Attempts</th>
        </tr>
      </thead>
      <tbody>
        {jobs.map((j) => (
          <tr key={j._id}>
            <td style={{ ...td, maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis" }}>{j.url}</td>
            <td style={td}>
              <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 11, ...badgeColors[j.status] }}>
                {j.status}
              </span>
            </td>
            <td style={td}>{j.methodUsed || "-"}</td>
            <td style={td}>{j.attempts}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const th = { textAlign: "left", padding: "6px 8px", borderBottom: "1px solid #eee" };
const td = { textAlign: "left", padding: "6px 8px", borderBottom: "1px solid #eee" };
