import React, { useState } from 'react';
import { 
  Share2, 
  Copy, 
  Check, 
  X, 
  Download, 
  FileJson, 
  FileText, 
  Link2,
  CheckCircle
} from 'lucide-react';

export function ShareModal({ 
  isOpen, 
  onClose, 
  code, 
  language, 
  analysis, 
  testCases = [] 
}) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);

  if (!isOpen) return null;

  // Generate Base64 share hash
  const workspaceState = {
    c: code,
    l: language,
    t: Date.now()
  };

  let shareUrl = window.location.href.split('#')[0];
  try {
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(workspaceState))));
    shareUrl = `${shareUrl}#share=${encoded}`;
  } catch (err) {
    console.error('Failed to encode share link', err);
  }

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadJsonReport = () => {
    const reportData = {
      platform: 'DevPulse Studio',
      generatedAt: new Date().toISOString(),
      language,
      analysis: {
        score: analysis?.score || 100,
        grade: analysis?.grade || 'A',
        securityScore: analysis?.securityScore || 100,
        performanceScore: analysis?.performanceScore || 100,
        maintainabilityScore: analysis?.maintainabilityScore || 100,
        complexity: analysis?.complexity || null,
        findings: analysis?.findings || []
      },
      testCasesCount: testCases.length,
      sourceCode: code
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devpulse-audit-report-${language}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Share2 size={16} color="var(--accent-primary-light)" />
            <span>Share & Export Workspace</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ gap: '14px' }}>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0 }}>
            Share this exact code state, review findings, and test suite with colleagues via instant URL or export audit reports.
          </p>

          {/* Shareable Link Box */}
          <div className="form-group">
            <label className="form-label">Instant Workspace Share Link</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                readOnly
                className="form-input"
                style={{ fontSize: '11.5px', fontFamily: 'var(--font-mono)' }}
                value={shareUrl}
              />
              <button 
                className="btn btn-primary"
                style={{ flexShrink: 0 }}
                onClick={handleCopyLink}
              >
                {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedLink ? 'Copied Link' : 'Copy Link'}</span>
              </button>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
              Anyone opening this link will immediately load this code & language into their DevPulse editor.
            </span>
          </div>

          {/* Export Options Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
            <div 
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                <FileJson size={15} color="var(--accent-cyan)" />
                <span>JSON Audit Report</span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                Machine-readable export including metrics, grade, OWASP findings, and Big-O profile.
              </p>
              <button 
                className="btn btn-secondary btn-sm"
                style={{ marginTop: 'auto' }}
                onClick={handleDownloadJsonReport}
              >
                <Download size={12} />
                <span>Download .JSON</span>
              </button>
            </div>

            <div 
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                <CheckCircle size={15} color="var(--accent-emerald)" />
                <span>Current Scorecard</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
                Score: <strong style={{ color: 'var(--text-primary)' }}>{analysis?.score || 100}/100 ({analysis?.grade || 'A'})</strong>
                <br />
                Findings: <strong>{analysis?.findings?.length || 0} issues</strong>
              </div>
              <span style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: 'auto' }}>
                All findings serialized and ready for CI/CD or PR attach.
              </span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
