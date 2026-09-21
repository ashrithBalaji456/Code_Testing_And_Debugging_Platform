import React, { useState } from 'react';
import { 
  FlaskConical, 
  Play, 
  AlertOctagon, 
  CheckCircle2, 
  X, 
  Plus, 
  RotateCcw, 
  Download, 
  Sparkles, 
  ShieldAlert, 
  Layers, 
  Zap,
  HelpCircle,
  Bug
} from 'lucide-react';
import { 
  runFuzzTesting, 
  convertCounterexampleToTestCase 
} from '../services/fuzzEngine';

export function FuzzTestingModal({ 
  isOpen, 
  onClose, 
  code = '', 
  language = 'javascript',
  onAddTestCase 
}) {
  const [testCount, setTestCount] = useState(100);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [addedIds, setAddedIds] = useState(new Set());

  if (!isOpen) return null;

  const handleStartFuzzing = async () => {
    setIsRunning(true);
    setResults(null);

    try {
      const fuzzResult = await runFuzzTesting(code, language, { totalTests: testCount });
      setResults(fuzzResult);
    } catch (err) {
      console.error('Fuzz testing error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleAddTest = (failure) => {
    const newTest = convertCounterexampleToTestCase(failure);
    if (onAddTestCase) {
      onAddTestCase(newTest);
    }
    setAddedIds(prev => new Set([...prev, failure.index]));
  };

  const handleExportReport = () => {
    if (!results) return;
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fuzz_report_${language}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '800px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-default)', paddingBottom: '14px' }}>
          <div className="modal-title">
            <div style={{ 
              width: '34px', 
              height: '34px', 
              borderRadius: '8px', 
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(6, 182, 212, 0.2))',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#c084fc'
            }}>
              <FlaskConical size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Automated Property-Based & Adversarial Fuzzer
                </span>
                <span className="severity-tag medium" style={{ fontSize: '10px' }}>
                  EDGE-CASE HUNTER
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                Generates hundreds of adversarial edge-case inputs, checks invariant bounds, and automatically shrinks counterexamples.
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Controls Bar */}
          <div style={{ 
            background: 'var(--bg-card)', 
            border: '1px solid var(--border-default)', 
            borderRadius: 'var(--radius-md)', 
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Test Volume:</span>
              <div style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: '6px', padding: '2px', border: '1px solid var(--border-default)' }}>
                {[50, 100, 250, 500].map(cnt => (
                  <button
                    key={cnt}
                    className={`filter-pill ${testCount === cnt ? 'active' : ''}`}
                    onClick={() => setTestCount(cnt)}
                    style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '4px' }}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                id="btn-run-fuzz-tests"
                className="btn btn-primary"
                onClick={handleStartFuzzing}
                disabled={isRunning}
                style={{
                  background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                  borderColor: '#c084fc',
                  color: '#ffffff',
                  fontWeight: 600,
                  boxShadow: '0 2px 10px rgba(168, 85, 247, 0.35)',
                  padding: '7px 18px',
                  gap: '6px'
                }}
              >
                {isRunning ? (
                  <>
                    <Zap size={14} className="spin" />
                    <span>Fuzzing {testCount} Inputs...</span>
                  </>
                ) : (
                  <>
                    <Play size={14} fill="currentColor" />
                    <span>Start Adversarial Fuzzing</span>
                  </>
                )}
              </button>

              {results && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleExportReport}
                  title="Export Fuzz Testing Report JSON"
                  style={{ padding: '7px 12px' }}
                >
                  <Download size={14} />
                  <span>Export</span>
                </button>
              )}
            </div>
          </div>

          {/* Results Status Banner */}
          {results && (
            <div style={{
              background: results.failureCount > 0 ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              border: `1px solid ${results.failureCount > 0 ? 'rgba(244, 63, 94, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {results.failureCount > 0 ? (
                  <AlertOctagon size={24} color="#f43f5e" />
                ) : (
                  <CheckCircle2 size={24} color="#10b981" />
                )}
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: results.failureCount > 0 ? '#fb7185' : '#34d399' }}>
                    {results.failureCount > 0 
                      ? `🚨 ${results.failureCount} Adversarial Counterexample${results.failureCount > 1 ? 's' : ''} Exposed`
                      : `✅ All ${results.totalRun} Invariant Contracts Satisfied`}
                  </h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Evaluated {results.totalRun} inputs in {results.durationMs}ms ({results.passedCount} passed, {results.failureCount} failed).
                  </p>
                </div>
              </div>

              {/* Invariants Checklist */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span className={`severity-tag ${results.invariants.crashResistance ? 'low' : 'critical'}`} style={{ fontSize: '10.5px' }}>
                  {results.invariants.crashResistance ? '✓ Crash Resistant' : '✗ Unhandled Crash'}
                </span>
                <span className={`severity-tag ${results.invariants.nanSafety ? 'low' : 'medium'}`} style={{ fontSize: '10.5px' }}>
                  {results.invariants.nanSafety ? '✓ NaN Safe' : '✗ NaN Output'}
                </span>
              </div>
            </div>
          )}

          {/* Counterexamples List */}
          {results ? (
            results.failureCount === 0 ? (
              <div style={{
                padding: '36px 20px',
                textAlign: 'center',
                background: 'var(--bg-card)',
                border: '1px dashed var(--border-default)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px'
              }}>
                <CheckCircle2 size={38} color="#10b981" />
                <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)' }}>
                  Robust Against Adversarial Inputs
                </h4>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', maxWidth: '460px' }}>
                  No unhandled exceptions, zero-divisions, or NaN corruption occurred across numerical boundaries, adversarial strings, or collection hazards.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Discovered Counterexamples ({results.failureCount}):
                </div>

                {results.failures.map((fail) => {
                  const isAdded = addedIds.has(fail.index);

                  return (
                    <div
                      key={fail.index}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid rgba(244, 63, 94, 0.3)',
                        borderLeft: '4px solid #f43f5e',
                        borderRadius: 'var(--radius-md)',
                        padding: '12px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="severity-tag critical" style={{ fontSize: '10px' }}>
                            CRASH #{fail.index}
                          </span>
                          <span style={{ fontSize: '11px', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                            {fail.category}
                          </span>
                          <strong style={{ fontSize: '13px', color: '#fb7185' }}>
                            {fail.errorType}
                          </strong>
                        </div>

                        <button
                          className="btn btn-sm"
                          onClick={() => handleAddTest(fail)}
                          disabled={isAdded}
                          style={{
                            background: isAdded ? 'rgba(16, 185, 129, 0.15)' : 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                            color: '#ffffff',
                            borderColor: isAdded ? '#10b981' : '#c084fc',
                            fontSize: '11px',
                            padding: '4px 12px',
                            gap: '5px'
                          }}
                        >
                          {isAdded ? (
                            <>
                              <CheckCircle2 size={12} color="#34d399" />
                              <span>Added to Suite</span>
                            </>
                          ) : (
                            <>
                              <Plus size={12} />
                              <span>Add as Unit Test</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <strong>Exception:</strong> {fail.errorMessage}
                      </div>

                      {/* Input vs Shrunk Input Comparison */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div style={{
                          background: 'rgba(15, 23, 42, 0.6)',
                          border: '1px solid var(--border-default)',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          fontSize: '11.5px'
                        }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '10.5px', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                            Adversarial Input:
                          </span>
                          <code style={{ color: '#fda4af', wordBreak: 'break-all' }}>
                            {typeof fail.input === 'object' ? JSON.stringify(fail.input) : String(fail.input)}
                          </code>
                        </div>

                        <div style={{
                          background: 'rgba(15, 23, 42, 0.6)',
                          border: '1px solid rgba(168, 85, 247, 0.3)',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          fontSize: '11.5px'
                        }}>
                          <span style={{ color: '#c084fc', fontSize: '10.5px', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                            Minimal Shrunk Repro:
                          </span>
                          <code style={{ color: '#e9d5ff', wordBreak: 'break-all' }}>
                            {typeof fail.shrunkInput === 'object' ? JSON.stringify(fail.shrunkInput) : String(fail.shrunkInput)}
                          </code>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div style={{ 
              padding: '40px 20px', 
              textAlign: 'center', 
              background: 'var(--bg-card)', 
              border: '1px dashed var(--border-default)', 
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <FlaskConical size={38} color="#c084fc" style={{ opacity: 0.7 }} />
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--text-primary)' }}>
                  Ready to Stress-Test Invariants
                </h4>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', maxWidth: '420px' }}>
                  Click <strong>Start Adversarial Fuzzing</strong> to unleash randomized edge cases (NaN, empty strings, nulls, negative bounds) to discover hidden crashes.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-default)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            Property-based adversarial invariant fuzz testing
          </span>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
