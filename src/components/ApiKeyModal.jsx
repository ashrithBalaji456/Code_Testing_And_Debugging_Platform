import React, { useState } from 'react';
import { Key, Sparkles, Check, Trash2, X, AlertCircle } from 'lucide-react';

export function ApiKeyModal({ isOpen, onClose, onSaveKey, currentKey, promptMessage }) {
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
          <div className="modal-body" style={{ gap: '14px' }}>
            <div style={{
              background: 'rgba(192, 132, 252, 0.08)',
              border: '1px solid rgba(192, 132, 252, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} color="#c084fc" />
                <span>{promptMessage || "Unlock AI Test Generation & Code Rewrites"}</span>
              </div>
              <p style={{ margin: 0 }}>
                DevPulse uses Google Gemini 1.5 Flash to automatically generate custom unit test cases and rewrite code directly for your custom functions.
              </p>
              <div style={{ marginTop: '4px' }}>
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#c084fc', textDecoration: 'underline', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  👉 Click here to get a free Gemini API key from Google AI Studio
                </a>
              </div>
            </div>

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
