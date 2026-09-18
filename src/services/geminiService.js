// Optional Google Gemini AI integration service

export async function askGemini(apiKey, prompt, code) {
  if (!apiKey) {
    throw new Error("No Gemini API key provided. Using built-in heuristic engine.");
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `${prompt}\n\nLanguage: JavaScript\nSource Code:\n\`\`\`javascript\n${code}\n\`\`\``
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
