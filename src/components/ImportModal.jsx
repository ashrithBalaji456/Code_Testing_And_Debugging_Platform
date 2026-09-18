import React, { useState } from 'react';
import { Upload, GitBranch, FileText, Check, X, AlertCircle, Sparkles } from 'lucide-react';

export function ImportModal({ isOpen, onClose, onImportCode }) {
  const [activeTab, setActiveTab] = useState('github'); // 'github' | 'file' | 'raw'
  const [githubUrl, setGithubUrl] = useState('');
  const [rawCode, setRawCode] = useState('');
  const [selectedLang, setSelectedLang] = useState('javascript');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleFetchGitHub = async (e) => {
    e.preventDefault();
    if (!githubUrl.trim()) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      // Transform standard github.com blob url into raw.githubusercontent.com
      let fetchUrl = githubUrl.trim();
      if (fetchUrl.includes('github.com') && fetchUrl.includes('/blob/')) {
        fetchUrl = fetchUrl
          .replace('github.com', 'raw.githubusercontent.com')
          .replace('/blob/', '/');
      }

      const res = await fetch(fetchUrl);
      if (!res.ok) {
        throw new Error(`Failed to fetch file from GitHub (${res.status}: ${res.statusText})`);
      }

      const codeContent = await res.text();

      // Detect language from extension
      let lang = 'javascript';
      if (fetchUrl.endsWith('.py')) lang = 'python';
      else if (fetchUrl.endsWith('.java')) lang = 'java';
      else if (fetchUrl.endsWith('.cpp') || fetchUrl.endsWith('.cc') || fetchUrl.endsWith('.h')) lang = 'cpp';

      onImportCode(codeContent, lang);
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Could not fetch repository file.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      let lang = 'javascript';
      if (file.name.endsWith('.py')) lang = 'python';
      else if (file.name.endsWith('.java')) lang = 'java';
      else if (file.name.endsWith('.cpp') || file.name.endsWith('.cc')) lang = 'cpp';

      onImportCode(content, lang);
      onClose();
    };
    reader.readAsText(file);
  };

  const handleRawSubmit = (e) => {
    e.preventDefault();
    if (!rawCode.trim()) return;
    onImportCode(rawCode, selectedLang);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Upload size={16} color="var(--accent-primary-light)" />
            <span>Import Source Code</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-default)', background: 'var(--bg-surface)' }}>
          <button
            className={`view-toggle-btn ${activeTab === 'github' ? 'active' : ''}`}
            onClick={() => setActiveTab('github')}
            style={{ flex: 1, padding: '8px 12px', borderRadius: 0 }}
          >
            <GitBranch size={13} style={{ display: 'inline', marginRight: '4px' }} />
            GitHub URL
          </button>
          <button
            className={`view-toggle-btn ${activeTab === 'file' ? 'active' : ''}`}
            onClick={() => setActiveTab('file')}
            style={{ flex: 1, padding: '8px 12px', borderRadius: 0 }}
          >
            <Upload size={13} style={{ display: 'inline', marginRight: '4px' }} />
            Local File
          </button>
          <button
            className={`view-toggle-btn ${activeTab === 'raw' ? 'active' : ''}`}
            onClick={() => setActiveTab('raw')}
            style={{ flex: 1, padding: '8px 12px', borderRadius: 0 }}
          >
            <FileText size={13} style={{ display: 'inline', marginRight: '4px' }} />
            Raw Paste
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'github' && (
            <form onSubmit={handleFetchGitHub}>
              <div className="form-group">
                <label className="form-label">Public GitHub File or Raw URL</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://github.com/owner/repo/blob/main/src/solution.py"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  required
                />
              </div>

              {errorMessage && (
                <div style={{ color: 'var(--accent-rose)', fontSize: '12px', marginTop: '6px' }}>
                  {errorMessage}
                </div>
              )}

              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                Fetches raw code from public GitHub files and detects language automatically.
              </div>

              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={isLoading}>
                  {isLoading ? 'Fetching...' : 'Fetch & Load'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'file' && (
            <div>
              <label className="form-label">Select Code File (.js, .py, .java, .cpp)</label>
              <input
                type="file"
                accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.h"
                onChange={handleFileUpload}
                style={{ marginTop: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px' }}>
                Loads file directly into the editor for instant review and execution.
              </div>
            </div>
          )}

          {activeTab === 'raw' && (
            <form onSubmit={handleRawSubmit}>
              <div className="form-group">
                <label className="form-label">Target Language</label>
                <select
                  className="form-input"
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Code Snippet</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: '120px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                  placeholder="Paste your code snippet here..."
                  value={rawCode}
                  onChange={(e) => setRawCode(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Import Snippet
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
