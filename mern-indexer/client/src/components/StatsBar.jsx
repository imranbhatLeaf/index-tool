export default function StatsBar({ stats }) {
  const items = [
    { label: "Total", value: stats.total },
    { label: "Queued", value: stats.queued },
    { label: "Submitted", value: stats.submitted },
    { label: "Failed", value: stats.failed },
  ];

  return (
    <div style={{ display: "flex", gap: 16, margin: "20px 0" }}>
      {items.map((item) => (
        <div
          key={item.label}
          style={{ flex: 1, padding: 14, borderRadius: 8, background: "#f4f4f4", textAlign: "center" }}
        >
          <span style={{ display: "block", fontSize: 24, fontWeight: 700 }}>{item.value}</span>
          {item.label}
        </div>
      ))}
    </div>
  );
}
