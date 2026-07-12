import React, { useState } from "react";

export default function Admin({ user, state, onUpdateState }) {
  const [verificationResult, setVerificationResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyingBlock, setVerifyingBlock] = useState(null);

  const handleVerifyLedger = async () => {
    setIsVerifying(true);
    setVerificationResult(null);
    setVerifyingBlock(0);
    try {
      const res = await fetch("/api/audit/verify", {
        headers: { "x-user-role": user.role, "x-user-emp": user.employeeId }
      });
      const data = await res.json();
      
      // Step-by-step animation
      const totalBlocks = state.auditTrail.length;
      let currentBlock = 0;
      
      const animateVerification = setInterval(() => {
        if (currentBlock >= totalBlocks || (!data.verified && currentBlock > data.brokenIndex)) {
          clearInterval(animateVerification);
          setVerificationResult(data);
          setIsVerifying(false);
          setVerifyingBlock(null);
        } else {
          setVerifyingBlock(currentBlock);
          currentBlock++;
        }
      }, 150);
    } catch (err) {
      setVerificationResult({ verified: false, error: err.message });
      setIsVerifying(false);
      setVerifyingBlock(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Administration & Security</h2>
          <p>System configuration, access control, and cryptographic audit ledger</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header" style={{ marginBottom: 0 }}>
            <h3 className="card-title">Cryptographically Chained Audit Ledger</h3>
            <button className="btn btn-secondary btn-sm" onClick={handleVerifyLedger} disabled={isVerifying}>
              {isVerifying ? `Verifying Block BLK-${(verifyingBlock || 0).toString().padStart(4, '0')}...` : "Verify Ledger Integrity"}
            </button>
          </div>
          
          {verificationResult && !isVerifying && (
            <div style={{ marginTop: "1rem", padding: "1rem", borderRadius: "var(--radius-sm)", backgroundColor: verificationResult.verified ? "var(--success-bg)" : "var(--danger-bg)", borderLeft: `4px solid ${verificationResult.verified ? 'var(--success)' : 'var(--danger)'}` }} className="animated-fade-in">
              <div style={{ fontWeight: 600, color: verificationResult.verified ? "var(--success)" : "var(--danger)" }}>
                {verificationResult.verified ? "✅ Ledger Integrity Verified" : "❌ Integrity Failure Detected"}
              </div>
              <div style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                {verificationResult.verified 
                  ? `Cryptographic hash chain is intact. ${verificationResult.validCount} sequence blocks verified.` 
                  : `Hash mismatch at sequence index ${verificationResult.brokenIndex}. Data tampering detected.`}
              </div>
            </div>
          )}

          <div className="table-container" style={{ marginTop: "1.5rem" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sequence Block</th>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Cryptographic Hash</th>
                </tr>
              </thead>
              <tbody>
                {state.auditTrail.slice().reverse().map((aud, index) => {
                  const actualIndex = state.auditTrail.length - 1 - index;
                  const isCompromised = verificationResult && !verificationResult.verified && actualIndex >= verificationResult.brokenIndex;
                  const isBeingVerified = isVerifying && actualIndex === verifyingBlock;
                  const isAlreadyVerified = isVerifying && actualIndex < verifyingBlock;
                  
                  let rowBg = undefined;
                  if (isCompromised) rowBg = "var(--danger-bg)";
                  else if (isBeingVerified) rowBg = "rgba(59, 130, 246, 0.2)"; // Pulse highlight
                  else if (isAlreadyVerified) rowBg = "var(--success-bg)";
                  
                  return (
                    <tr key={aud.id} style={{ backgroundColor: rowBg, transition: "background-color 0.3s ease" }}>
                      <td className="text-secondary font-semibold" style={{ fontSize: "0.75rem" }}>
                        BLK-{actualIndex.toString().padStart(4, '0')}
                        {isCompromised && <span style={{ color: "var(--danger)", marginLeft: "8px" }}>⚠️ BROKEN</span>}
                        {isBeingVerified && <span style={{ color: "var(--info)", marginLeft: "8px", animation: "pulse 1s infinite" }}>🔄 VERIFYING</span>}
                        {isAlreadyVerified && <span style={{ color: "var(--success)", marginLeft: "8px" }}>✓</span>}
                        {verificationResult?.verified && <span style={{ color: "var(--success)", marginLeft: "8px" }}>✓</span>}
                      </td>
                      <td className="text-secondary" style={{ fontSize: "0.8rem" }}>{new Date(aud.timestamp).toLocaleString()}</td>
                      <td className="font-semibold">{aud.actor}</td>
                      <td>
                        <div>{aud.action}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "2px", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis" }}>{aud.details}</div>
                      </td>
                      <td>
                        <div className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-secondary)" }} title={aud.hash}>
                          {aud.hash ? `${aud.hash.substring(0, 16)}...` : 'LEGACY_UNHASHED'}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <h3 className="card-title">Access Control</h3>
            <p className="text-secondary" style={{ fontSize: "0.875rem", marginBottom: "1rem" }}>
              Active roles and system permissions mapping.
            </p>
            <div className="detail-row"><span className="detail-label">System Administrator</span><span className="badge badge-danger">Full Access</span></div>
            <div className="detail-row"><span className="detail-label">Fleet Manager</span><span className="badge badge-warning">Assets & Maintenance</span></div>
            <div className="detail-row"><span className="detail-label">Dispatcher</span><span className="badge badge-info">Routing & Ops</span></div>
            <div className="detail-row"><span className="detail-label">Financial Analyst</span><span className="badge badge-success">Ledgers & ROI</span></div>
            <div className="detail-row"><span className="detail-label">Safety Officer</span><span className="badge badge-neutral">Personnel & Compliance</span></div>
          </div>
          
          <div className="card">
            <h3 className="card-title">System Health</h3>
            <div className="detail-row"><span className="detail-label">Backend Database</span><span className="detail-value text-success">Online (In-Memory)</span></div>
            <div className="detail-row"><span className="detail-label">Cryptographic Engine</span><span className="detail-value text-success">Active (SHA-256)</span></div>
            <div className="detail-row"><span className="detail-label">API Gateway</span><span className="detail-value text-success">Responsive</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
