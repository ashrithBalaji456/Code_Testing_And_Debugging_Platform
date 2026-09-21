// DevPulse In-Browser Mutation Testing Engine
// Evaluates test suite quality by injecting subtle bugs (mutants) and checking if tests catch them.

import { runTests } from './testEngine';

export const MUTATION_TYPES = {
  RELATIONAL: 'Relational Operator (ROR)',
  ARITHMETIC: 'Arithmetic Operator (AOR)',
  LOGICAL: 'Logical Connector (LCR)',
  BOOLEAN: 'Boolean Inversion (BI)',
  BOUNDARY: 'Boundary Condition (BCM)',
  RETURN_VAL: 'Return Value (RVR)'
};

/**
 * Generates realistic semantic mutants for the provided code.
 */
export function generateMutants(code, language = 'javascript') {
  if (!code || typeof code !== 'string') return [];

  const lines = code.split('\n');
  const mutants = [];
  let mutantCounter = 1;

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const trimmed = line.trim();
    const lineNum = idx + 1;

    // Skip non-executable lines
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
      continue;
    }

    const createMutant = (newMutatedLine, type, description, suggestedInput, suggestedExpected) => {
      const mutatedLines = [...lines];
      mutatedLines[idx] = newMutatedLine;
      mutants.push({
        id: `mutant-${mutantCounter++}`,
        line: lineNum,
        type,
        description,
        originalLine: trimmed,
        mutatedLine: newMutatedLine.trim(),
        fullMutatedSource: mutatedLines.join('\n'),
        suggestedKillingTest: {
          name: `Boundary Guard Verification (Line ${lineNum})`,
          input: suggestedInput || '0',
          expected: suggestedExpected || 'Error',
          type: 'Boundary'
        }
      });
    };

    // 1. Relational Operator Replacements (<= to <, >= to >, < to <=, > to >=, === to !==)
    if (trimmed.includes('<=') && mutants.length < 15) {
      createMutant(
        line.replace('<=', '<'),
        MUTATION_TYPES.RELATIONAL,
        `Replaced '<=' with '<' (removes boundary limit equality)`,
        '1',
        'Specific boundary output'
      );
    } else if (trimmed.includes('>=') && mutants.length < 15) {
      createMutant(
        line.replace('>=', '>'),
        MUTATION_TYPES.RELATIONAL,
        `Replaced '>=' with '>' (omits boundary equality check)`,
        '0',
        'Valid boundary response'
      );
    } else if (trimmed.includes('===') && mutants.length < 15) {
      createMutant(
        line.replace('===', '!=='),
        MUTATION_TYPES.RELATIONAL,
        `Inverted strict equality '===' to '!=='`,
        '0',
        'Inverted match'
      );
    } else if (trimmed.includes('!==') && mutants.length < 15) {
      createMutant(
        line.replace('!==', '==='),
        MUTATION_TYPES.RELATIONAL,
        `Inverted strict inequality '!==' to '==='`,
        'null',
        'Error'
      );
    } else if (trimmed.includes('==') && !trimmed.includes('===') && mutants.length < 15) {
      createMutant(
        line.replace('==', '!='),
        MUTATION_TYPES.RELATIONAL,
        `Inverted equality '==' to '!='`,
        '0',
        'Expected state'
      );
    } else if (trimmed.includes('!=') && !trimmed.includes('!==') && mutants.length < 15) {
      createMutant(
        line.replace('!=', '=='),
        MUTATION_TYPES.RELATIONAL,
        `Inverted inequality '!=' to '=='`,
        'null',
        'Error'
      );
    } else if (/\s<\s/.test(line) && mutants.length < 15) {
      createMutant(
        line.replace(/\s<\s/, ' <= '),
        MUTATION_TYPES.RELATIONAL,
        `Relaxed strict comparison '<' to '<=' (introduces potential off-by-one)`,
        'Array limit index',
        'Error'
      );
    } else if (/\s>\s/.test(line) && mutants.length < 15) {
      createMutant(
        line.replace(/\s>\s/, ' >= '),
        MUTATION_TYPES.RELATIONAL,
        `Relaxed strict comparison '>' to '>='`,
        '0',
        'Non-zero response'
      );
    }

    // 2. Arithmetic Operator Replacements (+ to -, - to +, * to /)
    if (trimmed.includes(' + ') && mutants.length < 15) {
      createMutant(
        line.replace(' + ', ' - '),
        MUTATION_TYPES.ARITHMETIC,
        `Inverted addition '+' to subtraction '-'`,
        '(10, 20)',
        '30'
      );
    } else if (trimmed.includes(' - ') && mutants.length < 15) {
      createMutant(
        line.replace(' - ', ' + '),
        MUTATION_TYPES.ARITHMETIC,
        `Inverted subtraction '-' to addition '+'`,
        '(100, 20)',
        '80'
      );
    } else if (trimmed.includes(' * ') && mutants.length < 15) {
      createMutant(
        line.replace(' * ', ' / '),
        MUTATION_TYPES.ARITHMETIC,
        `Swapped multiplication '*' with division '/'`,
        '(10, 2)',
        '20'
      );
    }

    // 3. Logical Operator Replacements (&& to ||, || to &&)
    if (trimmed.includes('&&') && mutants.length < 15) {
      createMutant(
        line.replace('&&', '||'),
        MUTATION_TYPES.LOGICAL,
        `Replaced logical AND '&&' with OR '||'`,
        'Single invalid flag',
        'Error'
      );
    } else if (trimmed.includes('||') && mutants.length < 15) {
      createMutant(
        line.replace('||', '&&'),
        MUTATION_TYPES.LOGICAL,
        `Replaced logical OR '||' with AND '&&'`,
        'Alternative fallback',
        'Default value'
      );
    }

    // 4. Boolean Inversion (true to false, false to true)
    if (/\btrue\b/.test(line) && mutants.length < 15) {
      createMutant(
        line.replace(/\btrue\b/, 'false'),
        MUTATION_TYPES.BOOLEAN,
        `Flipped boolean constant 'true' to 'false'`,
        'Flag verification',
        'true'
      );
    } else if (/\bfalse\b/.test(line) && mutants.length < 15) {
      createMutant(
        line.replace(/\bfalse\b/, 'true'),
        MUTATION_TYPES.BOOLEAN,
        `Flipped boolean constant 'false' to 'true'`,
        'Guard check',
        'false'
      );
    }

    // 5. Boundary Constant Replacements (0 to 1, 1 to 0)
    if (/===?\s*0\b/.test(line) && mutants.length < 15) {
      createMutant(
        line.replace(/===?\s*0\b/, '=== 1'),
        MUTATION_TYPES.BOUNDARY,
        `Modified base case boundary from 0 to 1`,
        '0',
        'Base case 0'
      );
    } else if (/<=?\s*1\b/.test(line) && mutants.length < 15) {
      createMutant(
        line.replace(/<=?\s*1\b/, '<= 0'),
        MUTATION_TYPES.BOUNDARY,
        `Tightened boundary threshold from 1 to 0`,
        '1',
        'Expected value for 1'
      );
    }

    // 6. Return Value Modification
    if (trimmed.startsWith('return ') && !trimmed.includes('return null') && mutants.length < 15) {
      if (trimmed.includes('0') || trimmed.includes('false')) {
        createMutant(
          line.replace(/return\s+[^;]+;?/, 'return 1;'),
          MUTATION_TYPES.RETURN_VAL,
          `Altered return value constant to 1`,
          'Base input',
          '0'
        );
      } else {
        createMutant(
          line.replace(/return\s+[^;]+;?/, 'return 0;'),
          MUTATION_TYPES.RETURN_VAL,
          `Forced return value to 0`,
          'Typical positive input',
          'Non-zero output'
        );
      }
    }
  }

  // Cap at 10 high-impact mutants for snappy in-browser execution
  return mutants.slice(0, 10);
}

/**
 * Runs the full mutation test suite against the user's test cases.
 */
export function runMutationSuite(code, testCases, language = 'javascript') {
  const startTime = performance.now();
  const mutants = generateMutants(code, language);

  if (mutants.length === 0 || !testCases || testCases.length === 0) {
    return {
      totalMutants: mutants.length,
      killedCount: 0,
      survivedCount: 0,
      mutationScore: 0,
      rating: 'Inconclusive (No Mutants or Tests)',
      mutants: [],
      durationMs: 0
    };
  }

  let killedCount = 0;
  const evaluatedMutants = [];

  for (const mutant of mutants) {
    // Run the existing test suite against the mutated code
    const testResult = runTests(mutant.fullMutatedSource, testCases);

    // If ANY test fails on the mutant, the mutant is KILLED (tests successfully detected the bug!)
    const isKilled = testResult.failedCount > 0;

    let killedBy = null;
    let failureDetail = null;

    if (isKilled) {
      killedCount++;
      const failingTest = testResult.results.find(r => !r.passed);
      killedBy = failingTest ? failingTest.name : 'Unit Test Assertion';
      failureDetail = failingTest ? `Failed with: Expected ${failingTest.expected}, got ${failingTest.actual}` : 'Caught by assertion';
    }

    evaluatedMutants.push({
      ...mutant,
      status: isKilled ? 'KILLED' : 'SURVIVED',
      killedBy,
      failureDetail,
      explanation: isKilled
        ? `Successfully caught by "${killedBy}"! This test prevents regressions.`
        : `Survived! All ${testCases.length} tests passed despite this intentional code flaw. Your test suite has an unverified blind spot here.`
    });
  }

  const survivedCount = mutants.length - killedCount;
  const mutationScore = Math.round((killedCount / mutants.length) * 100);
  const durationMs = Math.round((performance.now() - startTime) * 10) / 10;

  let rating = 'Vulnerable';
  let badgeColor = 'var(--accent-rose)';

  if (mutationScore >= 85) {
    rating = 'Ironclad';
    badgeColor = 'var(--accent-emerald)';
  } else if (mutationScore >= 70) {
    rating = 'Resilient';
    badgeColor = 'var(--accent-cyan)';
  } else if (mutationScore >= 50) {
    rating = 'Moderate';
    badgeColor = 'var(--accent-amber)';
  }

  return {
    totalMutants: mutants.length,
    killedCount,
    survivedCount,
    mutationScore,
    rating,
    badgeColor,
    mutants: evaluatedMutants,
    durationMs
  };
}
