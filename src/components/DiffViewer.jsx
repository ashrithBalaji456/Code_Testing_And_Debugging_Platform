import React from 'react';
import { Check, X, ArrowRight, ShieldCheck } from 'lucide-react';

export function DiffViewer({
  originalCode,
  fixedCode,
  onApplyFixedCode,
  onClose
}) {
  const origLines = originalCode.split('\n');
  const fixLines = (fixedCode || originalCode).split('\n');

  const maxLines = Math.max(origLines.length, fixLines.length);

  return (
    <div className="diff-panel-container">
      <div className="diff-header-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={16} color="var(--accent-emerald)" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Code Diff & Refactoring Comparison
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            id="btn-apply-diff-fixed"
            className="btn btn-success btn-sm"
            onClick={onApplyFixedCode}
            title="Replace editor code with the refactored, hardened code"
          >
            <Check size={14} />
            <span>Apply All Fixes</span>
          </button>

          <button 
            id="btn-close-diff"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            <X size={14} />
            <span>Close Diff</span>
          </button>
        </div>
      </div>

      <div className="diff-grid-split">
        {/* Left Side: Original Code */}
        <div className="diff-pane diff-pane-left">
          <div style={{ padding: '0 12px 6px', fontSize: '11px', color: '#f87171', fontWeight: 600, borderBottom: '1px solid var(--border-subtle)', marginBottom: '4px' }}>
            ORIGINAL / VULNERABLE CODE
          </div>
          {Array.from({ length: maxLines }).map((_, idx) => {
            const line = origLines[idx] !== undefined ? origLines[idx] : '';
            const fixedLine = fixLines[idx] !== undefined ? fixLines[idx] : '';
            const isDifferent = line !== fixedLine && origLines[idx] !== undefined;

            return (
              <div 
                key={`orig-${idx}`} 
                className={`diff-row ${isDifferent ? 'del' : ''}`}
              >
                <span className="diff-line-no">{idx + 1}</span>
                <span>{line || ' '}</span>
              </div>
            );
          })}
        </div>

        {/* Right Side: Fixed / Repaired Code */}
        <div className="diff-pane diff-pane-right">
          <div style={{ padding: '0 12px 6px', fontSize: '11px', color: '#34d399', fontWeight: 600, borderBottom: '1px solid var(--border-subtle)', marginBottom: '4px' }}>
            REPAIRED & SECURED CODE
          </div>
          {Array.from({ length: maxLines }).map((_, idx) => {
            const line = fixLines[idx] !== undefined ? fixLines[idx] : '';
            const origLine = origLines[idx] !== undefined ? origLines[idx] : '';
            const isDifferent = line !== origLine && fixLines[idx] !== undefined;

            return (
              <div 
                key={`fix-${idx}`} 
                className={`diff-row ${isDifferent ? 'add' : ''}`}
              >
                <span className="diff-line-no">{idx + 1}</span>
                <span>{line || ' '}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
