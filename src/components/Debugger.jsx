import React, { useState, useEffect } from 'react';
import { 
  Bug, 
  CheckCircle, 
  AlertOctagon, 
  Play, 
  Pause, 
  SkipForward, 
  RotateCcw, 
  Layers, 
  Activity, 
  Wrench,
  Search
} from 'lucide-react';

export function Debugger({
  executionResult,
  stepTrace = [],
  simulatedError = null,
  onApplyDiagnosisFix,
  onHighlightLine
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

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

  // Step-by-step simulator auto-play
  useEffect(() => {
    let timer;
    if (isPlaying && stepTrace.length > 0) {
      timer = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= stepTrace.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, stepTrace.length]);

  const currentStep = stepTrace[currentStepIndex] || null;

  const handleNextStep = () => {
    if (currentStepIndex < stepTrace.length - 1) {
      const next = currentStepIndex + 1;
      setCurrentStepIndex(next);
      if (stepTrace[next]?.line && onHighlightLine) {
        onHighlightLine(stepTrace[next].line);
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      const prev = currentStepIndex - 1;
      setCurrentStepIndex(prev);
      if (stepTrace[prev]?.line && onHighlightLine) {
        onHighlightLine(stepTrace[prev].line);
      }
    }
  };

  const handleResetSim = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
    if (stepTrace[0]?.line && onHighlightLine) {
      onHighlightLine(stepTrace[0].line);
    }
  };

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

      {/* Step-by-Step Execution Simulator */}
      <div className="simulator-panel">
        <div className="simulator-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} color="var(--accent-cyan)" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Execution Trace & Variable Watch
            </span>
          </div>

          <div className="sim-controls">
            <button 
              className="btn btn-secondary btn-sm"
              onClick={handleResetSim}
              disabled={currentStepIndex === 0}
              title="Reset simulation to step 1"
            >
              <RotateCcw size={12} />
            </button>

            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setIsPlaying(!isPlaying)}
              title={isPlaying ? 'Pause simulation' : 'Auto-step through execution'}
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            </button>

            <button 
              className="btn btn-secondary btn-sm"
              onClick={handleNextStep}
              disabled={currentStepIndex >= stepTrace.length - 1}
              title="Step to next iteration"
            >
              <SkipForward size={12} />
            </button>

            <span className="sim-step-indicator">
              Step {stepTrace.length > 0 ? currentStepIndex + 1 : 0} of {stepTrace.length}
            </span>
          </div>
        </div>

        {currentStep ? (
          <div>
            <div style={{ marginBottom: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
              Currently inspecting execution frame at <strong style={{ color: 'var(--accent-primary-light)' }}>Line {currentStep.line}</strong>:
            </div>

            <table className="variable-watch-table">
              <thead>
                <tr>
                  <th>Variable Name</th>
                  <th>Value / State</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(currentStep.vars).map(([name, val]) => (
                  <tr key={name}>
                    <td className="var-name">{name}</td>
                    <td className="var-val">
                      {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: '12.5px', padding: '10px 0' }}>
            Select a preset algorithmic snippet or run code with breakpoints to trace variable snapshots.
          </div>
        )}
      </div>
    </div>
  );
}
