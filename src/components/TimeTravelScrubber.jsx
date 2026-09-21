import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipBack, 
  SkipForward, 
  FastForward, 
  History, 
  Zap, 
  ArrowRight, 
  Eye, 
  Sparkles,
  Layers,
  Clock
} from 'lucide-react';
import { getExecutionTrace } from '../services/traceEngine';

export function TimeTravelScrubber({
  code = '',
  language = 'javascript',
  stepTrace = [],
  onHighlightLine
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 0.5, 1, 2, 4
  const previousVarsRef = useRef({});

  // Compute augmented or dynamic trace steps
  const steps = useMemo(() => {
    return getExecutionTrace(code, language, stepTrace);
  }, [code, language, stepTrace]);

  // Keep currentStepIndex in valid bounds if code changes
  useEffect(() => {
    if (currentStepIndex >= steps.length) {
      setCurrentStepIndex(Math.max(0, steps.length - 1));
    }
  }, [steps.length]);

  const currentStep = steps[currentStepIndex] || null;

  // Sync editor line highlight whenever current step changes
  useEffect(() => {
    if (currentStep?.line && onHighlightLine) {
      onHighlightLine(currentStep.line);
    }
  }, [currentStepIndex, currentStep?.line]);

  // Auto-playback loop with variable speed
  useEffect(() => {
    let timer;
    if (isPlaying && steps.length > 0) {
      const intervalMs = Math.round(1000 / playbackSpeed);
      timer = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    }
    return () => clearInterval(timer);
  }, [isPlaying, steps.length, playbackSpeed]);

  const handleStepChange = (newIndex) => {
    const clamped = Math.max(0, Math.min(steps.length - 1, newIndex));
    setCurrentStepIndex(clamped);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  };

  const handleToEnd = () => {
    setIsPlaying(false);
    setCurrentStepIndex(Math.max(0, steps.length - 1));
  };

  const handleStepBack = () => {
    handleStepChange(currentStepIndex - 1);
  };

  const handleStepForward = () => {
    handleStepChange(currentStepIndex + 1);
  };

  // Get previous step variables to compute real-time diffs
  const prevStep = currentStepIndex > 0 ? steps[currentStepIndex - 1] : null;
  const currentVars = currentStep?.vars || {};
  const prevVars = prevStep?.vars || {};

  return (
    <div className="time-travel-panel" style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px'
    }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
            padding: '5px',
            borderRadius: '6px',
            border: '1px solid rgba(6, 182, 212, 0.35)'
          }}>
            <History size={16} color="var(--accent-cyan)" />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Time-Travel Execution Scrubber</span>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '10px',
                background: 'rgba(6, 182, 212, 0.15)',
                color: 'var(--accent-cyan)',
                border: '1px solid rgba(6, 182, 212, 0.3)'
              }}>
                LIVE REPLAY
              </span>
            </div>
          </div>
        </div>

        {/* Speed Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-tertiary)', padding: '2px 4px', borderRadius: '8px' }}>
          {[0.5, 1, 2, 4].map(speed => (
            <button
              key={speed}
              onClick={() => setPlaybackSpeed(speed)}
              style={{
                background: playbackSpeed === speed ? 'var(--accent-primary)' : 'transparent',
                color: playbackSpeed === speed ? '#fff' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '6px',
                padding: '2px 7px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Scrubber Track Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
          <span>Step 1 (Start)</span>
          <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
            Frame {steps.length > 0 ? currentStepIndex + 1 : 0} of {steps.length}
          </span>
          <span>Step {steps.length} (End)</span>
        </div>

        <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
          <input
            id="input-timeline-scrubber"
            type="range"
            min="0"
            max={Math.max(0, steps.length - 1)}
            value={currentStepIndex}
            onChange={(e) => handleStepChange(parseInt(e.target.value, 10))}
            style={{
              width: '100%',
              accentColor: 'var(--accent-cyan)',
              cursor: 'pointer',
              height: '6px'
            }}
          />
        </div>

        {/* Keyframe Step Markers */}
        {steps.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 2px', marginTop: '2px' }}>
            {steps.map((s, idx) => {
              const isActive = idx === currentStepIndex;
              const isPast = idx < currentStepIndex;
              let dotColor = 'var(--text-muted)';
              if (s.type === 'error') dotColor = 'var(--accent-rose)';
              else if (s.type === 'branch') dotColor = '#c084fc';
              else if (s.type === 'return') dotColor = 'var(--accent-emerald)';
              else if (isActive) dotColor = 'var(--accent-cyan)';

              return (
                <div
                  key={idx}
                  onClick={() => handleStepChange(idx)}
                  title={`Step ${idx + 1}: ${s.label}`}
                  style={{
                    width: isActive ? '10px' : '6px',
                    height: isActive ? '10px' : '6px',
                    borderRadius: '50%',
                    background: isActive ? 'var(--accent-cyan)' : isPast ? 'var(--accent-primary-light)' : 'var(--bg-tertiary)',
                    border: `1.5px solid ${dotColor}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 0 8px var(--accent-cyan)' : 'none'
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Transport Controls Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-secondary)',
        padding: '8px 12px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleReset}
            disabled={currentStepIndex === 0}
            title="Rewind to Step 1"
          >
            <RotateCcw size={12} />
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={handleStepBack}
            disabled={currentStepIndex === 0}
            title="Step backward 1 frame"
          >
            <SkipBack size={12} />
          </button>

          <button
            className="btn btn-primary btn-sm"
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              background: isPlaying ? 'var(--accent-amber)' : 'var(--accent-primary)',
              borderColor: isPlaying ? 'var(--accent-amber)' : 'var(--accent-primary)',
              padding: '4px 12px'
            }}
            title={isPlaying ? 'Pause playback' : 'Play timeline replay'}
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} fill="currentColor" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={handleStepForward}
            disabled={currentStepIndex >= steps.length - 1}
            title="Step forward 1 frame"
          >
            <SkipForward size={12} />
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={handleToEnd}
            disabled={currentStepIndex >= steps.length - 1}
            title="Fast-forward to last frame"
          >
            <FastForward size={12} />
          </button>
        </div>

        {currentStep && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <span style={{
              background: 'var(--bg-tertiary)',
              padding: '2px 8px',
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: 'var(--accent-primary-light)'
            }}>
              Line {currentStep.line}
            </span>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentStep.label}
            </span>
          </div>
        )}
      </div>

      {/* Current Execution Frame Preview */}
      {currentStep?.codeSnippet && (
        <div style={{
          background: '#0a0d14',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          borderRadius: '6px',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          overflowX: 'auto'
        }}>
          <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>&gt;</span>
          <span style={{ color: '#e2e8f0', whiteSpace: 'nowrap' }}>{currentStep.codeSnippet}</span>
        </div>
      )}

      {/* Variable Watch Table with Real-time Delta Highlighting */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={13} />
            <span>Active Variable Snapshots ({Object.keys(currentVars).length})</span>
          </div>

          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            ⚡ Highlights state mutations in this frame
          </span>
        </div>

        {Object.keys(currentVars).length > 0 ? (
          <div style={{
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden'
          }}>
            <table className="variable-watch-table" style={{ margin: 0, width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '35%' }}>Variable</th>
                  <th style={{ width: '45%' }}>Value / State</th>
                  <th style={{ width: '20%', textAlign: 'right' }}>Mutation Delta</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(currentVars).map(([name, val]) => {
                  const isMutated = currentStep.delta?.includes(name);
                  const prevVal = prevVars[name];
                  const hasPrev = prevVal !== undefined && prevVal !== val;

                  return (
                    <tr 
                      key={name}
                      style={{
                        background: isMutated ? 'rgba(6, 182, 212, 0.08)' : undefined,
                        transition: 'background 0.3s ease'
                      }}
                    >
                      <td className="var-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{name}</span>
                        {isMutated && (
                          <span style={{
                            fontSize: '9.5px',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '4px',
                            background: 'rgba(6, 182, 212, 0.2)',
                            color: 'var(--accent-cyan)',
                            border: '1px solid rgba(6, 182, 212, 0.3)'
                          }}>
                            {hasPrev ? 'UPDATED' : 'NEW'}
                          </span>
                        )}
                      </td>
                      <td className="var-val" style={{ fontFamily: 'var(--font-mono)' }}>
                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                      </td>
                      <td style={{ textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)' }}>
                        {hasPrev ? (
                          <span style={{ color: 'var(--accent-cyan)' }}>
                            {String(prevVal)} &rarr; {String(val)}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{
            padding: '16px',
            textAlign: 'center',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-muted)',
            fontSize: '12px'
          }}>
            No active variables recorded in this execution frame.
          </div>
        )}
      </div>
    </div>
  );
}
