import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Bug, 
  TestTube2, 
  Sparkles, 
  GitCompare, 
  Terminal as TermIcon,
  SearchCode,
  Play,
  RotateCcw
} from 'lucide-react';

import { SNIPPETS } from './data/snippets';
import { analyzeCode } from './services/analyzerEngine';
import { executeCode } from './services/executionEngine';
import { runTests, generateTestsFromCode } from './services/testEngine';

import { Navbar } from './components/Navbar';
import { Editor } from './components/Editor';
import { DiffViewer } from './components/DiffViewer';
import { Terminal } from './components/Terminal';
import { ReviewHub } from './components/ReviewHub';
import { Debugger } from './components/Debugger';
import { TestRunner } from './components/TestRunner';
import { ApiKeyModal } from './components/ApiKeyModal';

export default function App() {
  const [selectedSnippetId, setSelectedSnippetId] = useState(SNIPPETS[0].id);
  const currentSnippet = SNIPPETS.find(s => s.id === selectedSnippetId) || SNIPPETS[0];

  const [code, setCode] = useState(currentSnippet.code);
  const [fixedCode, setFixedCode] = useState(currentSnippet.fixedCode);
  const [activeTab, setActiveTab] = useState('review'); // 'review' | 'debug' | 'test'
  const [isDiffMode, setIsDiffMode] = useState(false);

  // Analysis & Testing state
  const [analysis, setAnalysis] = useState(() => analyzeCode(currentSnippet.code));
  const [executionResult, setExecutionResult] = useState(null);
  const [testCases, setTestCases] = useState(currentSnippet.testCases);
  const [testResults, setTestResults] = useState(null);
  const [logs, setLogs] = useState([]);
  const [highlightedLine, setHighlightedLine] = useState(null);

  // Gemini API key state
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [isRunning, setIsRunning] = useState(false);

  // When snippet changes, load its data
  const handleSelectSnippet = (snippetId) => {
    const snip = SNIPPETS.find(s => s.id === snippetId);
    if (!snip) return;

    setSelectedSnippetId(snippetId);
    setCode(snip.code);
    setFixedCode(snip.fixedCode);
    setTestCases(snip.testCases);
    setTestResults(null);
    setExecutionResult(null);
    setHighlightedLine(null);

    const initialAnalysis = analyzeCode(snip.code);
    setAnalysis(initialAnalysis);

    setLogs([
      { type: 'info', message: `Loaded scenario: "${snip.name}"`, time: new Date().toLocaleTimeString() },
      { type: 'warn', message: `Notice: Code contains intentional bugs & vulnerabilities for demonstration.`, time: new Date().toLocaleTimeString() }
    ]);
  };

  // Re-run static analysis whenever code changes
  useEffect(() => {
    const res = analyzeCode(code);
    setAnalysis(res);
  }, [code]);

  // Execute Sandbox Run
  const handleRunCode = () => {
    setIsRunning(true);
    const result = executeCode(code);
    setExecutionResult(result);
    setLogs(prev => [...prev, ...result.logs]);

    if (!result.success) {
      setActiveTab('debug');
      if (result.error?.line) {
        setHighlightedLine(result.error.line);
      }
    }

    setIsRunning(false);
  };

  // Manual Trigger for Review & Audit
  const handleRunAnalysis = () => {
    setIsRunning(true);
    const res = analyzeCode(code);
    setAnalysis(res);
    setActiveTab('review');

    setLogs(prev => [
      ...prev,
      { 
        type: res.findings.length > 0 ? 'warn' : 'success', 
        message: `Code Audit Complete: Score ${res.score}/100 (${res.grade}). ${res.findings.length} findings identified.`, 
        time: new Date().toLocaleTimeString() 
      }
    ]);

    setIsRunning(false);
  };

  // Run Test Suite
  const handleRunAllTests = () => {
    setIsRunning(true);
    const results = runTests(code, testCases);
    setTestResults(results);

    setLogs(prev => [
      ...prev,
      { 
        type: results.failedCount === 0 ? 'success' : 'error', 
        message: `Test Suite: ${results.passedCount}/${results.totalCount} passed (${results.coveragePercent}%) in ${results.durationMs}ms`, 
        time: new Date().toLocaleTimeString() 
      }
    ]);

    setIsRunning(false);
  };

  // Apply single finding fix
  const handleApplyFix = (finding) => {
    if (!finding.suggestedFix) return;
    const lines = code.split('\n');
    if (lines[finding.line - 1] !== undefined) {
      lines[finding.line - 1] = finding.suggestedFix;
      const updatedCode = lines.join('\n');
      setCode(updatedCode);

      setLogs(prev => [
        ...prev,
        { type: 'success', message: `Applied automated patch to Line ${finding.line}: "${finding.title}"`, time: new Date().toLocaleTimeString() }
      ]);
    }
  };

  // Apply full hardened/fixed code
  const handleApplyFixedCode = () => {
    setCode(fixedCode);
    setIsDiffMode(false);
    setLogs(prev => [
      ...prev,
      { type: 'success', message: `Successfully applied refactored and hardened code into editor.`, time: new Date().toLocaleTimeString() }
    ]);
  };

  // Synthesize new unit tests
  const handleGenerateTests = () => {
    const generated = generateTestsFromCode(code);
    setTestCases(generated);
    setTestResults(null);
    setLogs(prev => [
      ...prev,
      { type: 'info', message: `Synthesized ${generated.length} unit test assertions from function signature.`, time: new Date().toLocaleTimeString() }
    ]);
  };

  // Add custom test
  const handleAddTestCase = (tc) => {
    setTestCases(prev => [...prev, tc]);
  };

  // Delete test
  const handleDeleteTestCase = (id) => {
    setTestCases(prev => prev.filter(tc => tc.id !== id));
  };

  // Save API key
  const handleSaveApiKey = (key) => {
    setGeminiApiKey(key);
    if (key) {
      localStorage.setItem('gemini_api_key', key);
    } else {
      localStorage.removeItem('gemini_api_key');
    }
  };

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <Navbar
        snippets={SNIPPETS}
        selectedSnippetId={selectedSnippetId}
        onSelectSnippet={handleSelectSnippet}
        onRunAnalysis={handleRunAnalysis}
        onRunCode={handleRunCode}
        isDiffMode={isDiffMode}
        onToggleDiffMode={() => setIsDiffMode(!isDiffMode)}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        hasApiKey={!!geminiApiKey}
        isRunning={isRunning}
      />

      {/* Main Split Workbench */}
      <main className="workbench-body">
        {/* Left Side: Code Editor or Diff Viewer + Terminal */}
        <section className="editor-workspace">
          <div className="editor-header">
            <div className="editor-tabs">
              <div className="editor-tab-item">
                <span className="editor-tab-badge" />
                <span>solution.js</span>
              </div>
            </div>

            <div className="editor-view-toggles">
              <button 
                className={`view-toggle-btn ${!isDiffMode ? 'active' : ''}`}
                onClick={() => setIsDiffMode(false)}
              >
                Editor
              </button>
              <button 
                className={`view-toggle-btn ${isDiffMode ? 'active' : ''}`}
                onClick={() => setIsDiffMode(true)}
              >
                Diff Compare
              </button>
            </div>
          </div>

          {/* Editor Canvas or Diff Viewer */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {isDiffMode ? (
              <DiffViewer
                originalCode={code}
                fixedCode={fixedCode}
                onApplyFixedCode={handleApplyFixedCode}
                onClose={() => setIsDiffMode(false)}
              />
            ) : (
              <Editor
                code={code}
                onChange={setCode}
                findings={analysis.findings}
                runtimeErrorLine={executionResult?.error?.line}
                activeLine={highlightedLine}
                onLineClick={(line) => setHighlightedLine(line)}
              />
            )}
          </div>

          {/* Bottom Execution Terminal */}
          <Terminal
            logs={logs}
            onClear={() => setLogs([])}
            duration={executionResult?.duration || null}
            hasError={!!executionResult?.error}
          />
        </section>

        {/* Right Side: Tri-Mode Studio (Review, Debug, Test) */}
        <section className="studio-workspace">
          {/* Studio Tab Navigation */}
          <div className="studio-tabs-bar">
            <button
              id="tab-btn-review"
              className={`studio-tab-btn tab-review ${activeTab === 'review' ? 'active' : ''}`}
              onClick={() => setActiveTab('review')}
            >
              <SearchCode size={15} />
              <span>Code Review</span>
              <span className="studio-tab-counter">
                {analysis.findings.length}
              </span>
            </button>

            <button
              id="tab-btn-debug"
              className={`studio-tab-btn tab-debug ${activeTab === 'debug' ? 'active' : ''}`}
              onClick={() => setActiveTab('debug')}
            >
              <Bug size={15} />
              <span>Debugger</span>
              {executionResult?.error && (
                <span className="studio-tab-counter" style={{ background: 'var(--accent-rose)', color: '#fff' }}>
                  1
                </span>
              )}
            </button>

            <button
              id="tab-btn-test"
              className={`studio-tab-btn tab-test ${activeTab === 'test' ? 'active' : ''}`}
              onClick={() => setActiveTab('test')}
            >
              <TestTube2 size={15} />
              <span>Test Suite</span>
              <span className="studio-tab-counter">
                {testCases.length}
              </span>
            </button>
          </div>

          {/* Studio Content Mode */}
          {activeTab === 'review' && (
            <ReviewHub
              analysis={analysis}
              onApplyFix={handleApplyFix}
              onLineClick={(line) => setHighlightedLine(line)}
            />
          )}

          {activeTab === 'debug' && (
            <Debugger
              executionResult={executionResult}
              stepTrace={currentSnippet.stepTrace || []}
              simulatedError={currentSnippet.simulatedTrace || null}
              onApplyDiagnosisFix={handleApplyFixedCode}
              onHighlightLine={(line) => setHighlightedLine(line)}
            />
          )}

          {activeTab === 'test' && (
            <TestRunner
              code={code}
              testCases={testCases}
              testResults={testResults}
              onRunAllTests={handleRunAllTests}
              onGenerateTests={handleGenerateTests}
              onAddTestCase={handleAddTestCase}
              onDeleteTestCase={handleDeleteTestCase}
              isRunningTests={isRunning}
            />
          )}
        </section>
      </main>

      {/* Optional Gemini AI Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSaveKey={handleSaveApiKey}
        currentKey={geminiApiKey}
      />
    </div>
  );
}
