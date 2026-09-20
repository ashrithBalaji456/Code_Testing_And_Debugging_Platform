// Google Gemini AI integration service for DevPulse Studio

export async function askGemini(apiKey, prompt, code, language = 'javascript') {
  if (!apiKey) {
    throw new Error("No Gemini API key provided. Please configure your API key in AI Settings.");
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `${prompt}\n\nLanguage: ${language}\nSource Code:\n\`\`\`${language}\n${code}\n\`\`\``
          }
        ]
      }
    ]
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gemini API Error: ${res.statusText}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text;
}

// Generate real, tailored unit test cases using Gemini AI based on user's exact code
export async function generateAiTestCases(apiKey, code, language = 'javascript') {
  if (!apiKey) {
    throw new Error("API key is required to generate AI unit tests.");
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

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

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }]
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gemini API Error: ${res.statusText}`);
  }

  const data = await res.json();
  let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

  // Clean markdown backticks if Gemini included them
  rawText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();

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
  if (!apiKey) {
    throw new Error("API key is required to rewrite code with AI.");
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

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

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }]
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gemini API Error: ${res.statusText}`);
  }

  const data = await res.json();
  let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Clean markdown code blocks if present
  rawText = rawText.replace(/^```[a-zA-Z0-9_-]*\s*\n?/i, '').replace(/```\s*$/, '').trim();

  return rawText || code;
}
