// Pyodide WebAssembly Service for In-Browser Python 3.12 Execution

let pyodideInstance = null;
let isInitializing = false;
let initPromise = null;

/**
 * Dynamically load and initialize Pyodide from CDN
 */
export async function getPyodide(onProgress) {
  if (pyodideInstance) {
    return pyodideInstance;
  }

  if (isInitializing && initPromise) {
    return initPromise;
  }

  isInitializing = true;
  initPromise = new Promise(async (resolve, reject) => {
    try {
      // 1. Inject script if not already on window
      if (!window.loadPyodide) {
        if (onProgress) onProgress('Downloading Pyodide WebAssembly binaries (~10MB)...');
        await new Promise((res, rej) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
          script.async = true;
          script.onload = res;
          script.onerror = () => rej(new Error('Failed to load Pyodide script from CDN. You may be offline.'));
          document.head.appendChild(script);
        });
      }

      if (onProgress) onProgress('Initializing WebAssembly Python runtime...');
      pyodideInstance = await window.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/'
      });

      if (onProgress) onProgress('Python 3.12 WebAssembly environment ready!');
      resolve(pyodideInstance);
    } catch (err) {
      isInitializing = false;
      initPromise = null;
      reject(err);
    }
  });

  return initPromise;
}

/**
 * Execute Python code within the in-browser WASM sandbox
 */
export async function runPythonWasm(code, onProgress) {
  const startTime = performance.now();
  const logs = [];

  try {
    const pyodide = await getPyodide(onProgress);

    // Setup stdout / stderr capture
    await pyodide.runPythonAsync(`
import sys
import io
sys_stdout_capture = io.StringIO()
sys_stderr_capture = io.StringIO()
sys.stdout = sys_stdout_capture
sys.stderr = sys_stderr_capture
`);

    // Execute user code
    await pyodide.runPythonAsync(code);

    // Retrieve stdout and stderr
    const stdout = await pyodide.runPythonAsync('sys_stdout_capture.getvalue()');
    const stderr = await pyodide.runPythonAsync('sys_stderr_capture.getvalue()');

    const duration = Math.round((performance.now() - startTime) * 100) / 100;

    if (stdout) {
      stdout.trim().split('\n').forEach(line => {
        logs.push({
          type: 'info',
          message: `[stdout] ${line}`,
          time: new Date().toLocaleTimeString()
        });
      });
    }

    if (stderr) {
      stderr.trim().split('\n').forEach(line => {
        logs.push({
          type: 'warn',
          message: `[stderr] ${line}`,
          time: new Date().toLocaleTimeString()
        });
      });
    }

    logs.push({
      type: 'success',
      message: `[Pyodide WASM] Execution succeeded in ${duration}ms (Python 3.12 WebAssembly)`,
      time: new Date().toLocaleTimeString()
    });

    return {
      success: true,
      logs,
      duration,
      output: stdout || '(No stdout produced)'
    };
  } catch (err) {
    const duration = Math.round((performance.now() - startTime) * 100) / 100;
    const errStr = String(err.message || err);

    // Extract line number if available from Python traceback
    let lineNo = null;
    const lineMatch = errStr.match(/File "<exec>", line (\d+)/) || errStr.match(/line (\d+)/);
    if (lineMatch) {
      lineNo = parseInt(lineMatch[1], 10);
    }

    // Extract error type
    const lines = errStr.trim().split('\n');
    const lastLine = lines[lines.length - 1] || 'RuntimeError';
    const errParts = lastLine.split(':');
    const errName = errParts[0]?.trim() || 'PythonError';
    const errMsg = errParts.slice(1).join(':').trim() || lastLine;

    logs.push({
      type: 'error',
      message: `[Pyodide WASM Error] ${errName}: ${errMsg}${lineNo ? ` (Line ${lineNo})` : ''}`,
      time: new Date().toLocaleTimeString()
    });

    return {
      success: false,
      logs,
      duration,
      error: {
        name: errName,
        message: errMsg,
        line: lineNo,
        stack: errStr,
        diagnosis: {
          cause: `Python execution threw an unhandled ${errName}: ${errMsg}`,
          fix: 'Inspect the highlighted line and check data types and boundary constraints.'
        }
      }
    };
  }
}
