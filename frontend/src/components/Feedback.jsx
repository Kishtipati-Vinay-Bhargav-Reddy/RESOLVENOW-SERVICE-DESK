import React from "react";
import { Inbox, AlertCircle, RotateCw } from "lucide-react";

export function PageHeader({ eyebrow, title, description, actions, className = "" }) {
  return (
    <div 
      className={`page-header ${className}`}
      style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "flex-start", 
        marginBottom: "28px", 
        gap: "20px", 
        flexWrap: "wrap" 
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {eyebrow && (
          <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", color: "var(--accent-blue)", textTransform: "uppercase" }}>
            {eyebrow}
          </span>
        )}
        <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
          {title}
        </h1>
        {description && (
          <p style={{ fontSize: "0.92rem", color: "var(--text-secondary)", maxWidth: "700px" }}>
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {actions}
        </div>
      )}
    </div>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div 
      style={{ 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center", 
        padding: "48px 24px", 
        textAlign: "center",
        background: "var(--bg-surface)",
        border: "1px dashed var(--border-medium)",
        borderRadius: "var(--radius-lg)"
      }} 
      role="status"
    >
      <div 
        style={{ 
          width: "48px", 
          height: "48px", 
          borderRadius: "var(--radius-md)", 
          background: "var(--bg-surface-elevated)", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          color: "var(--text-muted)", 
          marginBottom: "16px" 
        }}
      >
        <Inbox size={24} />
      </div>
      <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>
        {title}
      </h3>
      {description && (
        <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)", maxWidth: "420px", marginBottom: "16px" }}>
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}

export function ErrorState({ title = "Unable to load information", detail, onRetry }) {
  return (
    <div 
      style={{ 
        background: "rgba(244, 63, 94, 0.1)", 
        border: "1px solid rgba(244, 63, 94, 0.3)", 
        borderRadius: "var(--radius-md)", 
        padding: "16px 20px", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between", 
        gap: "16px",
        marginBottom: "20px" 
      }} 
      role="alert"
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <AlertCircle size={20} style={{ color: "var(--accent-rose)", flexShrink: 0 }} />
        <div>
          <strong style={{ fontSize: "0.88rem", color: "#FDA4AF", display: "block" }}>{title}</strong>
          {detail && <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{detail}</span>}
        </div>
      </div>
      {onRetry && (
        <button className="btn btn-secondary btn-small" type="button" onClick={onRetry}>
          <RotateCw size={13} /> Try Again
        </button>
      )}
    </div>
  );
}

export function LoadingSkeleton({ rows = 4 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }} aria-label="Loading content" role="status">
      {Array.from({ length: rows }, (_, index) => (
        <div 
          key={index} 
          style={{ 
            height: "56px", 
            background: "linear-gradient(90deg, var(--bg-surface) 25%, var(--bg-surface-elevated) 50%, var(--bg-surface) 75%)", 
            backgroundSize: "200% 100%",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
            animation: "shimmer 1.8s infinite" 
          }} 
        />
      ))}
    </div>
  );
}