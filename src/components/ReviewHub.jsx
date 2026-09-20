import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  Wrench, 
  Download, 
  Copy, 
  Check,
  Sparkles,
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { ComplexityProfiler } from './ComplexityProfiler';

export function ReviewHub({
  analysis,
  onApplyFix,
  onApplyAllFixes,
  onLineClick
}) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [copiedReport, setCopiedReport] = useState(false);

  const {
    score = 100,
    grade = 'A+',
    securityScore = 100,
    performanceScore = 100,
    maintainabilityScore = 100,
    findings = []
  } = analysis || {};

  const filteredFindings = findings.filter(item => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'critical') return item.severity === 'critical';
    if (activeFilter === 'warning') return item.severity === 'warning';
    if (activeFilter === 'info') return item.severity === 'info';
    return true;
  });

  const handleExportMarkdown = () => {
    const md = `# DevPulse Code Review Report
**Generated:** ${new Date().toLocaleString()}
**Overall Grade:** ${grade} (${score}/100)
- **Security Health:** ${securityScore}%
- **Performance Efficiency:** ${performanceScore}%
- **Maintainability & Clean Code:** ${maintainabilityScore}%

## Identified Issues & Recommendations (${findings.length} findings)

${findings.map((f, i) => `### ${i + 1}. [${f.severity.toUpperCase()}] ${f.title} (Line ${f.line})
- **Category:** ${f.category}
- **Description:** ${f.description}
- **Original Code:** \`${f.originalCode}\`
- **Recommendation:** ${f.recommendation}
`).join('\n')}
`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code_review_report_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyReport = async () => {
    const summary = `DevPulse Review: Grade ${grade} (${score}/100). Findings: ${findings.length} issues identified.`;
    await navigator.clipboard.writeText(summary);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  return (
    <div className="studio-content-area">
      {/* Top Scorecard Banner */}
      <div className="scorecard-banner">
        <div className="overall-grade-box">
          <span className="grade-letter">{grade}</span>
          <span className="grade-score">{score} / 100</span>
        </div>

        <div className="metrics-breakdown">
          {/* Security */}
          <div className="metric-card">
            <div className="metric-header">
              <span>Security</span>
              <span className="metric-value">{securityScore}%</span>
            </div>
            <div className="metric-bar-bg">
              <div 
                className="metric-bar-fill security" 
                style={{ width: `${securityScore}%` }} 
              />
            </div>
          </div>

          {/* Performance */}
          <div className="metric-card">
            <div className="metric-header">
              <span>Performance</span>
              <span className="metric-value">{performanceScore}%</span>
            </div>
            <div className="metric-bar-bg">
              <div 
                className="metric-bar-fill performance" 
                style={{ width: `${performanceScore}%` }} 
              />
            </div>
          </div>

          {/* Maintainability */}
          <div className="metric-card">
            <div className="metric-header">
              <span>Quality</span>
              <span className="metric-value">{maintainabilityScore}%</span>
            </div>
            <div className="metric-bar-bg">
              <div 
                className="metric-bar-fill quality" 
                style={{ width: `${maintainabilityScore}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Algorithmic Complexity Profiler Banner */}
      <ComplexityProfiler 
        complexity={analysis?.complexity} 
        onHighlightLine={onLineClick} 
      />

      {/* Filter and Export Action Bar */}
      <div className="review-filters">
        <div className="filter-pills">
          <button 
            className={`filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All ({findings.length})
          </button>
          <button 
            className={`filter-pill ${activeFilter === 'critical' ? 'active' : ''}`}
            onClick={() => setActiveFilter('critical')}
          >
            Critical ({findings.filter(f => f.severity === 'critical').length})
          </button>
          <button 
            className={`filter-pill ${activeFilter === 'warning' ? 'active' : ''}`}
            onClick={() => setActiveFilter('warning')}
          >
            Warnings ({findings.filter(f => f.severity === 'warning').length})
          </button>
          <button 
            className={`filter-pill ${activeFilter === 'info' ? 'active' : ''}`}
            onClick={() => setActiveFilter('info')}
          >
            Info ({findings.filter(f => f.severity === 'info').length})
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {findings.filter(f => f.suggestedFix).length > 0 && onApplyAllFixes && (
            <button 
              id="btn-apply-all-fixes"
              className="btn btn-primary btn-sm"
              onClick={onApplyAllFixes}
              title={`Apply all ${findings.filter(f => f.suggestedFix).length} automated patches at once`}
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                borderColor: '#10b981',
                color: '#ffffff',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                fontWeight: 600
              }}
            >
              <Sparkles size={13} />
              <span>Apply All Fixes ({findings.filter(f => f.suggestedFix).length})</span>
            </button>
          )}

          <button 
            id="btn-export-report"
            className="btn btn-secondary btn-sm"
            onClick={handleExportMarkdown}
            title="Download full Markdown Review Report"
          >
            <Download size={13} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Findings List */}
      <div className="findings-container">
        {filteredFindings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={36} color="var(--accent-emerald)" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Clean Code Audit</h4>
            <p style={{ fontSize: '13px' }}>No issues found matching this filter criteria.</p>
          </div>
        ) : (
          filteredFindings.map((finding) => (
            <div 
              key={finding.id} 
              className={`finding-card severity-${finding.severity}`}
              onClick={() => onLineClick && onLineClick(finding.line)}
            >
              <div className="finding-top">
                <div className="finding-title-group">
                  <span className={`severity-tag ${finding.severity}`}>
                    {finding.severity}
                  </span>
                  <span className="finding-title">{finding.title}</span>
                </div>
                <span className="finding-line-badge">Line {finding.line}</span>
              </div>

              <p className="finding-desc">{finding.description}</p>

              {finding.suggestedFix && (
                <div className="finding-fix-preview">
                  <span className="diff-del">- {finding.originalCode}</span>
                  <span className="diff-add">+ {finding.suggestedFix}</span>
                </div>
              )}

              <div className="finding-footer">
                <span className="category-tag">
                  <ShieldAlert size={13} />
                  {finding.category}
                </span>

                {finding.suggestedFix ? (
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onApplyFix(finding);
                    }}
                    title="Automatically patch this code line"
                    style={{ fontSize: '11px', padding: '4px 8px' }}
                  >
                    <Wrench size={12} color="var(--accent-primary-light)" />
                    <span>Apply Fix</span>
                  </button>
                ) : (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Non-destructive advice
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
