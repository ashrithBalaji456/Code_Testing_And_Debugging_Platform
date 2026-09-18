import React, { useState } from 'react';
import { 
  TestTube2, 
  Play, 
  Plus, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Code, 
  Download,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { exportToJest, exportToPyTest } from '../services/testEngine';

export function TestRunner({
  code,
  language = 'javascript',
  testCases,
  testResults,
  onRunAllTests,
  onGenerateTests,
  onAddTestCase,
  onDeleteTestCase,
  isRunningTests
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTestName, setNewTestName] = useState('');
  const [newTestInput, setNewTestInput] = useState('');
  const [newTestExpected, setNewTestExpected] = useState('');
  const [newTestType, setNewTestType] = useState('Custom');

  const {
    passedCount = 0,
    failedCount = 0,
    totalCount = testCases.length,
    coveragePercent = 0,
    durationMs = 0,
    results = []
  } = testResults || {};

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newTestName.trim() || !newTestInput.trim()) return;

    onAddTestCase({
      id: `custom-${Date.now()}`,
      name: newTestName.trim(),
      input: newTestInput.trim(),
      expected: newTestExpected.trim(),
      type: newTestType
    });

    setNewTestName('');
    setNewTestInput('');
    setNewTestExpected('');
    setShowAddModal(false);
  };

  const handleExportTests = () => {
    const isPython = language === 'python';
    const testCode = isPython ? exportToPyTest(code, testCases) : exportToJest(code, testCases);
    const fileName = isPython ? `test_solution.py` : `solution.test.js`;
    const mimeType = isPython ? 'text/x-python' : 'application/javascript';

    const blob = new Blob([testCode], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="studio-content-area">
      {/* Test Stats Banner */}
      <div className="test-summary-card">
        <div className="test-stats-grid">
          <div className="test-stat-item">
            <span className="test-stat-label">Total Tests</span>
            <span className="test-stat-number">{testCases.length}</span>
          </div>

          <div className="test-stat-item">
            <span className="test-stat-label">Passed</span>
            <span className="test-stat-number passed">{passedCount}</span>
          </div>

          <div className="test-stat-item">
            <span className="test-stat-label">Failed</span>
            <span className="test-stat-number failed">{failedCount}</span>
          </div>

          <div className="test-coverage-meter">
            <div className="coverage-text">
              <span>Pass Rate</span>
              <span>{testCases.length > 0 ? coveragePercent : 0}%</span>
            </div>
            <div className="coverage-bar">
              <div 
                className="coverage-fill" 
                style={{ width: `${testCases.length > 0 ? coveragePercent : 0}%` }} 
              />
            </div>
          </div>
        </div>

        <div className="test-suite-controls">
          <button 
            id="btn-run-all-tests"
            className="btn btn-success btn-sm"
            onClick={onRunAllTests}
            disabled={isRunningTests || testCases.length === 0}
            title="Execute test suite against current editor code"
          >
            <Play size={13} fill="currentColor" />
            <span>Run All Tests</span>
          </button>

          <button 
            id="btn-generate-tests"
            className="btn btn-secondary btn-sm"
            onClick={onGenerateTests}
            title="Auto-generate unit test assertions for this code"
          >
            <Sparkles size={13} color="var(--accent-purple)" />
            <span>Synthesize Tests</span>
          </button>
        </div>
      </div>

      {/* Action Subbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Test Cases ({testCases.length})
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            id="btn-open-add-test-modal"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={13} />
            <span>Add Test</span>
          </button>

          <button 
            id="btn-export-test-code"
            className="btn btn-secondary btn-sm"
            onClick={handleExportTests}
            title={language === 'python' ? "Export test suite as PyTest Python script" : "Export test suite as Jest / Vitest JavaScript file"}
          >
            <Download size={13} />
            <span>{language === 'python' ? 'Export PyTest' : 'Export Jest'}</span>
          </button>
        </div>
      </div>

      {/* Test Cases List */}
      <div className="test-cards-list">
        {testCases.map((tc) => {
          const result = results.find(r => r.id === tc.id);
          const hasRun = !!result;
          const passed = result?.passed;

          return (
            <div 
              key={tc.id} 
              className={`test-case-card ${hasRun ? (passed ? 'passed' : 'failed') : 'pending'}`}
            >
              <div className="test-case-top">
                <div className="test-title-area">
                  {hasRun ? (
                    passed ? (
                      <CheckCircle2 size={16} color="var(--accent-emerald)" />
                    ) : (
                      <XCircle size={16} color="var(--accent-rose)" />
                    )
                  ) : (
                    <TestTube2 size={16} color="var(--text-muted)" />
                  )}

                  <span className="test-name">{tc.name}</span>
                  <span className="test-type-pill">{tc.type}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {hasRun && (
                    <span className="test-latency">
                      <Clock size={11} style={{ display: 'inline', marginRight: '3px' }} />
                      {result.duration}ms
                    </span>
                  )}
                  <button 
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '2px 6px', color: 'var(--text-dim)' }}
                    onClick={() => onDeleteTestCase(tc.id)}
                    title="Delete test case"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              <div className="test-io-box">
                <div>
                  <div className="test-io-label">INPUT ARGUMENTS</div>
                  <div className="test-io-val">{tc.input}</div>
                </div>
                <div>
                  <div className="test-io-label">EXPECTED OUTPUT</div>
                  <div className="test-io-val">{tc.expected}</div>
                </div>
              </div>

              {hasRun && !passed && (
                <div style={{ background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.2)', padding: '6px 10px', borderRadius: '4px', fontSize: '11.5px', color: '#fca5a5' }}>
                  <strong>Assertion Failure:</strong> Expected <code>{tc.expected}</code> but received <code>{result.actual}</code>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Custom Test Case Modal */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Plus size={16} color="var(--accent-emerald)" />
                <span>Add Custom Unit Test</span>
              </div>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Test Name</label>
                  <input 
                    id="input-test-name"
                    type="text" 
                    className="form-input"
                    placeholder="e.g. Test with 0 or negative boundary"
                    value={newTestName}
                    onChange={(e) => setNewTestName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Input Parameters (Code / JSON)</label>
                  <input 
                    id="input-test-params"
                    type="text" 
                    className="form-input"
                    placeholder="e.g. 7 or ([1, 2, 3], 2)"
                    value={newTestInput}
                    onChange={(e) => setNewTestInput(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Expected Return Value</label>
                  <input 
                    id="input-test-expected"
                    type="text" 
                    className="form-input"
                    placeholder="e.g. 13 or Error"
                    value={newTestExpected}
                    onChange={(e) => setNewTestExpected(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select 
                    id="select-test-category"
                    className="form-input"
                    value={newTestType}
                    onChange={(e) => setNewTestType(e.target.value)}
                  >
                    <option value="Happy">Happy Path</option>
                    <option value="Boundary">Boundary Condition</option>
                    <option value="Edge">Edge Case</option>
                    <option value="Security">Security Vector</option>
                    <option value="Performance">Performance Test</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button 
                  id="btn-submit-add-test"
                  type="submit" 
                  className="btn btn-success btn-sm"
                >
                  Add Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
