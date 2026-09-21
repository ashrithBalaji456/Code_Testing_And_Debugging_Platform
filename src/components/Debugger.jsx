import React, { useState } from 'react';
import { 
  Bug, 
  CheckCircle, 
  AlertOctagon, 
  Activity, 
  Workflow,
  History
} from 'lucide-react';
import { CallGraphVisualizer } from './CallGraphVisualizer';
import { TimeTravelScrubber } from './TimeTravelScrubber';

export function Debugger({
  code = '',
  language = 'javascript',
  executionResult,
  stepTrace = [],
  simulatedError = null,
  onApplyDiagnosisFix,
  onHighlightLine
}) {
  const [debugViewMode, setDebugViewMode] = useState('trace'); // 'trace' | 'graph'

  const error = executionResult?.error || (simulatedError ? {
    name: 'DetectedRuntimeBug',
    message: simulatedError,
    diagnosis: {
      title: 'Preset Bug Scenario Detected',
      cause: simulatedError,
      fix: 'Review variable state mutations and recursion boundary conditions below.',
      affectedArea: 'Main algorithm loop'
    }
  } : null);

  const hasError = !!error;

  return (
    <div className="studio-content-area">
      {/* Execution Health Status */}
      <div className="debug-status-banner">
        <div className="debug-status-left">
          <div className={`debug-status-icon ${hasError ? 'has-error' : 'clean'}`}>
            {hasError ? <Bug size={22} /> : <CheckCircle size={22} />}
          </div>
          <div>
            <h3 className="debug-status-title">
              {hasError ? 'Runtime Exception / Bug Detected' : 'No Runtime Crashes'}
            </h3>
            <p className="debug-status-subtitle">
              {hasError 
                ? `${error.name}: ${error.message?.slice(0, 70)}...` 
                : 'Execution finished safely within acceptable memory & call-stack limits.'}
            </p>
          </div>
        </div>

        {hasError && (
          <span className="severity-tag critical">
            Faulty State
          </span>
        )}
      </div>

      {/* Root Cause Diagnosis Card */}
      {hasError && error.diagnosis && (
        <div className="root-cause-card">
          <div className="root-cause-header">
            <AlertOctagon size={18} />
            <span>Root Cause Diagnosis</span>
          </div>

          <p className="root-cause-explanation">
            <strong>{error.diagnosis.title}:</strong> {error.diagnosis.cause}
          </p>

          <div className="root-cause-details-grid">
            <div>
              <div className="rc-detail-label">Suspicious Location</div>
              <div className="rc-detail-val">{error.diagnosis.affectedArea || 'Global Scope'}</div>
            </div>
            <div>
              <div className="rc-detail-label">Recommended Remediation</div>
              <div className="rc-detail-val" style={{ color: '#34d399' }}>{error.diagnosis.fix}</div>
            </div>
          </div>
        </div>
      )}

      {/* Debugger Sub-view Switcher */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-default)', paddingBottom: '8px' }}>
        <button
          id="btn-subview-trace"
          className={`filter-pill ${debugViewMode === 'trace' ? 'active' : ''}`}
          onClick={() => setDebugViewMode('trace')}
        >
          <History size={12} style={{ display: 'inline', marginRight: '5px' }} />
          <span>Time-Travel Scrubber</span>
        </button>
        <button
          id="btn-subview-graph"
          className={`filter-pill ${debugViewMode === 'graph' ? 'active' : ''}`}
          onClick={() => setDebugViewMode('graph')}
        >
          <Workflow size={12} style={{ display: 'inline', marginRight: '5px' }} />
          <span>AST Call-Graph & Tree</span>
        </button>
      </div>

      {debugViewMode === 'graph' ? (
        <CallGraphVisualizer
          code={code}
          language={language}
          onHighlightLine={onHighlightLine}
        />
      ) : (
        <TimeTravelScrubber
          code={code}
          language={language}
          stepTrace={stepTrace}
          onHighlightLine={onHighlightLine}
        />
      )}
    </div>
  );
}
