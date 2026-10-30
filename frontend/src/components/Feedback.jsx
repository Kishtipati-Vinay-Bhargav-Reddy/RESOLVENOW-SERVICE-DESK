import Icon from "./Icon";

export function PageHeader({ eyebrow, title, description, actions, className = "" }) {
  return <div className={`page-header ${className}`}>
    <div className="page-header-copy">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      {description && <p className="page-description">{description}</p>}
    </div>
    {actions && <div className="page-header-actions">{actions}</div>}
  </div>;
}

export function EmptyState({ title, description, action, icon = "complaints" }) {
  return <div className="empty-state" role="status">
    <span className="empty-state-icon"><Icon name={icon} size={23} /></span>
    <h3>{title}</h3>
    {description && <p>{description}</p>}
    {action && <div className="empty-state-action">{action}</div>}
  </div>;
}

export function ErrorState({ title = "Unable to load this information.", detail, onRetry }) {
  return <div className="error-state" role="alert">
    <span className="error-state-icon"><Icon name="close" size={20} /></span>
    <div><strong>{title}</strong>{detail && <p>{detail}</p>}</div>
    {onRetry && <button className="button button-secondary button-small" type="button" onClick={onRetry}>Try again</button>}
  </div>;
}

export function LoadingSkeleton({ rows = 4, variant = "row" }) {
  return <div className={`skeleton-stack skeleton-${variant}`} aria-label="Loading" role="status">
    {Array.from({ length: rows }, (_, index) => <div className="skeleton-row" key={index}>
      <span className="skeleton-block skeleton-short" />
      <span className="skeleton-block" />
      <span className="skeleton-block skeleton-medium" />
    </div>)}
  </div>;
}