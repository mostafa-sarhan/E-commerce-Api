import { Link } from "react-router-dom";

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className="home-head-arrow"
    >
      <path
        d="M5 12h14M13 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SectionHeader({
  kicker,
  title,
  subtitle,
  actionLabel,
  actionHref,
}) {
  return (
    <div className="home-head">
      <div className="home-head-text">
        {kicker ? <p className="home-head-kicker">{kicker}</p> : null}

        <h2 className="home-head-title">{title}</h2>

        {subtitle ? <p className="home-head-subtitle">{subtitle}</p> : null}
      </div>

      {actionLabel ? (
        <Link className="home-head-action" to={actionHref}>
          {actionLabel}
          <ArrowIcon />
        </Link>
      ) : null}
    </div>
  );
}
