# DevPulse Studio 🚀
### Intelligent Code Review, Interactive Debugging & Unit Testing Platform

**DevPulse Studio** is a next-generation developer workbench designed to streamline code quality audits, real-time debugging with root cause diagnostics, and unit test generation.

---

## 🌟 Key Features

### 🔍 1. Automated Code Review Hub
- **Health & Quality Scorecard**: Computes overall letter grade (A+ to F), Security Score, Performance Index, and Code Quality metrics.
- **Vulnerability & Smells Detection**: Audits OWASP security flaws (SQL injection, hardcoded secrets, unsafe `eval()`), quadratic time complexity (`O(N²)` nested loops), unhandled recursion, memory leaks, and input validation.
- **1-Click Auto Patch**: Inline issue cards feature a dedicated **"Apply Fix"** button that updates faulty lines directly in the code editor.
- **Exportable Reports**: Generates and downloads Markdown reports for pull request reviews.

### 🐞 2. Smart Debugger & Root Cause Analyzer
- **Runtime Error Trapping**: Intercepts uncaught exceptions and stack traces in a safe in-browser sandbox.
- **Root Cause Diagnosis**: Explains *why* a bug occurred (call stack overflow, null pointer dereference, off-by-one boundary) and provides actionable remediation guidance.
- **Variable Watch & Step Simulator**: Step forward, backward, or auto-play through execution frames while inspecting local variables and state mutations.

### 🧪 3. Test Suite & Assertion Runner
- **Live Test Runner**: Real-time evaluation of unit tests against current editor code with latency measurements and pass/fail indicators.
- **Synthesize Tests**: 1-click test generator that infers function signatures and generates happy path, boundary condition, and edge case assertions.
- **Custom Test Builder**: Add custom arguments, expected return values, and test categories via an interactive modal.
- **Jest / Vitest Exporter**: Export the entire test suite as a standard test script.

### ⚡ 4. Code Editor, Diff Viewer & Terminal
- **IDE Code Editor**: Line numbers gutter with error/warning markers, tab indentation support, active line highlighting, and syntax layout.
- **Side-by-Side Diff Viewer**: Compares original buggy code with refactored, secured code, with an **"Apply All Fixes"** action.
- **Execution Console & Terminal**: Integrated console capturing runtime logs, warnings, errors, and execution latency.

---

## 🛠 Tech Stack
- **Frontend**: React 19, Vite
- **Icons**: Lucide React
- **Styling**: Vanilla CSS Design System (Dark IDE theme, Glassmorphism)
- **Engines**: Built-in static heuristic review engine, safe evaluation sandbox, assertion runner + optional Gemini AI integration

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/ashrithBalaji456/Code_Testing_And_Debugging_Platform.git

# Navigate to project directory
cd Code_Testing_And_Debugging_Platform

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open **`http://localhost:5173`** in your browser to start using DevPulse Studio!
