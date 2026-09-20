// Google Gemini AI integration service for DevPulse Studio

let cachedWorkingModel = null;
let cachedApiVersion = 'v1beta';

// Candidate models to try in order of preference if ListModels isn't available
const FALLBACK_CANDIDATES = [
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash',
  'gemini-1.5-pro-latest',
  'gemini-1.5-pro',
  'gemini-pro'
];

/**
 * Dynamically queries Google's ListModels API to discover what models
 * are available and support generateContent for the user's key.
 */
async function discoverAvailableModel(apiKey) {
  if (cachedWorkingModel) {
    return { model: cachedWorkingModel, apiVersion: cachedApiVersion };
  }

  const versions = ['v1beta', 'v1'];
  for (const ver of versions) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/${ver}/models?key=${apiKey}`);
      if (res.ok) {
        const data = await res.json();
        const available = (data.models || []).filter(m => 
          Array.isArray(m.supportedGenerationMethods) && 
          m.supportedGenerationMethods.includes('generateContent')
        );

        if (available.length > 0) {
          // Priority matcher: look for 2.0-flash, 2.5-flash, 1.5-flash, pro
          const priorities = [
            /gemini-2\.0-flash/i,
            /gemini-2\.5-flash/i,
            /gemini-1\.5-flash-latest/i,
            /gemini-1\.5-flash/i,
            /gemini-2\.0/i,
            /gemini-1\.5-pro/i,
            /gemini-pro/i
          ];

          for (const pattern of priorities) {
            const found = available.find(m => pattern.test(m.name));
            if (found) {
              const modelId = found.name.replace(/^models\//, '');
              cachedWorkingModel = modelId;
              cachedApiVersion = ver;
              return { model: modelId, apiVersion: ver };
            }
          }

          // If none of the specific patterns matched, pick the first supported one
          const first = available[0].name.replace(/^models\//, '');
          cachedWorkingModel = first;
          cachedApiVersion = ver;
          return { model: first, apiVersion: ver };
        }
      }
    } catch (e) {
      console.warn(`DevPulse: ListModels check failed on ${ver}:`, e);
    }
  }

  // If ListModels failed (e.g. strict CORS or permissions), fallback to default candidate
  return { model: 'gemini-2.0-flash', apiVersion: 'v1beta' };
}

/**
 * Robust caller that uses dynamic model discovery and fallback retry
 */
async function callGeminiGenerate(apiKey, promptText) {
  const sanitizedKey = (apiKey || '').trim().replace(/^["']|["']$/g, '');
  if (!sanitizedKey) {
    throw new Error("API key is required for Gemini AI. Please configure your key in AI Settings.");
  }

  // 1. First attempt with discovered / cached best model
  const discovered = await discoverAvailableModel(sanitizedKey);
  const candidateModels = [
    discovered.model,
    ...FALLBACK_CANDIDATES.filter(m => m !== discovered.model)
  ];

  let lastError = null;

  for (const model of candidateModels) {
    for (const ver of ['v1beta', 'v1']) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/${ver}/models/${model}:generateContent?key=${sanitizedKey}`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }]
          })
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          cachedWorkingModel = model;
          cachedApiVersion = ver;
          return text;
        }

        const errorData = await res.json().catch(() => ({}));
        const message = errorData.error?.message || `HTTP ${res.status}: ${res.statusText}`;

        // If 404 or model not found, try next candidate
        if (res.status === 404 || message.includes('not found') || message.includes('ListModels')) {
          cachedWorkingModel = null;
          lastError = new Error(message);
          continue;
        }

        // If it's another error (e.g. invalid API key 400 or quota 429), throw immediately
        throw new Error(message);
      } catch (err) {
        if (err.message && !err.message.includes('not found') && !err.message.includes('ListModels')) {
          throw err;
        }
        lastError = err;
      }
    }
  }

  throw lastError || new Error("Failed to communicate with Gemini AI: No compatible models found for this API key.");
}

export async function askGemini(apiKey, prompt, code, language = 'javascript') {
  const fullPrompt = `${prompt}\n\nLanguage: ${language}\nSource Code:\n\`\`\`${language}\n${code}\n\`\`\``;
  return await callGeminiGenerate(apiKey, fullPrompt);
}

// Generate real, tailored unit test cases using Gemini AI based on user's exact code
export async function generateAiTestCases(apiKey, code, language = 'javascript') {
  const promptText = `You are an expert test engineer. Analyze the following ${language} code, identify its primary methods or functions, and generate 4 to 6 high-quality unit test cases covering:
1. Happy path (standard expected input)
2. Boundary value (0, limits, or first/last elements)
3. Edge case (empty collections, single items, negative numbers)
4. Error or invalid input (null, missing parameters, or invalid types)

Source Code:
\`\`\`${language}
${code}
\`\`\`

Return ONLY a valid JSON array of objects with this exact structure:
[
  {
    "id": "ai-test-1",
    "name": "Concise description of the test case",
    "input": "Function argument string (e.g. '0' or '5' or '(10, 20)' or '\"input\"')",
    "expected": "Expected return value as string (e.g. '0' or '55' or 'Error' or 'true')",
    "type": "Happy" | "Edge" | "Boundary" | "Error"
  }
]

IMPORTANT: Output ONLY the raw JSON array. Do not include markdown formatting, explanations, or backticks.`;

  const raw = await callGeminiGenerate(apiKey, promptText);
  let rawText = raw.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();

  // If there's any surrounding text, find the json array
  const firstBracket = rawText.indexOf('[');
  const lastBracket = rawText.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    rawText = rawText.substring(firstBracket, lastBracket + 1);
  }

  try {
    const parsed = JSON.parse(rawText);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((tc, index) => ({
        id: tc.id || `ai-gen-${index + 1}`,
        name: tc.name || `AI Test Case ${index + 1}`,
        input: String(tc.input ?? ''),
        expected: String(tc.expected ?? ''),
        type: tc.type || 'Custom'
      }));
    }
  } catch (err) {
    console.warn("Failed to parse Gemini test cases JSON:", rawText, err);
  }

  throw new Error("Gemini did not return a valid test case JSON array. Please try again.");
}

// Rewrite and harden code using Gemini AI
export async function rewriteCodeWithAi(apiKey, code, language = 'javascript', findings = []) {
  const findingsSummary = findings && findings.length > 0
    ? findings.map(f => `- [${f.severity}] ${f.title}: ${f.description}`).join('\n')
    : 'No static findings flagged.';

  const promptText = `You are a Principal Software Architect. Rewrite, harden, and optimize the following ${language} code.

Goals:
1. Fix all bugs, syntax errors, logic flaws, off-by-one bounds, and uncaught exceptions.
2. Eliminate all security vulnerabilities (SQL injection, null dereferences, raw memory leaks, integer truncation).
3. Add robust input validation, boundary guards, and error handling.
4. Modernize to current ${language} industry best practices.
5. Retain all original function and class names so existing references don't break.

Known issues to resolve:
${findingsSummary}

Original Source Code:
\`\`\`${language}
${code}
\`\`\`

IMPORTANT: Output ONLY the complete, executable, clean source code. Do NOT wrap it in markdown backticks or include any conversational text or commentary.`;

  const raw = await callGeminiGenerate(apiKey, promptText);
  let rawText = raw.trim();

  // Strip opening and closing code fences if present
  const codeBlockMatch = rawText.match(/```(?:[a-zA-Z0-9_-]+)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    rawText = codeBlockMatch[1].trim();
  } else {
    rawText = rawText.replace(/^```[a-zA-Z0-9_-]*\s*\n?/i, '').replace(/```\s*$/, '').trim();
  }

  return rawText || code;
}
