import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Wrench, 
  Download, 
  ExternalLink, 
  Sparkles, 
  FileCode, 
  Layers, 
  Lock,
  Flame,
  ArrowRight
} from 'lucide-react';
import { 
  scanCodeForVulnerabilities, 
  applySecurityPatch, 
  applyAllSecurityPatches, 
  exportToSarif 
} from '../services/securityScanner';

export function SecurityScannerModal({ 
  isOpen, 
  onClose, 
  code = '', 
  language = 'javascript',
  onApplyCode,
  onHighlightLine 
}) {
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'critical' | 'high' | 'medium'
  const [patchedIds, setPatchedIds] = useState(new Set());

  const audit = useMemo(() => {
    return scanCodeForVulnerabilities(code, language);
  }, [code, language]);

  if (!isOpen) return null;

  const filteredVulns = audit.vulnerabilities.filter(v => {
    if (activeFilter === 'all') return true;
    return v.severity === activeFilter;
  });

  const handlePatchSingle = (vuln) => {
    const updated = applySecurityPatch(code, vuln);
    if (onApplyCode) {
      onApplyCode(updated);
    }
    setPatchedIds(prev => new Set([...prev, vuln.id]));
  };

  const handlePatchAll = () => {
    const updated = applyAllSecurityPatches(code, audit.vulnerabilities);
    if (onApplyCode) {
      onApplyCode(updated);
    }
    setPatchedIds(new Set(audit.vulnerabilities.map(v => v.id)));
  };

  const handleExportSarif = () => {
    const sarif = exportToSarif(audit, `solution.${language === 'python' ? 'py' : (language === 'java' ? 'java' : (language === 'cpp' ? 'cpp' : 'js'))}`);
    const blob = new Blob([JSON.stringify(sarif, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sast_security_audit_${Date.now()}.sarif`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getGradeColor = (grade) => {
    if (grade === 'A+' || grade === 'A') return '#10b981';
    if (grade === 'B') return '#38bdf8';
    if (grade === 'C') return '#f59e0b';
    return '#f43f5e';
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '820px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-default)', paddingBottom: '14px' }}>
          <div className="modal-title">
            <div style={{ 
              width: '34px', 
              height: '34px', 
              borderRadius: '8px', 
              background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.2), rgba(245, 158, 11, 0.2))',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fb7185'
            }}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Deep Security & Anti-Pattern Vulnerability Scanner
                </span>
                <span className="severity-tag critical" style={{ fontSize: '10px' }}>
                  SAST / OWASP
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                Static Application Security Testing (SAST) auditing CWEs, CVSS 3.1 threat severity, and 1-click auto-patching.
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Posture Score Banner */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            {/* Grade Dial */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: `radial-gradient(circle, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.9) 100%)`,
                border: `3px solid ${getGradeColor(audit.grade)}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 15px ${getGradeColor(audit.grade)}33`
              }}>
                <span style={{ fontSize: '20px', fontWeight: 800, color: getGradeColor(audit.grade), lineHeight: 1 }}>
                  {audit.grade}
                </span>
                <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '2px' }}>
                  Rating
                </span>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Security Posture Score: {audit.score}/100
                  </h3>
                  {audit.cvssMax > 0 && (
                    <span className="severity-tag critical" style={{ fontSize: '11px', fontWeight: 700 }}>
                      Max CVSS {audit.cvssMax}
                    </span>
                  )}
                </div>
                <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {audit.vulnerabilities.length === 0
                    ? 'Clean security audit. No high-risk OWASP or CWE anti-patterns detected.'
                    : `Detected ${audit.vulnerabilities.length} active vulnerabilities. Patch high-risk items below.`}
                </p>
              </div>
            </div>

            {/* Severity Breakdown Counter */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#fb7185' }}>{audit.summary.critical}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Critical</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#f59e0b' }}>{audit.summary.high}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>High</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#38bdf8' }}>{audit.summary.medium}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Medium</div>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button 
                className={`filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActiveFilter('all')}
              >
                All ({audit.vulnerabilities.length})
              </button>
              <button 
                className={`filter-pill ${activeFilter === 'critical' ? 'active' : ''}`}
                onClick={() => setActiveFilter('critical')}
              >
                Critical ({audit.summary.critical})
              </button>
              <button 
                className={`filter-pill ${activeFilter === 'high' ? 'active' : ''}`}
                onClick={() => setActiveFilter('high')}
              >
                High ({audit.summary.high})
              </button>
              <button 
                className={`filter-pill ${activeFilter === 'medium' ? 'active' : ''}`}
                onClick={() => setActiveFilter('medium')}
              >
                Medium ({audit.summary.medium})
              </button>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {audit.vulnerabilities.length > 0 && (
                <button
                  id="btn-patch-all-security"
                  className="btn btn-success btn-sm"
                  onClick={handlePatchAll}
                  style={{
                    fontWeight: 600,
                    padding: '6px 14px',
                    gap: '6px'
                  }}
                >
                  <Wrench size={13} />
                  <span>Auto-Patch All ({audit.vulnerabilities.length})</span>
                </button>
              )}

              <button
                className="btn btn-secondary btn-sm"
                onClick={handleExportSarif}
                title="Export GitHub-compatible SARIF Security Report"
                style={{ padding: '6px 12px', gap: '6px' }}
              >
                <Download size={13} />
                <span>Export SARIF</span>
              </button>
            </div>
          </div>

          {/* Vulnerabilities List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredVulns.length === 0 ? (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                background: 'var(--bg-card)',
                border: '1px dashed var(--border-default)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px'
              }}>
                <ShieldCheck size={38} color="#10b981" />
                <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)' }}>
                  No Vulnerabilities in this Category
                </h4>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                  Your code adheres to secure development guidelines for selected filters.
                </p>
              </div>
            ) : (
              filteredVulns.map((vuln) => {
                const isPatched = patchedIds.has(vuln.id);

                return (
                  <div 
                    key={vuln.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: `1px solid ${vuln.severity === 'critical' ? 'rgba(244, 63, 94, 0.3)' : 'var(--border-default)'}`,
                      borderLeft: `4px solid ${vuln.severity === 'critical' ? '#f43f5e' : (vuln.severity === 'high' ? '#f59e0b' : '#38bdf8')}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '14px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    {/* Vuln Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className={`severity-tag ${vuln.severity}`}>
                          {vuln.severity.toUpperCase()}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                          {vuln.cwe}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {vuln.title}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          CVSS: <strong style={{ color: vuln.cvss >= 9 ? '#fb7185' : '#f59e0b' }}>{vuln.cvss}</strong>
                        </span>

                        <button
                          className="hotspot-badge"
                          onClick={() => onHighlightLine && onHighlightLine(vuln.line)}
                          title={`Inspect Line ${vuln.line} in Editor`}
                          style={{ fontSize: '11px' }}
                        >
                          Line {vuln.line}
                        </button>
                      </div>
                    </div>

                    {/* Threat & Attack Scenario */}
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      <strong>Threat Scenario:</strong> {vuln.attackScenario}
                    </div>

                    {/* Code Snippet & Patch Preview */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{
                        background: 'rgba(244, 63, 94, 0.08)',
                        border: '1px solid rgba(244, 63, 94, 0.25)',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        color: '#fda4af'
                      }}>
                        <span style={{ color: '#f43f5e', marginRight: '6px', fontWeight: 700 }}>-</span>
                        {vuln.codeSnippet}
                      </div>

                      <div style={{
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        color: '#6ee7b7'
                      }}>
                        <span style={{ color: '#10b981', marginRight: '6px', fontWeight: 700 }}>+</span>
                        {vuln.suggestedPatch}
                      </div>
                    </div>

                    {/* Footer with 1-Click Patch */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        OWASP Category: <strong>{vuln.owasp}</strong>
                      </span>

                      <button
                        className="btn btn-sm"
                        onClick={() => handlePatchSingle(vuln)}
                        disabled={isPatched}
                        style={{
                          background: isPatched ? 'rgba(16, 185, 129, 0.15)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: '#ffffff',
                          borderColor: '#10b981',
                          fontWeight: 600,
                          fontSize: '11.5px',
                          padding: '4px 12px',
                          gap: '6px'
                        }}
                      >
                        {isPatched ? (
                          <>
                            <CheckCircle2 size={12} color="#34d399" />
                            <span>Patch Applied</span>
                          </>
                        ) : (
                          <>
                            <Wrench size={12} />
                            <span>Apply Security Patch</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-default)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            Real-time Static Application Security Testing (SAST)
          </span>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
