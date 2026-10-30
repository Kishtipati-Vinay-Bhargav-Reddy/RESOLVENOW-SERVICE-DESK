import React from "react";
import { 
  CircleDot, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  UserCheck, 
  AlertTriangle, 
  Flame, 
  ShieldAlert,
  ArrowUpRight
} from "lucide-react";

export function StatusBadge({ status }) {
  const value = String(status || "OPEN").toUpperCase().replaceAll(" ", "_");

  const icons = {
    OPEN: <CircleDot size={12} className="status-dot" />,
    ASSIGNED: <UserCheck size={12} />,
    IN_PROGRESS: <Clock size={12} className="spin-slow" />,
    RESOLVED: <CheckCircle2 size={12} />,
    CLOSED: <XCircle size={12} />,
    COMPLETED: <CheckCircle2 size={12} />
  };

  const labels = {
    IN_PROGRESS: "In Progress",
    OPEN: "Open",
    ASSIGNED: "Assigned",
    RESOLVED: "Resolved",
    CLOSED: "Closed",
    COMPLETED: "Completed"
  };

  return (
    <span className={`badge status-${value.toLowerCase()}`}>
      {icons[value] || <CircleDot size={12} />}
      <span>{labels[value] || value.replaceAll("_", " ")}</span>
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const value = String(priority || "MEDIUM").toUpperCase();

  const config = {
    CRITICAL: { label: "Critical", icon: <Flame size={12} />, className: "priority-critical" },
    HIGH: { label: "High", icon: <AlertTriangle size={12} />, className: "priority-high" },
    MEDIUM: { label: "Medium", icon: <Clock size={12} />, className: "priority-medium" },
    LOW: { label: "Low", icon: <ArrowUpRight size={12} />, className: "priority-low" }
  };

  const current = config[value] || config.MEDIUM;

  return (
    <span className={`badge ${current.className}`}>
      {current.icon}
      <span>{current.label}</span>
    </span>
  );
}

export function EscalationBadge({ level, reason }) {
  return (
    <span className="badge badge-escalated" title={reason || "Escalated Issue"}>
      <ShieldAlert size={12} />
      <span>L{level || 1} Escalated</span>
    </span>
  );
}

export function OverdueBadge() {
  return (
    <span className="badge badge-overdue">
      <AlertTriangle size={12} />
      <span>SLA Breach</span>
    </span>
  );
}

export default StatusBadge;