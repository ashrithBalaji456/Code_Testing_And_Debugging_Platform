// DevPulse Dynamic Execution Trace & Time-Travel Engine
// Synthesizes sequential execution steps, variable deltas, and state snapshots for any code.

/**
 * Returns enhanced execution steps with delta-tracking, labels, and timestamps.
 * If preset steps exist, they are augmented; otherwise, a dynamic trace is synthesized.
 */
export function getExecutionTrace(code, language = 'javascript', presetTrace = []) {
  if (Array.isArray(presetTrace) && presetTrace.length > 0) {
    return augmentTraceWithDeltas(presetTrace, code);
  }

  return synthesizeDynamicTrace(code, language);
}

/**
 * Augments preset trace steps by computing variable deltas and code snippets.
 */
function augmentTraceWithDeltas(steps, code) {
  const codeLines = code ? code.split('\n') : [];
  let previousVars = {};

  return steps.map((s, idx) => {
    const currentVars = s.vars || {};
    const deltaKeys = [];

    Object.keys(currentVars).forEach(key => {
      const prevVal = previousVars[key];
      const curVal = currentVars[key];
      if (prevVal === undefined || JSON.stringify(prevVal) !== JSON.stringify(curVal)) {
        deltaKeys.push(key);
      }
    });

    previousVars = { ...currentVars };
    const lineNum = s.line || 1;
    const codeSnippet = codeLines[lineNum - 1]?.trim() || '';

    let stepType = 'mutation';
    if (idx === 0) stepType = 'init';
    else if (s.hitBaseCase || s.returned !== undefined) stepType = 'return';
    else if (s.branch || s.recursing) stepType = 'branch';
    else if (s.alert || s.leakWarning) stepType = 'error';

    return {
      step: idx + 1,
      line: lineNum,
      label: s.label || generateStepLabel(s, codeSnippet, idx + 1),
      codeSnippet,
      vars: currentVars,
      delta: deltaKeys,
      type: stepType
    };
  });
}

function generateStepLabel(step, codeSnippet, stepNum) {
  if (step.hitBaseCase) return `Base Case Reached (Return ${step.returned ?? ''})`;
  if (step.recursing) return `Branching Recursion -> ${step.recursing}`;
  if (step.alert) return `Alert: ${step.alert}`;
  if (codeSnippet.startsWith('return ')) return `Return Statement: ${codeSnippet}`;
  if (codeSnippet.startsWith('if ')) return `Condition Evaluation: ${codeSnippet}`;
  if (codeSnippet.includes('=')) return `State Mutation: ${codeSnippet.slice(0, 38)}`;
  return `Execution Frame ${stepNum}`;
}

/**
 * Dynamically synthesizes a step-by-step execution trace from arbitrary code.
 */
function synthesizeDynamicTrace(code, language = 'javascript') {
  if (!code || typeof code !== 'string') return [];

  const lines = code.split('\n');
  const steps = [];
  const state = {};
  let previousState = {};

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim();

    // Skip blank lines, comments, import/package headers
    if (
      !trimmed ||
      trimmed.startsWith('//') ||
      trimmed.startsWith('/*') ||
      trimmed.startsWith('*') ||
      trimmed.startsWith('#') ||
      trimmed.startsWith('import ') ||
      trimmed.startsWith('package ') ||
      trimmed.startsWith('#include') ||
      trimmed === '{' ||
      trimmed === '}' ||
      trimmed === '};'
    ) {
      return;
    }

    // 1. Variable Assignment (JS, Python, Java, C++)
    const assignMatch = 
      trimmed.match(/(?:(?:const|let|var|int|double|float|String|boolean|auto)\s+)?([a-zA-Z0-9_]+)\s*=\s*(.+?);?$/);

    // 2. Method invocation on stateful object (e.g. bank.deposit(101, 1000), list.add(...))
    const methodCallMatch = 
      trimmed.match(/([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\s*\((.*?)\);?$/);

    // 3. Conditional / Loop branch
    const branchMatch = 
      trimmed.match(/^(?:if|else\s+if|for|while)\s*\((.*?)\)/);

    // 4. Return statement
    const returnMatch = 
      trimmed.match(/^return\s*(.*?);?$/);

    if (assignMatch && !trimmed.startsWith('for ') && !trimmed.startsWith('if ')) {
      const varName = assignMatch[1];
      let valExpr = assignMatch[2].replace(/;$/, '').trim();

      // Clean up new invocations
      if (valExpr.startsWith('new ')) {
        valExpr = valExpr.replace(/^new\s+/, '');
      }

      state[varName] = valExpr.length > 25 ? `${valExpr.slice(0, 22)}...` : valExpr;

      const delta = [varName];
      steps.push({
        step: steps.length + 1,
        line: lineNum,
        label: `Assign ${varName} = ${state[varName]}`,
        codeSnippet: trimmed,
        vars: { ...state },
        delta,
        type: 'mutation'
      });
      previousState = { ...state };
    } else if (methodCallMatch) {
      const obj = methodCallMatch[1];
      const method = methodCallMatch[2];
      const args = methodCallMatch[3];

      // Mutate simulated state for banking / collection operations
      if (method === 'deposit' || method === 'withdraw' || method === 'transfer') {
        const argParts = args.split(',').map(s => s.trim());
        const accId = argParts[0] || '101';
        const amt = argParts[1] || '1000';
        state[`account_${accId}_op`] = `${method.toUpperCase()}(${amt})`;
      } else if (method === 'add' || method === 'push') {
        state[`${obj}_size`] = (parseInt(state[`${obj}_size`] || '0', 10) + 1).toString();
      } else {
        state[`last_call`] = `${obj}.${method}(${args.slice(0, 15)})`;
      }

      steps.push({
        step: steps.length + 1,
        line: lineNum,
        label: `Invoke ${obj}.${method}(${args.slice(0, 20)})`,
        codeSnippet: trimmed,
        vars: { ...state },
        delta: Object.keys(state).filter(k => previousState[k] !== state[k]),
        type: 'call'
      });
      previousState = { ...state };
    } else if (branchMatch) {
      const cond = branchMatch[1];
      steps.push({
        step: steps.length + 1,
        line: lineNum,
        label: `Evaluate Branch (${cond.slice(0, 25)})`,
        codeSnippet: trimmed,
        vars: { ...state, branch_evaluated: 'true' },
        delta: ['branch_evaluated'],
        type: 'branch'
      });
    } else if (returnMatch) {
      const retVal = returnMatch[1] || 'void';
      steps.push({
        step: steps.length + 1,
        line: lineNum,
        label: `Return Result (${retVal.slice(0, 25)})`,
        codeSnippet: trimmed,
        vars: { ...state, return_value: retVal },
        delta: ['return_value'],
        type: 'return'
      });
    }
  });

  // If no specific statements matched, provide a baseline entry step
  if (steps.length === 0) {
    steps.push({
      step: 1,
      line: 1,
      label: 'Program Entry',
      codeSnippet: lines[0] || 'main()',
      vars: { status: 'Execution Initialized' },
      delta: ['status'],
      type: 'init'
    });
  }

  // Cap at 14 key execution steps for responsive scrubbing
  return steps.slice(0, 14);
}
