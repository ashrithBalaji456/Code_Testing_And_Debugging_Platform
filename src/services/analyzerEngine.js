// DevPulse Static & Heuristic Code Review Engine

export function analyzeCode(code, language = 'javascript') {
  if (!code || code.trim().length === 0) {
    return {
      score: 100,
      grade: 'A+',
      securityScore: 100,
      performanceScore: 100,
      maintainabilityScore: 100,
      findings: [],
      stats: { lines: 0, critical: 0, warning: 0, info: 0, clean: 0 }
    };
  }

  const lines = code.split('\n');
  const findings = [];

  let securityDeduction = 0;
  let performanceDeduction = 0;
  let maintainabilityDeduction = 0;

  // Rule 1: SQL Injection / Raw Query Concatenation
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    if (
      /(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE).*(\+|\$\{).*(req\.|params|query|body|username|password|input)/i.test(line) ||
      /(SELECT|INSERT|UPDATE|DELETE)\s+.*\s*\+\s*['"][^'"]*['"]\s*\+/i.test(line)
    ) {
      findings.push({
        id: `sec-sqli-${lineNum}`,
        line: lineNum,
        severity: 'critical',
        category: 'Security',
        title: 'Potential SQL Injection Vulnerability',
        description: 'SQL queries constructed via string concatenation or template literals allow attackers to execute arbitrary database queries (CWE-89 / OWASP A03).',
        originalCode: line.trim(),
        suggestedFix: line.replace(/(\+|'|").*(username|password|req\.[a-z]+).*/i, '/* USE PARAMETERIZED QUERY (e.g. $1, [params]) */'),
        recommendation: 'Use parameterized queries, prepared statements, or an ORM/query builder instead of string concatenation.'
      });
      securityDeduction += 35;
    }
  });

  // Rule 2: Hardcoded Secrets, Passwords, or API Keys
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    if (
      /(JWT_SECRET|API_KEY|SECRET_KEY|PASSWORD|TOKEN|AUTH_KEY)\s*=\s*["'][a-zA-Z0-9_\-]{8,}["']/i.test(line) &&
      !line.includes('process.env')
    ) {
      findings.push({
        id: `sec-secret-${lineNum}`,
        line: lineNum,
        severity: 'critical',
        category: 'Security',
        title: 'Hardcoded Secret or Credential Detected',
        description: 'Hardcoded cryptographic secrets or API keys can be committed to public repositories and exposed to unauthorized parties (CWE-798).',
        originalCode: line.trim(),
        suggestedFix: line.replace(/=\s*["'][^"']+["']/, '= process.env.API_SECRET_KEY || ""'),
        recommendation: 'Store sensitive keys in environment variables or a secure key management service (KMS).'
      });
      securityDeduction += 30;
    }
  });

  // Rule 3: Unsafe Execution (eval, Function constructor)
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    if (/\beval\s*\(/.test(line) || /new\s+Function\s*\(/.test(line)) {
      findings.push({
        id: `sec-eval-${lineNum}`,
        line: lineNum,
        severity: 'critical',
        category: 'Security',
        title: 'Dangerous Code Evaluation (eval)',
        description: 'Dynamic execution of strings using eval() can lead to arbitrary code execution and severe remote code execution (RCE) flaws.',
        originalCode: line.trim(),
        suggestedFix: '// Refactored: Avoid eval() - use JSON.parse() or structured logic',
        recommendation: 'Replace dynamic evaluation with explicit data parsers or safe evaluation strategies.'
      });
      securityDeduction += 40;
    }
  });

  // Rule 4: Exponential Recursion without Memoization / Unbounded recursion
  let hasRecursion = false;
  let recursiveFuncName = '';
  lines.forEach((line) => {
    const match = line.match(/function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/);
    if (match) {
      recursiveFuncName = match[1];
    }
    if (recursiveFuncName && line.includes(`${recursiveFuncName}(`) && !line.includes(`function ${recursiveFuncName}`)) {
      hasRecursion = true;
    }
  });

  if (hasRecursion && !code.includes('memo') && !code.includes('cache')) {
    const recLineIdx = lines.findIndex(l => recursiveFuncName && l.includes(`${recursiveFuncName}(`) && !l.includes('function'));
    findings.push({
      id: `perf-recursion-${recLineIdx + 1}`,
      line: recLineIdx >= 0 ? recLineIdx + 1 : 1,
      severity: 'warning',
      category: 'Performance',
      title: 'Unmemoized Recursive Calls (Potential O(2^N) Complexity)',
      description: `Function '${recursiveFuncName}' appears to call itself recursively without a caching or memoization structure, leading to exponential time complexity and stack overflows.`,
      originalCode: lines[recLineIdx] ? lines[recLineIdx].trim() : `${recursiveFuncName}(...)`,
      suggestedFix: `// Add memoization map to cache intermediate branch calculations`,
      recommendation: 'Implement dynamic programming with memoization or convert recursive logic to an iterative loop.'
    });
    performanceDeduction += 25;
  }

  // Rule 5: Nested Loops (O(N^2) or higher complexity)
  let loopDepth = 0;
  let maxLoopDepth = 0;
  let deepLoopLine = 1;
  lines.forEach((line, idx) => {
    if (/\b(for|while)\s*\(/.test(line) || /\.(forEach|map|filter)\s*\(/.test(line)) {
      loopDepth++;
      if (loopDepth > maxLoopDepth) {
        maxLoopDepth = loopDepth;
        deepLoopLine = idx + 1;
      }
    }
    if (line.includes('}') && loopDepth > 0) {
      loopDepth--;
    }
  });

  if (maxLoopDepth >= 2) {
    findings.push({
      id: `perf-nested-loops-${deepLoopLine}`,
      line: deepLoopLine,
      severity: 'warning',
      category: 'Performance',
      title: `Nested Loop Detected (Depth ${maxLoopDepth} - Potential O(N^2))`,
      description: 'Multiple nested iterations over collections cause quadratic time scaling. On large datasets this degrades application responsiveness.',
      originalCode: lines[deepLoopLine - 1] ? lines[deepLoopLine - 1].trim() : 'for (...)',
      suggestedFix: '// Consider building a Map / Set lookup in O(N) prior to the loop',
      recommendation: 'Use hash maps or Sets to convert inner lookup loops from O(N) to O(1).'
    });
    performanceDeduction += 20;
  }

  // Rule 6: Resource & Memory Leaks (Event Listeners & Timers without cleanup)
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    if (
      (/\.on\s*\(/.test(line) || /\.addEventListener\s*\(/.test(line) || /setInterval\s*\(/.test(line)) &&
      !code.includes('removeEventListener') &&
      !code.includes('clearInterval') &&
      !code.includes('unsubscribe')
    ) {
      findings.push({
        id: `perf-leak-${lineNum}`,
        line: lineNum,
        severity: 'warning',
        category: 'Performance',
        title: 'Potential Memory Leak: Uncleaned Listener / Timer',
        description: 'Event listeners or intervals are registered without any corresponding cleanup or teardown method (CWE-400).',
        originalCode: line.trim(),
        suggestedFix: 'const timerId = setInterval(...); // Ensure clearInterval(timerId) is called',
        recommendation: 'Provide lifecycle hooks or cleanup methods to remove event listeners and clear active timers.'
      });
      performanceDeduction += 20;
    }
  });

  // Rule 7: Loose Equality Checks (== vs ===)
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    if (/[^!=]==[^=]/.test(line) && !line.includes('===') && !line.includes('//')) {
      findings.push({
        id: `smell-loose-eq-${lineNum}`,
        line: lineNum,
        severity: 'info',
        category: 'Code Quality',
        title: 'Use Strict Equality Operator (===)',
        description: 'Loose equality (==) triggers implicit JavaScript type coercion, which often causes unexpected edge case bugs (e.g. "" == 0 evaluates to true).',
        originalCode: line.trim(),
        suggestedFix: line.replace(/==/g, '==='),
        recommendation: 'Always use strict equality (===) and strict inequality (!==).'
      });
      maintainabilityDeduction += 8;
    }
  });

  // Rule 8: Use of var instead of const/let
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    if (/\bvar\s+[a-zA-Z0-9_]+/.test(line) && !line.includes('//')) {
      findings.push({
        id: `smell-var-${lineNum}`,
        line: lineNum,
        severity: 'info',
        category: 'Best Practices',
        title: 'Deprecated "var" Keyword Used',
        description: '"var" declarations have function-scope and hoisting quirks that lead to subtle shadowing and reassignment bugs.',
        originalCode: line.trim(),
        suggestedFix: line.replace(/\bvar\b/, 'const'),
        recommendation: 'Prefer "const" for immutable references and "let" for mutable variables.'
      });
      maintainabilityDeduction += 5;
    }
  });

  // Rule 9: Console.log left in production code
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    if (/console\.(log|debug|info)\s*\(/.test(line) && !line.includes('//')) {
      findings.push({
        id: `smell-console-${lineNum}`,
        line: lineNum,
        severity: 'info',
        category: 'Best Practices',
        title: 'Console Logging in Source Code',
        description: 'Debug console statements can leak internal object structures to browser devtools and impact runtime performance in tight loops.',
        originalCode: line.trim(),
        suggestedFix: `// ${line.trim()} (Remove or replace with structured logger)`,
        recommendation: 'Remove debugging console statements or gate them behind an environment-aware logger.'
      });
      maintainabilityDeduction += 4;
    }
  });

  // Rule 10: Missing Input Validation / Boundary Checks
  if (code.includes('function') && !code.includes('typeof') && !code.includes('throw') && !code.includes('Array.isArray')) {
    findings.push({
      id: `qual-input-val-1`,
      line: 1,
      severity: 'warning',
      category: 'Code Quality',
      title: 'Missing Input Type and Bounds Verification',
      description: 'Functions accept arguments without validating parameter types, nullability, or edge boundaries (e.g. negative numbers, empty arrays).',
      originalCode: lines[0] ? lines[0].trim() : 'function ...',
      suggestedFix: 'if (!arg || typeof arg !== "number") throw new TypeError("Invalid argument");',
      recommendation: 'Add defensive guards at the start of functions to validate inputs and fail fast.'
    });
    maintainabilityDeduction += 12;
  }

  // Python Specific Rule 1: f-string SQL Query Injection
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    if (/f["'].*(SELECT|INSERT|UPDATE|DELETE|WHERE).*\{[a-zA-Z0-9_]+\}/i.test(line)) {
      findings.push({
        id: `py-sqli-${lineNum}`,
        line: lineNum,
        severity: 'critical',
        category: 'Security',
        title: 'Python f-string SQL Injection Vulnerability',
        description: 'Constructing SQL statements with f-string interpolation directly concatenates user input into SQL syntax without escaping (OWASP A03 / CWE-89).',
        originalCode: line.trim(),
        suggestedFix: line.replace(/f(["']).*\{([a-zA-Z0-9_]+)\}.*\1/, '"SELECT ... WHERE col = ?"  # Use cursor.execute(query, (params,))'),
        recommendation: 'Use DB-API parameterized queries with placeholder markers (e.g. ? or %s) and pass parameters as a tuple.'
      });
      securityDeduction += 35;
    }
  });

  // Python Specific Rule 2: Mutable Default Argument Gotcha
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const match = line.match(/def\s+[a-zA-Z0-9_]+\([^)]*([a-zA-Z0-9_]+)\s*=\s*(\[\]|\{\}|set\(\))/);
    if (match) {
      const paramName = match[1];
      findings.push({
        id: `py-mutable-default-${lineNum}`,
        line: lineNum,
        severity: 'warning',
        category: 'Code Quality',
        title: `Mutable Default Argument in Function Definition ('${paramName}')`,
        description: `Python evaluates default parameters once when the function is defined. Using a mutable object (${match[2]}) means all calls share and mutate the exact same instance in memory.`,
        originalCode: line.trim(),
        suggestedFix: line.replace(new RegExp(`${paramName}\\s*=\\s*(\\[\\]|\\{\\}|set\\(\\))`), `${paramName}=None`),
        recommendation: 'Use None as the default value and initialize the mutable object inside the function body (e.g. if arg is None: arg = []).'
      });
      maintainabilityDeduction += 18;
    }
  });

  // Python Specific Rule 3: Bare except clause
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    if (/^\s*except\s*:/.test(line)) {
      findings.push({
        id: `py-bare-except-${lineNum}`,
        line: lineNum,
        severity: 'warning',
        category: 'Best Practices',
        title: 'Bare "except:" Clause Catches System Exits',
        description: 'A bare except: catches BaseException, which intercepts KeyboardInterrupt, SystemExit, and memory errors, making programs difficult to terminate cleanly (PEP 8 / E722).',
        originalCode: line.trim(),
        suggestedFix: 'except Exception as err:  # Or specific exception like sqlite3.Error',
        recommendation: 'Always specify the exception class you intend to handle, such as `except Exception:` or `except SpecificError:`.'
      });
      maintainabilityDeduction += 12;
    }
  });

  // Python Specific Rule 4: Comparison to None using == instead of is
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    if (/(==\s*None|!=\s*None)/.test(line) && !line.includes('#')) {
      findings.push({
        id: `py-none-check-${lineNum}`,
        line: lineNum,
        severity: 'info',
        category: 'Code Quality',
        title: 'Comparison to None should use "is" or "is not" (PEP 8)',
        description: 'Comparing singleton None using equality operators (== or !=) invokes the object\'s __eq__ method, whereas identity check `is None` is faster and unambiguous.',
        originalCode: line.trim(),
        suggestedFix: line.replace(/==\s*None/, 'is None').replace(/!=\s*None/, 'is not None'),
        recommendation: 'Use `if var is None:` or `if var is not None:` as recommended by PEP 8.'
      });
      maintainabilityDeduction += 5;
    }
  });

  // Python Specific Rule 5: Hardcoded SECRET_KEY in Python
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    if (/SECRET_KEY\s*=\s*["'][^"']+["']/.test(line) && !line.includes('os.environ')) {
      findings.push({
        id: `py-secret-${lineNum}`,
        line: lineNum,
        severity: 'critical',
        category: 'Security',
        title: 'Hardcoded Python Flask/Django SECRET_KEY',
        description: 'Hardcoded cryptographic keys used for session signing or tokens can be leaked via git and compromise user sessions.',
        originalCode: line.trim(),
        suggestedFix: 'SECRET_KEY = os.environ.get("SECRET_KEY", "fallback_dev_key")',
        recommendation: 'Read application secrets from os.environ or python-dotenv.'
      });
      securityDeduction += 30;
    }
  });

  // Compute final scores
  const securityScore = Math.max(15, Math.min(100, 100 - securityDeduction));
  const performanceScore = Math.max(20, Math.min(100, 100 - performanceDeduction));
  const maintainabilityScore = Math.max(25, Math.min(100, 100 - maintainabilityDeduction));

  const weightedScore = Math.round(
    securityScore * 0.4 + performanceScore * 0.35 + maintainabilityScore * 0.25
  );

  let grade = 'A';
  if (weightedScore >= 95) grade = 'A+';
  else if (weightedScore >= 88) grade = 'A';
  else if (weightedScore >= 78) grade = 'B+';
  else if (weightedScore >= 70) grade = 'B';
  else if (weightedScore >= 58) grade = 'C';
  else if (weightedScore >= 45) grade = 'D';
  else grade = 'F';

  const stats = {
    lines: lines.length,
    critical: findings.filter(f => f.severity === 'critical').length,
    warning: findings.filter(f => f.severity === 'warning').length,
    info: findings.filter(f => f.severity === 'info').length,
    clean: findings.length === 0 ? 1 : 0
  };

  return {
    score: weightedScore,
    grade,
    securityScore,
    performanceScore,
    maintainabilityScore,
    findings,
    stats
  };
}
