import React, { useState } from 'react';
import { Key, Sparkles, Check, Trash2, X, AlertCircle } from 'lucide-react';

export function ApiKeyModal({ isOpen, onClose, onSaveKey, currentKey }) {
  const [apiKey, setApiKey] = useState(currentKey || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    onSaveKey(apiKey.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleClear = () => {
    setApiKey('');
    onSaveKey('');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Sparkles size={18} color="var(--accent-purple)" />
            <span>AI Enhancement Settings (Gemini)</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="modal-body">
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              DevPulse works completely standalone with its built-in heuristic analysis engine. If you would also like live LLM-powered reviews, enter your Google Gemini API key below.
            </p>

            <div className="form-group">
              <label className="form-label">Gemini API Key</label>
              <input 
                id="input-gemini-api-key"
                type="password"
                className="form-input"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>

            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={13} />
              <span>Your key is stored only in your local browser storage and never sent to any third party server.</span>
            </div>
          </div>

          <div className="modal-footer">
            {currentKey && (
              <button 
                type="button" 
                className="btn btn-ghost btn-sm"
                onClick={handleClear}
                style={{ marginRight: 'auto', color: 'var(--accent-rose)' }}
              >
                <Trash2 size={13} />
                <span>Remove Key</span>
              </button>
            )}

            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={onClose}
            >
              Cancel
            </button>

            <button 
              id="btn-save-api-key"
              type="submit" 
              className="btn btn-primary btn-sm"
            >
              {savedSuccess ? (
                <>
                  <Check size={14} />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Key size={14} />
                  <span>Save Configuration</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
