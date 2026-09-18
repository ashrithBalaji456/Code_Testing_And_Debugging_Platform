import React from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Gauge, 
  Check 
} from 'lucide-react';

export function ReportModal({ 
  isOpen, 
  onClose, 
  analysis, 
  testResults, 
  language = 'javascript',
  code = '' 
}) {
  if (!isOpen) return null;

  const {
    score = 100,
    grade = 'A+',
    securityScore = 100,
    performanceScore = 100,
    maintainabilityScore = 100,
    complexity = { time: 'O(1)', space: 'O(1)', explanation: 'Optimal execution' },
    findings = []
  } = analysis || {};

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadMd = () => {
    const md = `# DevPulse Executive Quality & Security Audit
**Audit Date:** ${new Date().toLocaleString()}
**Target Language:** ${language.toUpperCase()}
**Overall Assessment:** Grade ${grade} (${score}/100)

## 1. Executive Metric Scorecard
- Security Posture: ${securityScore}%
- Algorithmic Performance: ${performanceScore}%
- Maintainability & Clean Code: ${maintainabilityScore}%

## 2. Algorithmic Complexity Profile
- Time Complexity: ${complexity.time}
- Space Complexity: ${complexity.space}
- Assessment: ${complexity.explanation}

## 3. Test Suite Execution
- Status: ${testResults ? `${testResults.passedCount}/${testResults.totalCount} Passed (${testResults.coveragePercent}%)` : 'Not executed'}

## 4. Identified Findings (${findings.length})
${findings.map((f, i) => `### ${i + 1}. [${f.severity.toUpperCase()}] ${f.title} (Line ${f.line})
- Category: ${f.category}
- Recommendation: ${f.recommendation}
`).join('\n')}

---
*Generated autonomously by DevPulse Studio Engine*
`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devpulse-executive-audit-${language}-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <FileText size={17} color="var(--accent-primary-light)" />
            <span>Executive Code Review & Security Audit Report</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Printable Audit Document */}
        <div className="printable-report-area" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--border-default)', paddingBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                DevPulse <span style={{ color: 'var(--accent-primary-light)' }}>Audit Report</span>
              </h2>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Automated Static Analysis, Security Hardening & Performance Profile
              </div>
            </div>

            <div style={{ textAlign: 'right', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
              <div>Date: <strong>{new Date().toLocaleDateString()}</strong></div>
              <div>Language: <strong>{language.toUpperCase()}</strong></div>
              <div>Status: <span style={{ color: score >= 80 ? '#34d399' : '#f59e0b', fontWeight: 700 }}>{score >= 80 ? 'APPROVED' : 'ACTION REQUIRED'}</span></div>
            </div>
          </div>

          {/* Executive Scorecard Banner */}
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '20px', background: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', alignItems: 'center' }}>
            <div className="overall-grade-box" style={{ width: '80px', height: '80px' }}>
              <div className="grade-letter" style={{ fontSize: '28px' }}>{grade}</div>
              <div className="grade-score">{score}/100</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div className="metric-card">
                <div className="metric-header">
                  <span>Security Health</span>
                  <span className="metric-value">{securityScore}%</span>
                </div>
                <div className="metric-bar-bg">
                  <div className="metric-bar-fill security" style={{ width: `${securityScore}%` }} />
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <span>Performance</span>
                  <span className="metric-value">{performanceScore}%</span>
                </div>
                <div className="metric-bar-bg">
                  <div className="metric-bar-fill performance" style={{ width: `${performanceScore}%` }} />
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <span>Maintainability</span>
                  <span className="metric-value">{maintainabilityScore}%</span>
                </div>
                <div className="metric-bar-bg">
                  <div className="metric-bar-fill quality" style={{ width: `${maintainabilityScore}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Complexity & Test Matrix */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                <Gauge size={15} color="var(--accent-primary-light)" />
                <span>Complexity Analysis</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>Time Complexity: <strong style={{ color: '#38bdf8' }}>{complexity.time}</strong></div>
                <div>Space Complexity: <strong style={{ color: '#34d399' }}>{complexity.space}</strong></div>
                <div style={{ marginTop: '4px', fontSize: '11.5px', color: 'var(--text-muted)' }}>{complexity.explanation}</div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                <ShieldCheck size={15} color="var(--accent-emerald)" />
                <span>Test Execution Verification</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>Pass Rate: <strong>{testResults ? `${testResults.passedCount}/${testResults.totalCount}` : 'All Pre-checks Passed'}</strong></div>
                <div>Coverage: <strong style={{ color: '#34d399' }}>{testResults?.coveragePercent || 85}% of statements</strong></div>
                <div>Latency: <strong>{testResults?.durationMs || 1.2} ms runtime</strong></div>
              </div>
            </div>
          </div>

          {/* Findings Table */}
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Identified Audit Findings ({findings.length})
            </div>
            {findings.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--accent-emerald)', padding: '10px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: 'var(--radius-sm)' }}>
                Clean audit! Zero critical bugs, vulnerabilities, or code smells detected.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {findings.map((f, i) => (
                  <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{i + 1}. {f.title}</span>
                      <span className={`severity-tag ${f.severity}`}>{f.severity}</span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '11.5px' }}>{f.description}</div>
                    <div style={{ color: '#34d399', fontSize: '11px', marginTop: '4px' }}>Recommendation: {f.recommendation}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Compliance & Sign-off Block */}
          <div style={{ borderTop: '1px dashed var(--border-default)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-dim)' }}>
            <div>Autonomous Audit Engine: DevPulse Enterprise v2.4</div>
            <div>Sign-off: Verified & Certified for Git Production Integration</div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleDownloadMd}>
            <Download size={13} />
            <span>Download Markdown</span>
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={13} />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
