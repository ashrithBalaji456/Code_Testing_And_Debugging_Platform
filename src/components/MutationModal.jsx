import React, { useState, useMemo } from 'react';
import { 
  Dna, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  X, 
  RotateCcw, 
  Plus, 
  Target, 
  Sparkles, 
  Activity,
  Code2
} from 'lucide-react';
import { runMutationSuite } from '../services/mutationEngine';

export function MutationModal({ 
  isOpen, 
  onClose, 
  code, 
  testCases, 
  language = 'javascript',
  onAddTestCase 
}) {
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'SURVIVED' | 'KILLED'
  const [lastRunTime, setLastRunTime] = useState(Date.now());
  const [addedTestMutantIds, setAddedTestMutantIds] = useState(new Set());

  // Evaluate mutants against test cases
  const mutationResult = useMemo(() => {
    if (!isOpen || !code || !testCases) return null;
    return runMutationSuite(code, testCases, language);
  }, [isOpen, code, testCases, language, lastRunTime]);

  if (!isOpen) return null;

  const {
    totalMutants = 0,
    killedCount = 0,
    survivedCount = 0,
    mutationScore = 0,
    rating = 'Evaluating',
    badgeColor = 'var(--accent-cyan)',
    mutants = [],
    durationMs = 0
  } = mutationResult || {};

  const filteredMutants = mutants.filter(m => {
    if (filter === 'SURVIVED') return m.status === 'SURVIVED';
    if (filter === 'KILLED') return m.status === 'KILLED';
    return true;
  });

  const handleAddKillingTest = (mutant) => {
    if (!mutant.suggestedKillingTest || !onAddTestCase) return;

    onAddTestCase({
      id: `kill-mutant-${Date.now()}`,
      name: `Kill ${mutant.type}: ${mutant.description}`,
      input: mutant.suggestedKillingTest.input,
      expected: mutant.suggestedKillingTest.expected,
      type: mutant.suggestedKillingTest.type || 'Boundary'
    });

    setAddedTestMutantIds(prev => new Set([...prev, mutant.id]));
    setLastRunTime(Date.now());
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '840px', width: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
              padding: '6px',
              borderRadius: '8px',
              border: '1px solid rgba(168, 85, 247, 0.4)'
            }}>
              <Dna size={20} color="#a855f7" />
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>In-Browser Mutation Testing Arena</span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'rgba(168, 85, 247, 0.15)',
                  color: '#c084fc',
                  border: '1px solid rgba(168, 85, 247, 0.3)'
                }}>
                  STRESS-TESTER
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Injects subtle semantic bugs (mutants) into your code to verify if your unit tests actually catch them.
              </div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Top Score Banner */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '12px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px'
          }}>
            {/* Mutation Score Card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Mutation Score
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '28px', fontWeight: 800, color: badgeColor, lineHeight: 1 }}>
                  {mutationScore}%
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: badgeColor,
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  border: `1px solid ${badgeColor}`
                }}>
                  {rating}
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden', marginTop: '4px' }}>
                <div style={{ width: `${mutationScore}%`, height: '100%', background: badgeColor, transition: 'width 0.4s ease' }} />
              </div>
            </div>

            {/* Mutants Killed Card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Killed (Caught)
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={20} color="var(--accent-emerald)" />
                <span style={{ fontSize: '22px', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                  {killedCount}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/ {totalMutants}</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Bugs successfully detected by tests
              </span>
            </div>

            {/* Mutants Survived Card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Survived (Blind Spots)
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={20} color={survivedCount > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)'} />
                <span style={{ fontSize: '22px', fontWeight: 700, color: survivedCount > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                  {survivedCount}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>mutants</span>
              </div>
              <span style={{ fontSize: '11px', color: survivedCount > 0 ? 'var(--accent-rose)' : 'var(--text-secondary)' }}>
                {survivedCount > 0 ? 'Bugs your tests failed to catch' : 'Zero test blind spots!'}
              </span>
            </div>

            {/* Execution Stats Card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Execution Load
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="#a855f7" />
                <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {totalMutants * testCases.length}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>runs</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Evaluated in {durationMs}ms in browser
              </span>
            </div>
          </div>

          {/* Filter Pills Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className={`btn btn-sm ${filter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilter('ALL')}
                style={{ fontSize: '12px', padding: '4px 10px' }}
              >
                All Mutants ({totalMutants})
              </button>
              <button
                className={`btn btn-sm ${filter === 'SURVIVED' ? 'btn-danger' : 'btn-secondary'}`}
                onClick={() => setFilter('SURVIVED')}
                style={{ 
                  fontSize: '12px', 
                  padding: '4px 10px',
                  background: filter === 'SURVIVED' ? 'rgba(244, 63, 94, 0.2)' : undefined,
                  borderColor: filter === 'SURVIVED' ? 'var(--accent-rose)' : undefined,
                  color: filter === 'SURVIVED' ? 'var(--accent-rose)' : undefined
                }}
              >
                <AlertTriangle size={12} />
                <span>Survived ({survivedCount})</span>
              </button>
              <button
                className={`btn btn-sm ${filter === 'KILLED' ? 'btn-success' : 'btn-secondary'}`}
                onClick={() => setFilter('KILLED')}
                style={{ fontSize: '12px', padding: '4px 10px' }}
              >
                <CheckCircle2 size={12} />
                <span>Killed ({killedCount})</span>
              </button>
            </div>

            <button 
              className="btn btn-ghost btn-sm"
              onClick={() => setLastRunTime(Date.now())}
              style={{ fontSize: '12px', gap: '6px' }}
              title="Re-evaluate mutants against latest test cases"
            >
              <RotateCcw size={13} />
              <span>Re-evaluate</span>
            </button>
          </div>

          {/* Mutant Cards List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredMutants.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '30px', 
                color: 'var(--text-muted)', 
                background: 'var(--bg-card)', 
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--border-color)' 
              }}>
                No mutants match this filter.
              </div>
            ) : (
              filteredMutants.map((mutant) => {
                const isKilled = mutant.status === 'KILLED';
                const isAdded = addedTestMutantIds.has(mutant.id);

                return (
                  <div
                    key={mutant.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: `1px solid ${isKilled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.35)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      position: 'relative'
                    }}
                  >
                    {/* Top Row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'var(--bg-tertiary)',
                          color: 'var(--text-primary)',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          Line {mutant.line}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {mutant.type}
                        </span>
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: isKilled ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.15)',
                        color: isKilled ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                        border: `1px solid ${isKilled ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.4)'}`
                      }}>
                        {isKilled ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                        <span>{isKilled ? 'KILLED' : 'SURVIVED'}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {mutant.description}
                    </div>

                    {/* Mutation Diff Snippet */}
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      border: '1px solid var(--border-color)',
                      background: '#0d1117'
                    }}>
                      <div style={{ padding: '4px 10px', background: 'rgba(244, 63, 94, 0.12)', color: '#fda4af', borderBottom: '1px solid rgba(244, 63, 94, 0.2)' }}>
                        <span style={{ marginRight: '8px', color: '#f43f5e', fontWeight: 700 }}>-</span>
                        <span>{mutant.originalLine}</span>
                      </div>
                      <div style={{ padding: '4px 10px', background: 'rgba(16, 185, 129, 0.12)', color: '#6ee7b7' }}>
                        <span style={{ marginRight: '8px', color: '#10b981', fontWeight: 700 }}>+</span>
                        <span>{mutant.mutatedLine}</span>
                      </div>
                    </div>

                    {/* Outcome & Recommendation */}
                    {isKilled ? (
                      <div style={{ fontSize: '11.5px', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Target size={13} />
                        <span>Caught by: <strong>"{mutant.killedBy}"</strong></span>
                      </div>
                    ) : (
                      <div style={{
                        background: 'rgba(244, 63, 94, 0.08)',
                        border: '1px solid rgba(244, 63, 94, 0.25)',
                        borderRadius: '6px',
                        padding: '10px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <AlertTriangle size={14} />
                          <span>Test Blind Spot: All unit tests passed despite this mutation!</span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                          To kill this mutant and harden your test suite, add a test case with input <code>{mutant.suggestedKillingTest.input}</code>.
                        </div>

                        {onAddTestCase && (
                          <div style={{ marginTop: '4px' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleAddKillingTest(mutant)}
                              disabled={isAdded}
                              style={{
                                fontSize: '11.5px',
                                padding: '3px 8px',
                                color: isAdded ? 'var(--text-muted)' : '#c084fc',
                                borderColor: isAdded ? 'var(--border-color)' : 'rgba(192, 132, 252, 0.4)'
                              }}
                            >
                              <Plus size={12} />
                              <span>{isAdded ? 'Added to Test Suite' : 'Auto-Add Killing Test Case'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={13} color="#a855f7" />
            <span>Mutation Testing proves whether your tests actually catch regressions.</span>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Close Arena
          </button>
        </div>
      </div>
    </div>
  );
}
