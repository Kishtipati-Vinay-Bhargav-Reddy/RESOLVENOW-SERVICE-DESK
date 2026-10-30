const labels = {
  IN_PROGRESS: "In progress",
};

function StatusBadge({ status }) {
  const value = String(status || "OPEN").toUpperCase().replaceAll(" ", "_");
  return <span className={`status-badge status-${value.toLowerCase()}`}>{labels[value] || value.replaceAll("_", " ")}</span>;
}

export default StatusBadge;