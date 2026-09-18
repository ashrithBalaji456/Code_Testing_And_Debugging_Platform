import React, { useState } from 'react';
import { Terminal as TermIcon, Trash2, Clock, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

export function Terminal({ logs, onClear, duration, hasError }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const terminalEndRef = React.useRef(null);

  React.useEffect(() => {
    if (terminalEndRef.current && !isCollapsed) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isCollapsed]);

  return (
    <div className={`terminal-panel ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="terminal-header" onClick={() => setIsCollapsed(!isCollapsed)} style={{ cursor: 'pointer', userSelect: 'none' }}>
        <div className="terminal-header-title">
          <TermIcon size={14} color="var(--accent-primary-light)" />
          <span>Execution Console & Output</span>
          {duration !== null && !isCollapsed && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', marginLeft: '10px' }}>
              <Clock size={12} />
              {duration} ms
            </span>
          )}
        </div>

        <div className="terminal-actions" onClick={(e) => e.stopPropagation()}>
          {hasError ? (
            <span style={{ fontSize: '11px', color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertCircle size={12} /> Error Detected
            </span>
          ) : logs.length > 0 ? (
            <span style={{ fontSize: '11px', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={12} /> Ready
            </span>
          ) : null}

          <button 
            id="btn-clear-terminal"
            className="btn btn-ghost btn-sm"
            onClick={onClear}
            title="Clear output logs"
          >
            <Trash2 size={13} />
            <span>Clear</span>
          </button>

          <button
            id="btn-toggle-terminal"
            className="btn btn-ghost btn-sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expand Terminal" : "Collapse Terminal for more editor space"}
          >
            {isCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="terminal-body">
          {logs.length === 0 ? (
            <div style={{ color: 'var(--text-dim)', fontStyle: 'italic', padding: '6px 0' }}>
              Ready. Click "Run Sandbox" or "Run All Tests" to view execution traces here.
            </div>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className={`terminal-log-entry ${log.type}`}>
                <span className="terminal-prompt-symbol">&gt;</span>
                <span style={{ color: 'var(--text-dim)', fontSize: '10.5px' }}>[{log.time}]</span>
                <span>{log.message}</span>
              </div>
            ))
          )}
          <div ref={terminalEndRef} />
        </div>
      )}
    </div>
  );
}
