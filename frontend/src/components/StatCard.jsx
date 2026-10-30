import Icon from "./Icon";

function StatCard({ label, value, tone, icon }) {
  return <article className={`stat-card stat-${tone}`}>
    <div className="stat-card-top"><span>{label}</span><span className="stat-icon"><Icon name={icon} size={18} /></span></div>
    <strong>{value}</strong>
    <span className="stat-card-caption">Based on current records</span>
  </article>;
}

export default StatCard;
