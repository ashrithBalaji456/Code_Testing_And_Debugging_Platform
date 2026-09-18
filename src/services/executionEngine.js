// DevPulse Code Execution Sandbox & Root Cause Diagnostics Engine

export function executeCode(code, language = 'javascript') {
  const logs = [];
  const startTime = performance.now();

  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info
  };

  const captureLog = (type, args) => {
    const formatted = args.map(arg => {
      if (arg === null) return 'null';
      if (arg === undefined) return 'undefined';
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');

    logs.push({
      type,
      message: formatted,
      time: new Date().toLocaleTimeString()
    });
  };

  // Mock console inside execution sandbox
  const sandboxConsole = {
    log: (...args) => captureLog('log', args),
    warn: (...args) => captureLog('warn', args),
    error: (...args) => captureLog('error', args),
    info: (...args) => captureLog('info', args)
  };

  try {
    // Safety check for infinite while(true) loops
    if (/while\s*\(\s*true\s*\)/.test(code) && !code.includes('break')) {
      throw new Error("Potential Infinite Loop Detected: while(true) without break statement.");
    }

    // Wrap in function with sandboxed environment
    const runner = new Function('console', 'require', `
      try {
        ${code}
      } catch (err) {
        throw err;
      }
    `);

    // Mock require for demo modules
    const mockRequire = (mod) => {
      if (mod === 'crypto') {
        return {
          timingSafeEqual: (a, b) => a === b,
          randomBytes: () => 'mock_bytes'
        };
      }
      return {};
    };

    const result = runner(sandboxConsole, mockRequire);
    const duration = Math.round((performance.now() - startTime) * 100) / 100;

    return {
      success: true,
      logs: logs.length > 0 ? logs : [{ type: 'info', message: 'Program executed with no console output.', time: new Date().toLocaleTimeString() }],
      returnValue: result !== undefined ? String(result) : null,
      duration,
      error: null
    };
  } catch (err) {
    const duration = Math.round((performance.now() - startTime) * 100) / 100;
    
    // Parse line number from error stack if possible
    let errorLine = null;
    if (err.stack) {
      const match = err.stack.match(/<anonymous>:(\d+):(\d+)/);
      if (match) {
        // Adjust for runner wrapper offset
        errorLine = Math.max(1, parseInt(match[1], 10) - 2);
      }
    }

    const diagnosis = diagnoseError(err, code, errorLine);

    return {
      success: false,
      logs: [
        ...logs,
        { type: 'error', message: `${err.name}: ${err.message}`, time: new Date().toLocaleTimeString() }
      ],
      returnValue: null,
      duration,
      error: {
        name: err.name || 'RuntimeError',
        message: err.message,
        line: errorLine,
        stack: err.stack,
        diagnosis
      }
    };
  }
}

// Intelligent Root Cause Diagnoser
export function diagnoseError(error, code, line) {
  const msg = error.message || '';
  const name = error.name || '';

  if (name === 'RangeError' && msg.includes('Maximum call stack size exceeded')) {
    return {
      title: 'Call Stack Overflow (Infinite Recursion)',
      cause: 'A recursive function called itself indefinitely without reaching a terminating base condition.',
      fix: 'Verify the base case condition (e.g. `if (n <= 1) return ...`) and ensure input values progress towards it on every recursion.',
      affectedArea: line ? `Line ${line}` : 'Recursive calls'
    };
  }

  if (name === 'TypeError' && msg.includes('Cannot read properties of undefined')) {
    const propertyMatch = msg.match(/reading '([^']+)'/);
    const prop = propertyMatch ? propertyMatch[1] : 'property';
    return {
      title: `Null Pointer / Undefined Dereference`,
      cause: `Attempted to access property '.${prop}' on a variable that evaluates to undefined or null.`,
      fix: `Use optional chaining (e.g. \`obj?.${prop}\`) or add a defensive null check \`if (obj && obj.${prop})\`.`,
      affectedArea: line ? `Line ${line}` : 'Object lookup'
    };
  }

  if (name === 'ReferenceError') {
    const varMatch = msg.match(/([a-zA-Z0-9_]+) is not defined/);
    const variable = varMatch ? varMatch[1] : 'variable';
    return {
      title: `Unresolved Variable Reference: '${variable}'`,
      cause: `Variable '${variable}' was accessed before declaration or outside its lexical block scope.`,
      fix: `Ensure '${variable}' is declared using \`const\`, \`let\`, or passed as a parameter before use.`,
      affectedArea: line ? `Line ${line}` : 'Scope resolution'
    };
  }

  if (name === 'SyntaxError') {
    return {
      title: 'Syntax Parsing Error',
      cause: 'JavaScript engine encountered invalid punctuation, mismatched parentheses, or illegal tokens.',
      fix: 'Check for unclosed curly braces `{`, quotes, commas, or parentheses near the error line.',
      affectedArea: line ? `Line ${line}` : 'Syntax parser'
    };
  }

  // Fallback diagnosis
  return {
    title: 'Unhandled Exception',
    cause: error.message,
    fix: 'Wrap sensitive operations in a try...catch block or validate input parameters before execution.',
    affectedArea: line ? `Line ${line}` : 'Execution handler'
  };
}
