import React, { useState, useEffect, useMemo } from 'react';
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
import { runTests, generateTestsFromCode, calculateLineCoverage } from './services/testEngine';
import { generateAiTestCases, rewriteCodeWithAi } from './services/geminiService';

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
  // 1. Language: restored from localStorage or default 'javascript'
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    return localStorage.getItem('devpulse_language') || 'javascript';
  });
  const filteredSnippets = SNIPPETS.filter(s => s.language === selectedLanguage);

  // 2. Scenario snippet ID: restored from localStorage or first snippet of language
  const [selectedSnippetId, setSelectedSnippetId] = useState(() => {
    const saved = localStorage.getItem('devpulse_snippet_id');
    if (saved && SNIPPETS.some(s => s.id === saved)) {
      return saved;
    }
    const savedLang = localStorage.getItem('devpulse_language') || 'javascript';
    const match = SNIPPETS.find(s => s.language === savedLang);
    return match ? match.id : SNIPPETS[0].id;
  });
  const currentSnippet = SNIPPETS.find(s => s.id === selectedSnippetId) || filteredSnippets[0] || SNIPPETS[0];

  // 3. Editor code: restored from localStorage if user edited, otherwise snippet default
  const [code, setCode] = useState(() => {
    const saved = localStorage.getItem('devpulse_code');
    if (saved !== null && saved.trim().length > 0) {
      return saved;
    }
    return currentSnippet.code;
  });
  const [fixedCode, setFixedCode] = useState(currentSnippet.fixedCode);

  // 4. Studio Active Tab: restored from localStorage ('review' | 'debug' | 'test' | 'ai')
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('devpulse_active_tab');
    if (saved && ['review', 'debug', 'test', 'ai'].includes(saved)) {
      return saved;
    }
    return 'review';
  });

  const [isDiffMode, setIsDiffMode] = useState(() => {
    return localStorage.getItem('devpulse_is_diff_mode') === 'true';
  });

  const [showCoverage, setShowCoverage] = useState(() => {
    const saved = localStorage.getItem('devpulse_show_coverage');
    return saved !== null ? saved === 'true' : true;
  });

  // 5. Test Cases: restored from localStorage if custom
  const [testCases, setTestCases] = useState(() => {
    const saved = localStorage.getItem('devpulse_test_cases');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return currentSnippet.testCases || [];
  });

  // Analysis & Testing state
  const [analysis, setAnalysis] = useState(() => analyzeCode(code || currentSnippet.code, selectedLanguage || currentSnippet.language));
  const [executionResult, setExecutionResult] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [logs, setLogs] = useState([]);
  const [highlightedLine, setHighlightedLine] = useState(null);

  // Dynamic code coverage calculated from active test cases or execution results
  const activeCoverageData = useMemo(() => {
    if (testResults?.coverageMap) {
      return {
        coverageMap: testResults.coverageMap,
        percentage: testResults.coveragePercent
      };
    }
    return calculateLineCoverage(code, testCases);
  }, [code, testCases, testResults]);

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
  const [isGeneratingAiTests, setIsGeneratingAiTests] = useState(false);
  const [isAiRewriting, setIsAiRewriting] = useState(false);
  const [apiKeyPromptMessage, setApiKeyPromptMessage] = useState('');

  // Auto-persist state changes to localStorage so page refresh never loses user work
  useEffect(() => {
    localStorage.setItem('devpulse_code', code);
  }, [code]);

  useEffect(() => {
    localStorage.setItem('devpulse_language', selectedLanguage);
  }, [selectedLanguage]);

  useEffect(() => {
    localStorage.setItem('devpulse_snippet_id', selectedSnippetId);
  }, [selectedSnippetId]);

  useEffect(() => {
    localStorage.setItem('devpulse_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('devpulse_is_diff_mode', String(isDiffMode));
  }, [isDiffMode]);

  useEffect(() => {
    localStorage.setItem('devpulse_show_coverage', String(showCoverage));
  }, [showCoverage]);

  useEffect(() => {
    try {
      localStorage.setItem('devpulse_test_cases', JSON.stringify(testCases));
    } catch (e) {}
  }, [testCases]);

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
    if (selectedLanguage === 'java') {
      const match = code.match(/public\s+class\s+([a-zA-Z0-9_]+)/) || code.match(/class\s+([a-zA-Z0-9_]+)/);
      if (match) return `${match[1]}.java`;
      return 'Solution.java';
    }
    if (selectedLanguage === 'cpp') {
      const match = code.match(/class\s+([a-zA-Z0-9_]+)/) || code.match(/struct\s+([a-zA-Z0-9_]+)/);
      if (match) return `${match[1]}.cpp`;
      return 'solution.cpp';
    }
    if (selectedLanguage === 'python') {
      const match = code.match(/class\s+([a-zA-Z0-9_]+)/) || code.match(/def\s+([a-zA-Z0-9_]+)/);
      if (match) return `${match[1]}.py`;
      return 'solution.py';
    }
    if (selectedLanguage === 'javascript') {
      const match = code.match(/class\s+([a-zA-Z0-9_]+)/) || code.match(/function\s+([a-zA-Z0-9_]+)/);
      if (match) return `${match[1]}.js`;
      return 'solution.js';
    }
    return 'solution.js';
  };

  // Helper: In-place code repair engine for any custom or pasted user code
  const generateRepairedCode = (sourceCode, findings) => {
    // If user has not changed preset snippet, preserve dedicated preset fixedCode
    const preset = SNIPPETS.find(s => s.id === selectedSnippetId);
    if (preset && sourceCode.trim() === preset.code.trim() && preset.fixedCode) {
      return preset.fixedCode;
    }

    if (!findings || findings.length === 0) {
      return sourceCode;
    }

    let lines = sourceCode.split('\n');
    // Sort descending by line number so lines don't shift when patched
    const sorted = [...findings]
      .filter(f => f.suggestedFix && f.line > 0 && f.line <= lines.length)
      .sort((a, b) => b.line - a.line);

    for (const f of sorted) {
      lines[f.line - 1] = f.suggestedFix;
    }

    return lines.join('\n');
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

  // Reset editor code to current scenario default template
  const handleResetToDefault = () => {
    setCode(currentSnippet.code);
    setFixedCode(currentSnippet.fixedCode);
    setTestCases(currentSnippet.testCases);
    setTestResults(null);
    setExecutionResult(null);
    const initialAnalysis = analyzeCode(currentSnippet.code, selectedLanguage);
    setAnalysis(initialAnalysis);
    setLogs(prev => [
      ...prev,
      { type: 'info', message: `Reset editor code back to "${currentSnippet.name}" default template.`, time: new Date().toLocaleTimeString() }
    ]);
  };

  // Re-run static analysis & compute in-place repaired code whenever code changes
  useEffect(() => {
    // Auto-detect language if code has obvious language signatures
    if (selectedLanguage !== 'java' && (/import\s+java\.|public\s+class\s+|System\.out\.print/i.test(code))) {
      setSelectedLanguage('java');
      return;
    }
    if (selectedLanguage !== 'cpp' && (/#include\s+<iostream>|std::vector|std::cout/i.test(code))) {
      setSelectedLanguage('cpp');
      return;
    }
    if (selectedLanguage !== 'python' && (/def\s+[a-zA-Z0-9_]+\s*\(.*:\s*$/m.test(code) && !/function\s|const\s|let\s/i.test(code))) {
      setSelectedLanguage('python');
      return;
    }

    const res = analyzeCode(code, selectedLanguage);
    setAnalysis(res);

    // Ensure fixedCode always reflects the user's repaired code
    const repaired = generateRepairedCode(code, res.findings);
    setFixedCode(repaired);
  }, [code, selectedLanguage, selectedSnippetId]);

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
    let targetIdx = finding.line - 1;

    // Verify if line at targetIdx matches originalCode
    if (
      targetIdx < 0 ||
      targetIdx >= lines.length ||
      (finding.originalCode && lines[targetIdx].trim() !== finding.originalCode.trim())
    ) {
      // Find the line that matches originalCode closest to targetIdx
      const foundIdx = lines.findIndex(l => l.trim() === finding.originalCode?.trim());
      if (foundIdx !== -1) {
        targetIdx = foundIdx;
      }
    }

    if (lines[targetIdx] !== undefined) {
      lines[targetIdx] = finding.suggestedFix;
      const updatedCode = lines.join('\n');
      setCode(updatedCode);

      // Immediately run analyzer and update analysis & fixedCode synchronously
      const nextAnalysis = analyzeCode(updatedCode, selectedLanguage);
      setAnalysis(nextAnalysis);
      const repaired = generateRepairedCode(updatedCode, nextAnalysis.findings);
      setFixedCode(repaired);

      setLogs(prev => [
        ...prev,
        { type: 'success', message: `Applied automated patch to Line ${targetIdx + 1}: "${finding.title}"`, time: new Date().toLocaleTimeString() }
      ]);
    }
  };

  // Apply all available automated fixes at once
  const handleApplyAllFixes = () => {
    if (!analysis?.findings) return;
    const fixableFindings = analysis.findings.filter(f => f.suggestedFix);
    if (fixableFindings.length === 0) return;

    let updatedCode = code;
    for (const f of fixableFindings) {
      const lines = updatedCode.split('\n');
      let targetIdx = f.line - 1;
      if (
        targetIdx < 0 ||
        targetIdx >= lines.length ||
        (f.originalCode && lines[targetIdx].trim() !== f.originalCode.trim())
      ) {
        const foundIdx = lines.findIndex(l => l.trim() === f.originalCode?.trim());
        if (foundIdx !== -1) {
          targetIdx = foundIdx;
        }
      }
      if (lines[targetIdx] !== undefined) {
        lines[targetIdx] = f.suggestedFix;
        updatedCode = lines.join('\n');
      }
    }

    setCode(updatedCode);
    const nextAnalysis = analyzeCode(updatedCode, selectedLanguage);
    setAnalysis(nextAnalysis);
    const repaired = generateRepairedCode(updatedCode, nextAnalysis.findings);
    setFixedCode(repaired);

    setLogs(prev => [
      ...prev,
      { type: 'success', message: `Successfully applied all ${fixableFindings.length} automated patches.`, time: new Date().toLocaleTimeString() }
    ]);
  };

  // Apply full hardened/fixed code
  const handleApplyFixedCode = () => {
    setCode(fixedCode);
    setIsDiffMode(false);
    
    // Automatically re-evaluate test suite against the freshly applied code
    const results = runTests(fixedCode, testCases);
    setTestResults(results);

    setLogs(prev => [
      ...prev,
      { type: 'success', message: `Successfully applied refactored and hardened code into editor. Test Suite auto-executed: ${results.passedCount}/${results.totalCount} passed.`, time: new Date().toLocaleTimeString() }
    ]);
  };

  // AI-powered or heuristic unit test generation
  const handleGenerateTests = async () => {
    if (!geminiApiKey) {
      setApiKeyPromptMessage('To generate custom unit test cases specifically crafted for your code, please enter your free Google Gemini API key:');
      setIsApiKeyModalOpen(true);
      return;
    }

    setIsGeneratingAiTests(true);
    setLogs(prev => [
      ...prev,
      { type: 'info', message: `Sending [${selectedLanguage.toUpperCase()}] code to Gemini AI to generate tailored unit tests...`, time: new Date().toLocaleTimeString() }
    ]);

    try {
      const generated = await generateAiTestCases(geminiApiKey, code, selectedLanguage);
      setTestCases(generated);
      setTestResults(null);
      setLogs(prev => [
        ...prev,
        { type: 'success', message: `Gemini AI synthesized ${generated.length} tailored unit tests for your code! Executing test suite...`, time: new Date().toLocaleTimeString() }
      ]);

      // Automatically execute the freshly generated tests
      const results = runTests(code, generated);
      setTestResults(results);
      setLogs(prev => [
        ...prev,
        { 
          type: results.failedCount === 0 ? 'success' : 'warn', 
          message: `AI Test Suite: ${results.passedCount}/${results.totalCount} passed (${results.coveragePercent}% coverage) in ${results.durationMs}ms`, 
          time: new Date().toLocaleTimeString() 
        }
      ]);
    } catch (err) {
      setLogs(prev => [
        ...prev,
        { type: 'error', message: `Gemini Test Generation Error: ${err.message}`, time: new Date().toLocaleTimeString() }
      ]);
      if (err.message.includes('API key') || err.message.includes('403') || err.message.includes('400')) {
        setApiKeyPromptMessage('Your Gemini API key appears invalid or expired. Please verify it below:');
        setIsApiKeyModalOpen(true);
      }
    } finally {
      setIsGeneratingAiTests(false);
    }
  };

  // AI-powered code rewrite & hardening
  const handleAiRewrite = async () => {
    if (!geminiApiKey) {
      setApiKeyPromptMessage('To have Gemini AI rewrite, modernize, and harden your code, please enter your free Google Gemini API key:');
      setIsApiKeyModalOpen(true);
      return;
    }

    setIsAiRewriting(true);
    setIsRunning(true);
    setLogs(prev => [
      ...prev,
      { type: 'info', message: `Sending code to Gemini AI to generate an optimized, bug-free, and hardened rewrite...`, time: new Date().toLocaleTimeString() }
    ]);

    try {
      const rewritten = await rewriteCodeWithAi(geminiApiKey, code, selectedLanguage, analysis.findings);
      setFixedCode(rewritten);
      setIsDiffMode(true);
      setLogs(prev => [
        ...prev,
        { type: 'success', message: `Gemini AI successfully rewrote and hardened your code! Review the side-by-side diff in the editor and click 'Apply Hardened Code' to drop it into your workspace.`, time: new Date().toLocaleTimeString() }
      ]);
    } catch (err) {
      setLogs(prev => [
        ...prev,
        { type: 'error', message: `Gemini Code Rewrite Error: ${err.message}`, time: new Date().toLocaleTimeString() }
      ]);
      if (err.message.includes('API key') || err.message.includes('403') || err.message.includes('400')) {
        setApiKeyPromptMessage('Your Gemini API key appears invalid or expired. Please verify it below:');
        setIsApiKeyModalOpen(true);
      }
    } finally {
      setIsAiRewriting(false);
      setIsRunning(false);
    }
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
                id="btn-toggle-coverage"
                className={`view-toggle-btn ${showCoverage ? 'active' : ''}`}
                onClick={() => setShowCoverage(!showCoverage)}
                title="Toggle line-level test coverage heatmap in editor"
              >
                Coverage Heatmap ({activeCoverageData.percentage}%)
              </button>

              <button 
                id="btn-ai-rewrite"
                className="view-toggle-btn"
                onClick={handleAiRewrite}
                disabled={isAiRewriting}
                title="Ask Gemini AI to rewrite, harden, and optimize your code"
                style={{
                  color: '#c084fc',
                  borderColor: 'rgba(192, 132, 252, 0.4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontWeight: 600
                }}
              >
                <Sparkles size={12} className={isAiRewriting ? 'spin' : ''} color="#c084fc" />
                <span>{isAiRewriting ? 'Rewriting with AI...' : 'AI Rewrite'}</span>
              </button>

              {code.trim() !== currentSnippet.code.trim() && (
                <button 
                  id="btn-reset-code"
                  className="view-toggle-btn"
                  onClick={handleResetToDefault}
                  title="Revert all edits back to the original preset scenario template"
                  style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <RotateCcw size={12} />
                  <span>Reset Code</span>
                </button>
              )}
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
                coverageMap={activeCoverageData.coverageMap}
                coveragePercent={activeCoverageData.percentage}
                showCoverage={showCoverage}
                onRunTests={handleRunAllTests}
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
              onApplyAllFixes={handleApplyAllFixes}
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
              isGeneratingAiTests={isGeneratingAiTests}
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
        promptMessage={apiKeyPromptMessage}
      />
    </div>
  );
}
