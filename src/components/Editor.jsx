import React, { useRef, useEffect } from 'react';
import { Copy, Check, Trash2, Sparkles } from 'lucide-react';

export function Editor({
  code,
  onChange,
  findings = [],
  runtimeErrorLine = null,
  activeLine = null,
  onLineClick,
  coverageMap = null,
  showCoverage = false,
  coveragePercent = 100,
  onRunTests = null
}) {
  const textareaRef = useRef(null);
  const gutterRef = useRef(null);
  const coverageBackdropRef = useRef(null);
  const [copied, setCopied] = React.useState(false);

  const lines = code.split('\n');

  // Synchronize scrolling between gutter, backdrop, and textarea
  const handleScroll = (e) => {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = e.target.scrollTop;
    }
    if (coverageBackdropRef.current) {
      coverageBackdropRef.current.scrollTop = e.target.scrollTop;
    }
  };

  const handleKeyDown = (e) => {
    // Enable Tab indentation (2 spaces)
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const updated = code.substring(0, start) + '  ' + code.substring(end);
      onChange(updated);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleClear = () => {
    onChange('');
  };

  // Find line issues
  const errorLines = new Set();
  const warningLines = new Set();

  findings.forEach(f => {
    if (f.severity === 'critical') errorLines.add(f.line);
    else if (f.severity === 'warning') warningLines.add(f.line);
  });

  if (runtimeErrorLine) {
    errorLines.add(runtimeErrorLine);
  }

  // Count covered vs uncovered lines for heatmap legend
  let coveredCount = 0;
  let uncoveredCount = 0;
  if (coverageMap) {
    Object.values(coverageMap).forEach(hits => {
      if (hits > 0) coveredCount++;
      else if (hits === 0) uncoveredCount++;
    });
  }

  return (
    <div className="editor-outer-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Coverage Heatmap Legend & Status Banner */}
      {showCoverage && coverageMap && (
        <div className="coverage-legend-bar">
          <div className="coverage-legend-badges">
            <span className="coverage-stat-tag covered">
              <span className="coverage-pip covered" />
              <span><strong>{coveredCount}</strong> Lines Covered (Hit by Tests)</span>
            </span>
            <span className="coverage-stat-tag uncovered">
              <span className="coverage-pip uncovered" />
              <span><strong>{uncoveredCount}</strong> Lines Untested (0x)</span>
            </span>
          </div>

          <div className="coverage-legend-meta">
            <span className="coverage-percent-badge">
              {coveragePercent}% Line Coverage
            </span>
            {onRunTests && (
              <button 
                className="btn btn-secondary btn-xs" 
                onClick={onRunTests}
                title="Execute test suite to verify live coverage hits"
                style={{ fontSize: '11px', padding: '2px 8px', height: '22px' }}
              >
                Run Tests
              </button>
            )}
          </div>
        </div>
      )}

      <div className="editor-container">
        {/* Line Numbers Gutter */}
        <div className="editor-gutter" ref={gutterRef}>
          {lines.map((_, idx) => {
            const lineNum = idx + 1;
            const hasError = errorLines.has(lineNum);
            const hasWarn = warningLines.has(lineNum);
            const isActive = activeLine === lineNum;
            const hits = coverageMap ? coverageMap[lineNum] : undefined;
            const isCovered = hits !== undefined && hits > 0;
            const isUncovered = hits === 0;

            return (
              <div
                key={lineNum}
                className={`gutter-line ${hasError ? 'has-error' : ''} ${hasWarn ? 'has-warning' : ''} ${isActive ? 'active-line' : ''}`}
                onClick={() => onLineClick && onLineClick(lineNum)}
                title={
                  hasError 
                    ? 'Error on this line' 
                    : hasWarn 
                      ? 'Review warning on this line' 
                      : showCoverage && coverageMap && hits !== undefined
                        ? (isCovered ? `Line ${lineNum}: Covered by unit tests (hit ${hits}x)` : `Line ${lineNum}: Untested (0 hits by test suite)`)
                        : `Line ${lineNum}`
                }
                style={{ cursor: 'pointer' }}
              >
                {showCoverage && coverageMap && isCovered && (
                  <span className="coverage-hit-badge covered" title={`Covered (${hits}x hits)`}>✓</span>
                )}
                {showCoverage && coverageMap && isUncovered && (
                  <span className="coverage-hit-badge uncovered" title="Untested (0x hits)">0x</span>
                )}
                {hasError && <span className="gutter-marker error" />}
                {hasWarn && !hasError && <span className="gutter-marker warning" />}
                <span>{lineNum}</span>
              </div>
            );
          })}
        </div>

        {/* Editor Textarea Canvas with Synchronized Heatmap Layer */}
        <div className="editor-textarea-wrapper">
          {showCoverage && coverageMap && (
            <div 
              ref={coverageBackdropRef}
              className="coverage-backdrop"
            >
              {lines.map((_, idx) => {
                const lineNum = idx + 1;
                const hits = coverageMap[lineNum];
                const isCov = hits !== undefined && hits > 0;
                const isUncov = hits === 0;

                return (
                  <div
                    key={lineNum}
                    className={`coverage-backdrop-line ${isCov ? 'line-covered' : ''} ${isUncov ? 'line-uncovered' : ''}`}
                  />
                );
              })}
            </div>
          )}

          <textarea
            id="code-editor-input"
            ref={textareaRef}
            className="editor-textarea"
            value={code}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            spellCheck="false"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            placeholder="// Type or paste your code here..."
            style={{ position: 'relative', zIndex: 2 }}
          />
        </div>
      </div>
    </div>
  );
}
