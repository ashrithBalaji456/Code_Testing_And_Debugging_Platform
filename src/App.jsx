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
import { executeCode, executeCodeAsync } from './services/executionEngine';
import { runTests, generateTestsFromCode } from './services/testEngine';

import { Navbar } from './components/Navbar';
import { Editor } from './components/Editor';
import { DiffViewer } from './components/DiffViewer';
import { Terminal } from './components/Terminal';
import { ReviewHub } from './components/ReviewHub';
import { Debugger } from './components/Debugger';
import { TestRunner } from './components/TestRunner';
import { AiChat } from './components/AiChat';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ImportModal } from './components/ImportModal';
import { CiCdModal } from './components/CiCdModal';
import { ShareModal } from './components/ShareModal';
import { BenchmarkModal } from './components/BenchmarkModal';
import { ModernizeModal } from './components/ModernizeModal';
import { ReportModal } from './components/ReportModal';

export default function App() {
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const filteredSnippets = SNIPPETS.filter(s => s.language === selectedLanguage);

  const [selectedSnippetId, setSelectedSnippetId] = useState(SNIPPETS[0].id);
  const currentSnippet = SNIPPETS.find(s => s.id === selectedSnippetId) || filteredSnippets[0] || SNIPPETS[0];

  const [code, setCode] = useState(currentSnippet.code);
  const [fixedCode, setFixedCode] = useState(currentSnippet.fixedCode);
  const [activeTab, setActiveTab] = useState('review'); // 'review' | 'debug' | 'test'
  const [isDiffMode, setIsDiffMode] = useState(false);
  const [showCoverage, setShowCoverage] = useState(true);

  // Analysis & Testing state
  const [analysis, setAnalysis] = useState(() => analyzeCode(currentSnippet.code, currentSnippet.language));
  const [executionResult, setExecutionResult] = useState(null);
  const [testCases, setTestCases] = useState(currentSnippet.testCases);
  const [testResults, setTestResults] = useState(null);
  const [logs, setLogs] = useState([]);
  const [highlightedLine, setHighlightedLine] = useState(null);

  // Gemini API key state & modals
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCiCdModalOpen, setIsCiCdModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isBenchmarkModalOpen, setIsBenchmarkModalOpen] = useState(false);
  const [isModernizeModalOpen, setIsModernizeModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem('devpulse_theme') || 'obsidian');
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [isRunning, setIsRunning] = useState(false);

  // Sync theme with DOM root attribute
  useEffect(() => {
    if (currentTheme === 'obsidian') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', currentTheme);
    }
    localStorage.setItem('devpulse_theme', currentTheme);
  }, [currentTheme]);

  // Load shared workspace if URL has #share= hash
  useEffect(() => {
    if (window.location.hash.startsWith('#share=')) {
      try {
        const hashData = window.location.hash.replace('#share=', '');
        const decoded = JSON.parse(decodeURIComponent(escape(atob(hashData))));
        if (decoded && decoded.c) {
          setCode(decoded.c);
          if (decoded.l) setSelectedLanguage(decoded.l);
          setLogs(prev => [
            ...prev,
            { type: 'success', message: 'Successfully restored workspace session from shared URL hash.', time: new Date().toLocaleTimeString() }
          ]);
        }
      } catch (err) {
        console.warn('Could not parse share hash', err);
      }
    }
  }, []);

  const getFileName = () => {
    switch (selectedLanguage) {
      case 'python': return 'solution.py';
      case 'java': return 'Solution.java';
      case 'cpp': return 'solution.cpp';
      default: return 'solution.js';
    }
  };

  // Handle imported code
  const handleImportCode = (importedCode, lang) => {
    setCode(importedCode);
    if (lang) {
      setSelectedLanguage(lang);
    }
    setTestResults(null);
    setExecutionResult(null);
    setLogs(prev => [
      ...prev,
      { type: 'info', message: `Imported new code snippet (${lang || selectedLanguage}). Ready for analysis.`, time: new Date().toLocaleTimeString() }
    ]);
  };

  // Handle switching language
  const handleSelectLanguage = (newLang) => {
    setSelectedLanguage(newLang);
    const matching = SNIPPETS.filter(s => s.language === newLang);
    if (matching.length > 0) {
      handleSelectSnippet(matching[0].id);
    }
  };

  // When snippet changes, load its data
  const handleSelectSnippet = (snippetId) => {
    const snip = SNIPPETS.find(s => s.id === snippetId);
    if (!snip) return;

    setSelectedSnippetId(snippetId);
    if (snip.language) {
      setSelectedLanguage(snip.language);
    }
    setCode(snip.code);
    setFixedCode(snip.fixedCode);
    setTestCases(snip.testCases);
    setTestResults(null);
    setExecutionResult(null);
    setHighlightedLine(null);

    const initialAnalysis = analyzeCode(snip.code, snip.language);
    setAnalysis(initialAnalysis);

    setLogs([
      { type: 'info', message: `Switched language to [${snip.language.toUpperCase()}] - Loaded scenario: "${snip.name}"`, time: new Date().toLocaleTimeString() },
      { type: 'warn', message: `Notice: Code contains intentional bugs & vulnerabilities for demonstration.`, time: new Date().toLocaleTimeString() }
    ]);
  };

  // Re-run static analysis whenever code changes
  useEffect(() => {
    const res = analyzeCode(code, selectedLanguage);
    setAnalysis(res);
  }, [code, selectedLanguage]);

  // Execute Sandbox Run (with Pyodide WebAssembly for Python)
  const handleRunCode = async () => {
    setIsRunning(true);
    setLogs(prev => [
      ...prev,
      { type: 'info', message: `Initializing ${selectedLanguage.toUpperCase()} sandbox runtime...`, time: new Date().toLocaleTimeString() }
    ]);

    const result = await executeCodeAsync(code, selectedLanguage, (progressMsg) => {
      setLogs(prev => [
        ...prev,
        { type: 'info', message: progressMsg, time: new Date().toLocaleTimeString() }
      ]);
    });

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
    const res = analyzeCode(code, selectedLanguage);
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
        snippets={filteredSnippets}
        selectedSnippetId={selectedSnippetId}
        onSelectSnippet={handleSelectSnippet}
        selectedLanguage={selectedLanguage}
        onSelectLanguage={handleSelectLanguage}
        onRunAnalysis={handleRunAnalysis}
        onRunCode={handleRunCode}
        isDiffMode={isDiffMode}
        onToggleDiffMode={() => setIsDiffMode(!isDiffMode)}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenCiCdModal={() => setIsCiCdModalOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenBenchmarkModal={() => setIsBenchmarkModalOpen(true)}
        onOpenModernizeModal={() => setIsModernizeModalOpen(true)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        currentTheme={currentTheme}
        onSelectTheme={setCurrentTheme}
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
                <span>{getFileName()}</span>
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
              <button 
                className={`view-toggle-btn ${showCoverage ? 'active' : ''}`}
                onClick={() => setShowCoverage(!showCoverage)}
                title="Toggle line-level test coverage heatmap in editor"
              >
                Coverage Heatmap {testResults?.coveragePercent ? `(${testResults.coveragePercent}%)` : ''}
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
                coverageMap={testResults?.coverageMap || null}
                showCoverage={showCoverage}
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

        {/* Right Side: Quad-Mode Studio (Review, Debug, Test, AI Assistant) */}
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

            <button
              id="tab-btn-ai"
              className={`studio-tab-btn tab-ai ${activeTab === 'ai' ? 'active' : ''}`}
              onClick={() => setActiveTab('ai')}
            >
              <Sparkles size={15} color="#c084fc" />
              <span>AI Assistant</span>
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
              code={code}
              language={selectedLanguage}
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
              language={selectedLanguage}
              testCases={testCases}
              testResults={testResults}
              onRunAllTests={handleRunAllTests}
              onGenerateTests={handleGenerateTests}
              onAddTestCase={handleAddTestCase}
              onDeleteTestCase={handleDeleteTestCase}
              isRunningTests={isRunning}
            />
          )}

          {activeTab === 'ai' && (
            <AiChat
              code={code}
              language={selectedLanguage}
              analysis={analysis}
              executionResult={executionResult}
              apiKey={geminiApiKey}
              onApplyCodeToEditor={(newCode) => setCode(newCode)}
            />
          )}
        </section>
      </main>

      {/* Code Importer Modal (GitHub / Local File / Raw) */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportCode={handleImportCode}
      />

      {/* CI/CD GitHub Actions Modal */}
      <CiCdModal
        isOpen={isCiCdModalOpen}
        onClose={() => setIsCiCdModalOpen(false)}
        language={selectedLanguage}
      />

      {/* Workspace Share & JSON Export Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        code={code}
        language={selectedLanguage}
        analysis={analysis}
        testCases={testCases}
      />

      {/* Performance Benchmark Modal */}
      <BenchmarkModal
        isOpen={isBenchmarkModalOpen}
        onClose={() => setIsBenchmarkModalOpen(false)}
        originalCode={code}
        fixedCode={fixedCode}
        language={selectedLanguage}
      />

      {/* Modern Idioms & Strict Types Auto-Refactor Modal */}
      <ModernizeModal
        isOpen={isModernizeModalOpen}
        onClose={() => setIsModernizeModalOpen(false)}
        code={code}
        language={selectedLanguage}
        onApplyModernCode={(modernCode) => setCode(modernCode)}
      />

      {/* Executive Audit PDF & Printable Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        analysis={analysis}
        testResults={testResults}
        language={selectedLanguage}
        code={code}
      />

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
