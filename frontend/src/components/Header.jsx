import "./Header.css"

export default function Header({ onClear, onLogout, user }) {
  return (
    <header className="header">
      <div className="hdr-left">
        <div className="logo-icon">&#9829;</div>
        <div>
          <h1 className="logo-name">Dr. Satish</h1>
          <span className="logo-sub">AI Voice Health Assistant</span>
        </div>
        <div className="badge-live"><span className="live-dot" />Live</div>
      </div>
      <div className="hdr-right">
        <span className="badge-model">Claude AI</span>
        {user && (
          <span style={{
            color: "#94a3b8", fontSize: "13px", marginRight: "4px"
          }}>
            {user.username}
          </span>
        )}
        <button className="clear-btn" onClick={onClear} title="Clear conversation">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
        </button>
        <button className="clear-btn" onClick={onLogout} title="Logout" style={{ marginLeft: "4px" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </header>
  )
}