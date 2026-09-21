import React, { useRef, useState, useEffect } from 'react';
import { 
  Code2, 
  Play, 
  SearchCode, 
  GitCompare, 
  Key, 
  Sparkles, 
  RefreshCw, 
  FileCode2, 
  Upload,
  GitBranch,
  Share2,
  Palette,
  Gauge,
  FileText,
  ChevronLeft,
  ChevronRight,
  Dna,
  ShieldAlert,
  FlaskConical
} from 'lucide-react';

import { CustomDropdown } from './CustomDropdown';

export function Navbar({
  snippets,
  selectedSnippetId,
  onSelectSnippet,
  selectedLanguage,
  onSelectLanguage,
  onRunAnalysis,
  onRunCode,
  isDiffMode,
  onToggleDiffMode,
  onOpenApiKeyModal,
  onOpenImportModal,
  onOpenCiCdModal,
  onOpenShareModal,
  onOpenBenchmarkModal,
  onOpenSecurityModal,
  securityCount = 0,
  onOpenFuzzModal,
  onOpenModernizeModal,
  onOpenReportModal,
  onOpenMutationModal,
  currentTheme = 'obsidian',
  onSelectTheme,
  hasApiKey,
  isRunning
}) {
  const navbarRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (navbarRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = navbarRef.current;
      setCanScrollLeft(scrollLeft > 6);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
    }
  };

  useEffect(() => {
    checkScroll();
    const handleResize = () => checkScroll();
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(checkScroll, 200);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [snippets, selectedLanguage]);

  const handleScrollBy = (distance) => {
    if (navbarRef.current) {
      navbarRef.current.scrollBy({ left: distance, behavior: 'smooth' });
      setTimeout(checkScroll, 250);
    }
  };

  const handleWheel = (e) => {
    if (navbarRef.current && e.deltaY !== 0) {
      navbarRef.current.scrollLeft += e.deltaY;
      checkScroll();
    }
  };

  const currentSnippet = snippets.find((s) => s.id === selectedSnippetId);

  const languageOptions = [
    { value: 'javascript', label: 'JavaScript (ES2024)', badge: 'JS', badgeColor: '#f7df1e' },
    { value: 'python', label: 'Python 3.12 (WASM)', badge: 'PY', badgeColor: '#38bdf8' },
    { value: 'java', label: 'Java (OpenJDK 21)', badge: 'JAVA', badgeColor: '#f97316' },
    { value: 'cpp', label: 'C++ (C++20)', badge: 'C++', badgeColor: '#a855f7' },
  ];

  const scenarioOptions = snippets.map((snip) => ({
    value: snip.id,
    label: snip.name,
    badge: snip.language?.toUpperCase() || 'CODE',
    badgeColor: snip.language === 'python' ? '#38bdf8' : snip.language === 'java' ? '#f97316' : snip.language === 'cpp' ? '#a855f7' : '#f7df1e'
  }));

  const themeOptions = [
    { value: 'obsidian', label: 'Obsidian Dark', dotColor: '#6366f1' },
    { value: 'cyberpunk', label: 'Cyberpunk Neon', dotColor: '#ec4899' },
    { value: 'tokyo', label: 'Tokyo Midnight', dotColor: '#7aa2f7' },
    { value: 'monokai', label: 'Monokai Pro', dotColor: '#ffd866' },
  ];

  return (
    <header className="navbar-wrapper">
      {canScrollLeft && (
        <button 
          className="navbar-scroll-btn left"
          onClick={() => handleScrollBy(-280)}
          title="Scroll header left"
          aria-label="Scroll header left"
        >
          <ChevronLeft size={16} />
        </button>
      )}

      <div 
        className="navbar" 
        ref={navbarRef}
        onScroll={checkScroll}
        onWheel={handleWheel}
      >
        <div className="brand-section">
          <div className="brand-logo-wrapper">
            <Code2 size={20} strokeWidth={2.5} />
          </div>
          <div className="brand-info">
            <h1 className="brand-title">
              DevPulse <span className="brand-badge">Studio</span>
            </h1>
          </div>
        </div>

        <div className="navbar-controls">
          {/* Custom Language Selector */}
          <CustomDropdown
            id="language-select"
            label="Language:"
            value={selectedLanguage || 'javascript'}
            options={languageOptions}
            onChange={(val) => onSelectLanguage && onSelectLanguage(val)}
            title="Select Programming Language"
            minWidth={175}
            maxWidth={220}
          />

          {/* Custom Preset Scenario Selector */}
          <CustomDropdown
            id="snippet-select"
            icon={FileCode2}
            label="Scenario:"
            value={selectedSnippetId}
            options={scenarioOptions}
            onChange={(val) => onSelectSnippet && onSelectSnippet(val)}
            title={currentSnippet ? `Scenario: ${currentSnippet.name}` : 'Select Preset Scenario'}
            minWidth={240}
            maxWidth={320}
          />

          {/* Custom Theme Switcher */}
          <CustomDropdown
            id="theme-select"
            icon={Palette}
            label="Theme:"
            value={currentTheme || 'obsidian'}
            options={themeOptions}
            onChange={(val) => onSelectTheme && onSelectTheme(val)}
            title="Switch Studio Theme"
            minWidth={160}
            maxWidth={190}
          />

          <button 
            id="toggle-diff-btn"
            className={`btn ${isDiffMode ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={onToggleDiffMode}
            title="Compare original code with AI/auto-fixed code"
          >
            <GitCompare size={15} />
            <span>{isDiffMode ? 'Exit Diff' : 'Diff View'}</span>
          </button>
        </div>

        {/* Dynamic spacer that pushes nav-actions to the right when there is space */}
        <div className="navbar-spacer" />

        <div className="nav-actions">
        <button 
          id="btn-run-code"
          className="btn btn-secondary"
          onClick={onRunCode}
          disabled={isRunning}
          title="Execute code in safe browser sandbox (or Pyodide WASM)"
        >
          <Play size={14} fill="currentColor" color="var(--accent-emerald)" />
          <span>Run Sandbox</span>
        </button>

        <button 
          id="btn-run-analysis"
          className="btn btn-primary"
          onClick={onRunAnalysis}
          disabled={isRunning}
          title="Trigger comprehensive Code Review & Quality Audit"
        >
          {isRunning ? (
            <RefreshCw size={14} className="spin" />
          ) : (
            <SearchCode size={15} />
          )}
          <span>Review & Audit</span>
        </button>

        <button 
          id="btn-import-code"
          className="btn btn-secondary btn-sm"
          onClick={onOpenImportModal}
          title="Import code from GitHub or local file"
        >
          <Upload size={14} />
          <span>Import</span>
        </button>

        <button 
          id="btn-share"
          className="btn btn-secondary btn-sm"
          onClick={onOpenShareModal}
          title="Share Workspace Link or Export JSON Audit"
        >
          <Share2 size={14} />
          <span>Share</span>
        </button>

        <button 
          id="btn-benchmark"
          className="btn btn-secondary btn-sm"
          onClick={onOpenBenchmarkModal}
          title="Side-by-Side Performance & Throughput Benchmark"
        >
          <Gauge size={14} />
          <span>Benchmark</span>
        </button>

        <button 
          id="btn-security-nav"
          className="btn btn-secondary btn-sm"
          onClick={onOpenSecurityModal}
          title="Deep SAST Security & Vulnerability Scanner (OWASP / CWE / CVSS)"
          style={{
            background: securityCount > 0 ? 'rgba(244, 63, 94, 0.08)' : undefined,
            borderColor: securityCount > 0 ? 'rgba(244, 63, 94, 0.4)' : undefined,
            color: securityCount > 0 ? '#fb7185' : undefined,
            gap: '6px'
          }}
        >
          <ShieldAlert size={14} color={securityCount > 0 ? '#fb7185' : 'currentColor'} />
          <span>Security</span>
          {securityCount > 0 && (
            <span className="studio-tab-counter" style={{ background: '#f43f5e', color: '#fff', fontSize: '10px', padding: '1px 5px' }}>
              {securityCount}
            </span>
          )}
        </button>

        <button 
          id="btn-mutation-nav"
          className="btn btn-secondary btn-sm"
          onClick={onOpenMutationModal}
          title="In-Browser Mutation Testing Arena (Stress-test your test suite)"
          style={{
            background: 'rgba(168, 85, 247, 0.08)',
            borderColor: 'rgba(168, 85, 247, 0.3)',
            color: '#c084fc'
          }}
        >
          <Dna size={14} color="#c084fc" />
          <span>Mutation</span>
        </button>

        <button 
          id="btn-fuzz-nav"
          className="btn btn-secondary btn-sm"
          onClick={onOpenFuzzModal}
          title="Automated Property-Based & Adversarial Edge-Case Fuzzer"
          style={{
            background: 'rgba(6, 182, 212, 0.08)',
            borderColor: 'rgba(6, 182, 212, 0.3)',
            color: '#38bdf8'
          }}
        >
          <FlaskConical size={14} color="#38bdf8" />
          <span>Fuzz</span>
        </button>

        <button 
          id="btn-modernize"
          className="btn btn-secondary btn-sm"
          onClick={onOpenModernizeModal}
          title="Auto-refactor to Modern Language Idioms & Types"
        >
          <Sparkles size={14} color="#c084fc" />
          <span>Modernize</span>
        </button>

        <button 
          id="btn-report"
          className="btn btn-secondary btn-sm"
          onClick={onOpenReportModal}
          title="Print or Save Executive PDF Audit Report"
        >
          <FileText size={14} />
          <span>Report</span>
        </button>

        <button 
          id="btn-api-key"
          className={`btn ${hasApiKey ? 'btn-ai' : 'btn-secondary'} btn-sm`}
          onClick={onOpenApiKeyModal}
          title={hasApiKey ? 'Gemini AI API Key is Active' : 'Configure Optional Gemini AI Key'}
        >
          <Key size={14} />
          <span>{hasApiKey ? 'AI Active' : 'API Key'}</span>
        </button>
      </div>
      </div>

      {canScrollRight && (
        <button 
          className="navbar-scroll-btn right"
          onClick={() => handleScrollBy(280)}
          title="Scroll header right to see all tools"
          aria-label="Scroll header right"
        >
          <ChevronRight size={16} />
        </button>
      )}
    </header>
  );
}

