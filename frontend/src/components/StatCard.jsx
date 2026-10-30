import React from "react";
import { TrendingUp, Activity } from "lucide-react";

function StatCard({ label, value, tone = "blue", icon: IconComponent, trend, caption = "Real-time records" }) {
  return (
    <article className={`stat-card tone-${tone}`}>
      <div className="stat-card-header">
        <span>{label}</span>
        <div className="stat-card-icon">
          {IconComponent ? <IconComponent size={18} /> : <Activity size={18} />}
        </div>
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-footer">
        {trend && (
          <span style={{ color: "var(--accent-emerald)", display: "flex", alignItems: "center", gap: "2px", fontWeight: 600 }}>
            <TrendingUp size={12} /> {trend}
          </span>
        )}
        <span>{caption}</span>
      </div>
    </article>
  );
}

export default StatCard;
