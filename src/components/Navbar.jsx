import React from 'react';
import { 
  Code2, 
  Play, 
  SearchCode, 
  GitCompare, 
  Key, 
  Sparkles,
  RefreshCw,
  FileCode2,
  Upload
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
  hasApiKey,
  isRunning
}) {
  return (
    <header className="navbar">
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
        <div className="select-control-group">
          <label htmlFor="language-select" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Language:</label>
          <select 
            id="language-select"
            value={selectedLanguage || 'javascript'}
            onChange={(e) => onSelectLanguage && onSelectLanguage(e.target.value)}
          >
            <option value="javascript">JavaScript (ES2024)</option>
            <option value="python">Python 3.12</option>
            <option value="java">Java (OpenJDK 21)</option>
            <option value="cpp">C++ (C++20)</option>
          </select>
        </div>

        {/* Preset Scenario Selector */}
        <div className="select-control-group">
          <FileCode2 size={15} color="var(--accent-primary-light)" />
          <label htmlFor="snippet-select" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Scenario:</label>
          <select 
            id="snippet-select"
            value={selectedSnippetId}
            onChange={(e) => onSelectSnippet(e.target.value)}
          >
            {snippets.map((snip) => (
              <option key={snip.id} value={snip.id}>
                {snip.name}
              </option>
            ))}
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

      <div className="nav-actions">
        <button 
          id="btn-run-code"
          className="btn btn-secondary"
          onClick={onRunCode}
          disabled={isRunning}
          title="Execute code in safe browser sandbox"
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
          id="btn-api-key"
          className={`btn ${hasApiKey ? 'btn-ai' : 'btn-secondary'} btn-sm`}
          onClick={onOpenApiKeyModal}
          title={hasApiKey ? 'Gemini AI API Key is Active' : 'Configure Optional Gemini AI Key'}
        >
          <Key size={14} />
          <span>{hasApiKey ? 'AI Active' : 'API Key'}</span>
        </button>
      </div>
    </header>
  );
}
