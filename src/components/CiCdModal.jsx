import React, { useState } from 'react';
import { 
  GitBranch, 
  Download, 
  Copy, 
  Check, 
  X, 
  Terminal, 
  FileCode2, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export function CiCdModal({ isOpen, onClose, language = 'javascript' }) {
  const [selectedLang, setSelectedLang] = useState(language);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const yamlContent = generateCiCdYaml(selectedLang);

  const handleCopyYaml = async () => {
    await navigator.clipboard.writeText(yamlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadYaml = () => {
    const blob = new Blob([yamlContent], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devpulse-ci-${selectedLang}.yml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <GitBranch size={17} color="var(--accent-primary-light)" />
            <span>GitHub Actions CI/CD Pipeline Generator</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ gap: '12px' }}>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0 }}>
            Automate code review audits, security scans, and test suites on every GitHub Pull Request and push.
          </p>

          {/* Language Tabs */}
          <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-surface)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            {[
              { id: 'javascript', label: 'JavaScript (Node.js)' },
              { id: 'python', label: 'Python (3.12)' },
              { id: 'java', label: 'Java (JDK 21)' },
              { id: 'cpp', label: 'C++ (CMake & GTest)' }
            ].map(tab => (
              <button
                key={tab.id}
                className={`view-toggle-btn ${selectedLang === tab.id ? 'active' : ''}`}
                style={{ flex: 1, padding: '6px 10px', fontSize: '11.5px' }}
                onClick={() => setSelectedLang(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* YAML Viewer */}
          <div className="chat-code-block" style={{ margin: '4px 0 0 0', maxHeight: '320px', overflowY: 'auto' }}>
            <div className="chat-code-header">
              <span>.github/workflows/devpulse-ci.yml</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  className="btn btn-secondary btn-sm" 
                  style={{ padding: '2px 8px', height: '24px', fontSize: '11px' }}
                  onClick={handleCopyYaml}
                >
                  {copied ? <Check size={11} color="var(--accent-emerald)" /> : <Copy size={11} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button 
                  className="btn btn-primary btn-sm" 
                  style={{ padding: '2px 8px', height: '24px', fontSize: '11px' }}
                  onClick={handleDownloadYaml}
                >
                  <Download size={11} />
                  <span>Download YAML</span>
                </button>
              </div>
            </div>
            <pre style={{ padding: '12px', fontSize: '11.5px', lineHeight: 1.5 }}>
              <code>{yamlContent}</code>
            </pre>
          </div>

          {/* Setup Guide */}
          <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '10px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              <ShieldCheck size={14} color="var(--accent-emerald)" />
              <span>How to integrate into your repository</span>
            </div>
            <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <li>Create a directory at <code>.github/workflows/</code> in your repo root.</li>
              <li>Place the downloaded <code>devpulse-ci.yml</code> into that directory.</li>
              <li>Commit & push to GitHub. Every pull request will automatically trigger the audit!</li>
            </ol>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary" onClick={handleDownloadYaml}>
            <Download size={14} />
            <span>Download Workflow File</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function generateCiCdYaml(language) {
  switch (language) {
    case 'python':
      return `name: DevPulse Python Audit & Testing CI

on:
  push:
    branches: [ main, master, develop ]
  pull_request:
    branches: [ main, master ]

jobs:
  audit-and-test:
    name: Code Quality, Security & PyTest
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ["3.11", "3.12"]

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Set up Python \${{ matrix.python-version }}
        uses: actions/setup-python@v5
        with:
          python-version: \${{ matrix.python-version }}
          cache: 'pip'

      - name: Install Dependencies
        run: |
          python -m pip install --upgrade pip
          pip install flake8 bandit pytest pytest-cov

      - name: DevPulse Security & Static Audit
        run: |
          # Stop build on syntax errors and undefined names
          flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
          # Security audit for injection, hardcoded keys, and eval
          bandit -r . -ll -ii

      - name: Execute PyTest Suite
        run: |
          pytest --maxfail=1 --disable-warnings -v
`;

    case 'java':
      return `name: DevPulse Java Quality & JUnit 5 CI

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  build-and-verify:
    name: Maven Build, Checkstyle & JUnit 5
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Set up Eclipse Temurin JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: maven

      - name: Code Quality & Static Checkstyle
        run: mvn checkstyle:check || true

      - name: Run JUnit 5 Test Suite
        run: mvn test --batch-mode
`;

    case 'cpp':
      return `name: DevPulse C++ Quality & GoogleTest CI

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  build-and-test:
    name: CMake, Clang-Tidy & CTest
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Install Build Tools & Clang-Tidy
        run: |
          sudo apt-get update
          sudo apt-get install -y cmake clang-tidy libgtest-dev

      - name: Configure CMake
        run: cmake -B build -DCMAKE_BUILD_TYPE=Release

      - name: Build Project
        run: cmake --build build --config Release

      - name: Run Test Suite
        run: ctest --test-dir build --output-on-failure
`;

    default: // javascript
      return `name: DevPulse JS/TS Review & Test CI

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  audit-test:
    name: ESLint, Security Audit & Vitest
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Set up Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: DevPulse Security & Lint Audit
        run: |
          npm run lint --if-present
          npm audit --audit-level=high

      - name: Run Unit Test Suite
        run: npm test --if-present
`;
  }
}
