import React, { useState } from "react";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const demoAccounts = [
    { label: "System Administrator", email: "admin@transitops.com" },
    { label: "Fleet Manager", email: "fleet.manager@transitops.com" },
    { label: "Dispatcher", email: "dispatcher@transitops.com" },
    { label: "Safety Officer", email: "safety.officer@transitops.com" },
    { label: "Financial Analyst", email: "finance@transitops.com" },
    { label: "Logistics Client", email: "client@transitops.com" }
  ];

  const handleDemoSelect = (e) => {
    const selectedEmail = e.target.value;
    if (selectedEmail) {
      setEmail(selectedEmail);
      setPassword("demo-password-123");
    } else {
      setEmail("");
      setPassword("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrEmp: email, password })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed.");
      }
      
      onLogin(data.user, data.token);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", width: "100vw", minHeight: "100vh", overflow: "hidden", background: "var(--bg-primary)" }}>
      
      {/* LEFT PANEL: Living Transport Network & Branding */}
      <div style={{ 
        flex: "1 1 50%", 
        minWidth: "320px",
        position: "relative",
        background: "var(--bg-secondary)", 
        display: "flex", 
        flexDirection: "column", 
        justifyContent: "center",
        padding: "clamp(2rem, 5vw, 4rem)",
        overflow: "hidden"
      }}>
        
        {/* Abstract SVG Transport Network Background */}
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0, opacity: 0.6, pointerEvents: "none" }}>
          <svg width="100%" height="100%" viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
                <stop offset="50%" stopColor="var(--accent-base)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
              </linearGradient>
              <linearGradient id="routeGradAlt" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
                <stop offset="50%" stopColor="var(--info-base)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
              </linearGradient>
            </defs>

            {/* Base Routes */}
            <path className="route-path" d="M -100 200 C 200 200, 300 400, 500 400 S 700 600, 900 600" fill="none" stroke="url(#routeGrad)" strokeWidth="2" strokeDasharray="1000" strokeDashoffset="1000" style={{ animation: "drawRoute 3s ease-out forwards" }} />
            <path className="route-path" d="M 100 -100 C 100 200, 400 300, 400 500 S 600 700, 600 900" fill="none" stroke="url(#routeGradAlt)" strokeWidth="2" strokeDasharray="1000" strokeDashoffset="1000" style={{ animation: "drawRoute 4s ease-out 0.5s forwards" }} />
            <path className="route-path" d="M 800 100 C 600 200, 500 400, 200 500 S -100 600, -200 600" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="1000" strokeDashoffset="1000" style={{ animation: "drawRoute 5s ease-out 1s forwards" }} />

            {/* Nodes */}
            <circle className="node-marker" cx="300" cy="310" r="4" fill="var(--text-secondary)" style={{ animation: "nodePulse 4s infinite 1s" }} />
            <circle className="node-marker" cx="500" cy="400" r="6" fill="var(--accent-base)" style={{ animation: "nodePulse 3s infinite 0s" }} />
            <circle className="node-marker" cx="400" cy="500" r="5" fill="var(--info-base)" style={{ animation: "nodePulse 5s infinite 2s" }} />
            <circle className="node-marker" cx="200" cy="500" r="4" fill="var(--danger-base)" style={{ animation: "nodeWarningPulse 2s infinite" }} />
            
            {/* Moving Signals */}
            <path className="signal-marker" d="M -100 200 C 200 200, 300 400, 500 400 S 700 600, 900 600" fill="none" stroke="var(--text-main)" strokeWidth="4" strokeLinecap="round" strokeDasharray="10 990" strokeDashoffset="1000" style={{ animation: "signalMove 8s linear infinite" }} />
            <path className="signal-marker" d="M 100 -100 C 100 200, 400 300, 400 500 S 600 700, 600 900" fill="none" stroke="var(--info-hover)" strokeWidth="3" strokeLinecap="round" strokeDasharray="15 985" strokeDashoffset="1000" style={{ animation: "signalMove 12s linear infinite 2s" }} />
          </svg>
        </div>

        <div style={{ zIndex: 2, position: "relative" }}>
          {/* Brand & Headline */}
          <div className="hero-animate" style={{ animation: "revealHero 1s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}>
            <div className="brand" style={{ fontSize: "1.5rem", fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: "2rem", color: "var(--text-main)" }}>
              TRANSIT<span style={{ color: "var(--accent-base)" }}>OPS</span>
              <span style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, marginTop: "4px", letterSpacing: "normal" }}>Transit Command Intelligence</span>
            </div>
            
            <h1 style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontFamily: "var(--font-display)", fontWeight: 700, lineHeight: 1.1, color: "var(--text-main)", marginBottom: "1.5rem", maxWidth: "600px", letterSpacing: "-0.02em" }}>
              Move with complete clarity.
            </h1>
            
            <p style={{ fontSize: "1.1rem", color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: "500px", marginBottom: "2.5rem" }}>
              Intelligent fleet operations, dispatch, maintenance, compliance, financial insight, and cryptographically verifiable history—all in one command system.
            </p>
            
            {/* Capability Strip */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-tertiary)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              <span>SMART ASSIGN</span> <span>•</span>
              <span>MAINTENANCE INTELLIGENCE</span> <span>•</span>
              <span>COMPLIANCE AUTOPILOT</span> <span>•</span>
              <span>AUDIT INTEGRITY</span>
            </div>
          </div>
          
          {/* Overdrive Branding */}
          <div className="hero-animate" style={{ 
            animation: "revealHero 1s cubic-bezier(0.16, 1, 0.3, 1) 0.6s forwards", 
            position: "absolute", 
            bottom: "-3rem", 
            left: 0, 
            fontSize: "0.65rem", 
            color: "var(--text-tertiary)", 
            letterSpacing: "0.15em", 
            textTransform: "uppercase", 
            fontWeight: 500,
            opacity: 0
          }}>
            Engineered by Overdrive
          </div>
        </div>
        

      </div>

      {/* RIGHT PANEL: Auth Form */}
      <div style={{ 
        flex: "1 1 50%", 
        minWidth: "320px",
        display: "flex", 
        flexDirection: "column", 
        justifyContent: "center", 
        alignItems: "center",
        background: "var(--bg-primary)",
        padding: "4rem 2rem",
        animation: "revealHero 1s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards",
        opacity: 0,
        zIndex: 5
      }}>
        <div style={{ width: "100%", maxWidth: "380px" }}>
          <div style={{ marginBottom: "2.5rem" }}>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "0.5rem" }}>Access Command Workspace</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Authenticate to enter the transport network.</p>
          </div>

          {error && (
            <div className="inline-error" style={{ marginBottom: "1.5rem" }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Employee ID or Email</label>
              <input 
                type="text" 
                className="form-input" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@transitops.com"
                required 
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-input" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required 
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: "100%", marginTop: "1rem", padding: "0.85rem", fontSize: "1rem" }}
              disabled={loading}
            >
              {loading ? "Authenticating..." : "Sign In"}
            </button>
          </form>

          <div style={{ marginTop: "2.5rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border-subtle)" }}>
            <p style={{ fontSize: "0.8rem", color: "var(--text-tertiary)", marginBottom: "0.75rem" }}>Preview access (Simulated Role)</p>
            <select 
              className="form-select" 
              onChange={handleDemoSelect} 
              defaultValue=""
              style={{ fontSize: "0.85rem" }}
            >
              <option value="" disabled>Select Demo Role...</option>
              {demoAccounts.map(acc => (
                <option key={acc.label} value={acc.email}>{acc.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
