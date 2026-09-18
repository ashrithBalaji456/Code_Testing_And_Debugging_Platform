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
  showCoverage = false
}) {
  const textareaRef = useRef(null);
  const gutterRef = useRef(null);
  const [copied, setCopied] = React.useState(false);

  const lines = code.split('\n');

  // Synchronize scrolling between gutter and textarea
  const handleScroll = (e) => {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = e.target.scrollTop;
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

  return (
    <div className="editor-container">
      {/* Line Numbers Gutter */}
      <div className="editor-gutter" ref={gutterRef}>
        {lines.map((_, idx) => {
          const lineNum = idx + 1;
          const hasError = errorLines.has(lineNum);
          const hasWarn = warningLines.has(lineNum);
          const isActive = activeLine === lineNum;
          const isCovered = coverageMap && coverageMap[lineNum] > 0;
          const isUncovered = coverageMap && coverageMap[lineNum] === 0;

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
                    : showCoverage && coverageMap && coverageMap[lineNum] !== undefined
                      ? (isCovered ? `Covered (hit ${coverageMap[lineNum]}x by test suite)` : 'Uncovered line (not reached by tests)')
                      : `Line ${lineNum}`
              }
              style={{ cursor: 'pointer' }}
            >
              {showCoverage && isCovered && <span className="coverage-pip covered" />}
              {showCoverage && isUncovered && <span className="coverage-pip uncovered" />}
              {hasError && <span className="gutter-marker error" />}
              {hasWarn && !hasError && <span className="gutter-marker warning" />}
              <span>{lineNum}</span>
            </div>
          );
        })}
      </div>

      {/* Editor Textarea Canvas */}
      <div className="editor-textarea-wrapper">
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
        />
      </div>
    </div>
  );
}
