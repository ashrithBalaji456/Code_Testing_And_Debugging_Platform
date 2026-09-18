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
  ChevronRight
} from 'lucide-react';

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
  onOpenModernizeModal,
  onOpenReportModal,
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
          {/* Language Selector */}
          <div className="select-control-group" title="Select Programming Language">
            <label htmlFor="language-select">Language:</label>
            <select 
              id="language-select"
              value={selectedLanguage || 'javascript'}
              onChange={(e) => onSelectLanguage && onSelectLanguage(e.target.value)}
              title="Select Programming Language"
            >
              <option value="javascript">JavaScript (ES2024)</option>
              <option value="python">Python 3.12 (WASM)</option>
              <option value="java">Java (OpenJDK 21)</option>
              <option value="cpp">C++ (C++20)</option>
            </select>
          </div>

          {/* Preset Scenario Selector */}
          <div className="select-control-group" title={currentSnippet ? `Scenario: ${currentSnippet.name}` : 'Select Preset Scenario'}>
            <FileCode2 size={15} color="var(--accent-primary-light)" />
            <label htmlFor="snippet-select">Scenario:</label>
            <select 
              id="snippet-select"
              value={selectedSnippetId}
              onChange={(e) => onSelectSnippet(e.target.value)}
              title={currentSnippet?.name}
            >
              {snippets.map((snip) => (
                <option key={snip.id} value={snip.id} title={snip.name}>
                  {snip.name}
                </option>
              ))}
            </select>
          </div>

          {/* Theme Switcher */}
          <div className="select-control-group" title="Switch Studio Theme">
            <Palette size={14} color="var(--accent-primary-light)" />
            <label htmlFor="theme-select">Theme:</label>
            <select 
              id="theme-select"
              value={currentTheme || 'obsidian'}
              onChange={(e) => onSelectTheme && onSelectTheme(e.target.value)}
              title="Switch Studio Theme"
            >
              <option value="obsidian">Obsidian Dark</option>
              <option value="cyberpunk">Cyberpunk Neon</option>
              <option value="tokyo">Tokyo Midnight</option>
              <option value="monokai">Monokai Pro</option>
            </select>
          </div>

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
          id="btn-cicd"
          className="btn btn-secondary btn-sm"
          onClick={onOpenCiCdModal}
          title="Generate GitHub Actions CI/CD Pipeline"
        >
          <GitBranch size={14} />
          <span>CI/CD</span>
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

