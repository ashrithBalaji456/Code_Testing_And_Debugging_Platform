// DevPulse Test Suite & Unit Assertion Runner

export function runTests(code, testCases) {
  if (!testCases || testCases.length === 0) {
    return {
      results: [],
      passedCount: 0,
      failedCount: 0,
      totalCount: 0,
      coveragePercent: 0,
      durationMs: 0
    };
  }

  const results = [];
  let passedCount = 0;
  const overallStart = performance.now();

  // Find the primary function name in the code
  const funcMatch = code.match(/function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/);
  const primaryFuncName = funcMatch ? funcMatch[1] : null;

  testCases.forEach((tc) => {
    const testStart = performance.now();
    let actual = null;
    let passed = false;
    let error = null;

    try {
      // Build test runner wrapper
      let evalCode = '';
      if (primaryFuncName) {
        evalCode = `
          ${code}
          let __testResult;
          try {
            // Check if input is tuple/multiple args like '([1,2,3], 2)'
            const inputStr = ${JSON.stringify(tc.input.trim())};
            if (inputStr.startsWith('(') && inputStr.endsWith(')')) {
              __testResult = eval("${primaryFuncName}" + inputStr);
            } else {
              __testResult = ${primaryFuncName}(${tc.input});
            }
          } catch (e) {
            __testResult = "Error: " + e.message;
          }
          return __testResult;
        `;
      } else {
        evalCode = `
          ${code}
          return typeof result !== 'undefined' ? result : null;
        `;
      }

      const runner = new Function(evalCode);
      const output = runner();
      const testDuration = Math.round((performance.now() - testStart) * 100) / 100;

      actual = output !== undefined ? String(output) : 'undefined';

      // Compare actual vs expected
      const cleanExpected = String(tc.expected).trim();
      const cleanActual = String(actual).trim();

      if (cleanExpected === 'Error') {
        passed = cleanActual.startsWith('Error');
      } else if (cleanExpected.includes('status:')) {
        passed = cleanActual.includes(cleanExpected.split(':')[1]?.trim() || '');
      } else {
        passed = cleanExpected === cleanActual;
      }

      if (passed) passedCount++;

      results.push({
        id: tc.id,
        name: tc.name,
        type: tc.type || 'Unit',
        input: tc.input,
        expected: tc.expected,
        actual,
        passed,
        duration: testDuration,
        error: null
      });
    } catch (err) {
      const testDuration = Math.round((performance.now() - testStart) * 100) / 100;
      actual = `Exception: ${err.message}`;
      
      const passed = tc.expected === 'Error';
      if (passed) passedCount++;

      results.push({
        id: tc.id,
        name: tc.name,
        type: tc.type || 'Unit',
        input: tc.input,
        expected: tc.expected,
        actual,
        passed,
        duration: testDuration,
        error: err.message
      });
    }
  });

  const totalDuration = Math.round((performance.now() - overallStart) * 100) / 100;
  const coveragePercent = Math.round((passedCount / testCases.length) * 100);

  return {
    results,
    passedCount,
    failedCount: testCases.length - passedCount,
    totalCount: testCases.length,
    coveragePercent,
    durationMs: totalDuration
  };
}

// Generate synthesized unit tests from code structure
export function generateTestsFromCode(code) {
  const match = code.match(/function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/);
  if (!match) {
    return [
      { id: 'gen-1', name: 'General Smoke Test', input: 'null', expected: 'null', type: 'Happy' },
      { id: 'gen-2', name: 'Boundary Value Test', input: '0', expected: '0', type: 'Boundary' }
    ];
  }

  const funcName = match[1];
  const params = match[2].split(',').map(p => p.trim()).filter(Boolean);

  if (funcName.toLowerCase().includes('fib')) {
    return [
      { id: 'fib-gen-1', name: 'fib(0) Base Case', input: '0', expected: '0', type: 'Boundary' },
      { id: 'fib-gen-2', name: 'fib(1) Base Case', input: '1', expected: '1', type: 'Happy' },
      { id: 'fib-gen-3', name: 'fib(5) Typical Positive', input: '5', expected: '5', type: 'Happy' },
      { id: 'fib-gen-4', name: 'fib(8) Typical Positive', input: '8', expected: '21', type: 'Happy' },
      { id: 'fib-gen-5', name: 'fib(-1) Invalid Range Guard', input: '-1', expected: 'Error', type: 'Error' }
    ];
  }

  if (funcName.toLowerCase().includes('search')) {
    return [
      { id: 'search-gen-1', name: 'Find Element in Middle', input: '([10, 20, 30, 40], 30)', expected: '2', type: 'Happy' },
      { id: 'search-gen-2', name: 'Find First Element', input: '([10, 20, 30, 40], 10)', expected: '0', type: 'Boundary' },
      { id: 'search-gen-3', name: 'Find Last Element', input: '([10, 20, 30, 40], 40)', expected: '3', type: 'Boundary' },
      { id: 'search-gen-4', name: 'Target Not Present', input: '([10, 20, 30, 40], 99)', expected: '-1', type: 'Edge' },
      { id: 'search-gen-5', name: 'Empty Array Input', input: '([], 5)', expected: '-1', type: 'Edge' }
    ];
  }

  // Generic generator
  return [
    { id: `${funcName}-1`, name: `${funcName} default valid execution`, input: params.length > 1 ? '([1, 2, 3], 2)' : '10', expected: '0', type: 'Happy' },
    { id: `${funcName}-2`, name: `${funcName} boundary limit test`, input: params.length > 1 ? '([], 0)' : '0', expected: '0', type: 'Boundary' },
    { id: `${funcName}-3`, name: `${funcName} null argument handling`, input: params.length > 1 ? '(null, null)' : 'null', expected: 'Error', type: 'Edge' },
    { id: `${funcName}-4`, name: `${funcName} extreme values`, input: params.length > 1 ? '([999999], 999999)' : '999999', expected: '999999', type: 'Performance' }
  ];
}

// Export test suite to Jest / Vitest format
export function exportToJest(code, testCases) {
  const match = code.match(/function\s+([a-zA-Z0-9_]+)/);
  const funcName = match ? match[1] : 'testedFunction';

  const testBlocks = testCases.map(tc => `
  test('${tc.name}', () => {
    const input = ${tc.input};
    const expected = ${tc.expected === 'Error' ? 'expect.any(Error)' : JSON.stringify(tc.expected)};
    ${tc.expected === 'Error' ? `expect(() => ${funcName}(input)).toThrow();` : `expect(String(${funcName}(input))).toBe(String(expected));`}
  });`).join('\n');

  return `// Generated Jest / Vitest Test Suite
import { ${funcName} } from './solution';

describe('${funcName} Test Suite', () => {
${testBlocks}
});
`;
}
