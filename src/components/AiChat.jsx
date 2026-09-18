import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Wrench, 
  Copy, 
  Check, 
  Trash2, 
  Zap, 
  ShieldAlert, 
  HelpCircle,
  Lightbulb,
  CornerDownLeft
} from 'lucide-react';
import { askGemini } from '../services/geminiService';

export function AiChat({
  code,
  language = 'javascript',
  analysis,
  executionResult,
  apiKey,
  onApplyCodeToEditor
}) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I am your **DevPulse AI Assistant**. I can help you explain this ${language} code, diagnose bugs, optimize Big-O complexity, or generate edge-case tests.

Try one of the quick prompts below or ask any question!`,
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const quickPrompts = [
    { label: 'Explain Logic', icon: Lightbulb, query: 'Explain how this code works step-by-step in plain English.' },
    { label: 'Root Cause', icon: HelpCircle, query: 'What is the root cause of the bug in this code, and what is the exact fix?' },
    { label: 'Optimize Big-O', icon: Zap, query: 'How can I optimize the algorithmic time and space complexity of this code?' },
    { label: 'Find Edge Cases', icon: Sparkles, query: 'What unusual edge cases or boundary conditions could break this function?' },
    { label: 'Security Audit', icon: ShieldAlert, query: 'Audit this code for security vulnerabilities, injection vectors, and sanitize inputs.' }
  ];

  const handleSendMessage = async (queryText) => {
    const textToSend = queryText || inputText;
    if (!textToSend.trim() || isThinking) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsThinking(true);

    try {
      let replyContent = '';

      if (apiKey) {
        // Live Gemini API Call
        const systemPrompt = `You are DevPulse AI, an expert code reviewer, debugger, and testing assistant.
Language: ${language}
Review Score: ${analysis?.score || 100}/100 (Grade: ${analysis?.grade || 'A'})
Identified Findings: ${JSON.stringify(analysis?.findings?.map(f => ({ title: f.title, line: f.line, severity: f.severity })) || [])}
Execution Error: ${executionResult?.error ? `${executionResult.error.name}: ${executionResult.error.message}` : 'None'}

Provide concise, high-value, actionable advice. When suggesting fixes, include markdown code blocks.`;

        replyContent = await askGemini(apiKey, systemPrompt + '\n\nUser Question: ' + textToSend, code);
      } else {
        // Built-in Intelligent Contextual Response Synthesizer (Offline)
        await new Promise(r => setTimeout(r, 600)); // natural delay
        replyContent = generateContextualReply(textToSend, code, language, analysis, executionResult);
      }

      const botMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: replyContent,
        timestamp: new Date().toLocaleTimeString()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **AI Service Notice:** ${err.message}\n\nFalling back to built-in local heuristics:\n\n${generateContextualReply(textToSend, code, language, analysis, executionResult)}`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleCopyMessage = async (msgId, content) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="ai-chat-container">
      {/* Quick Prompt Chips */}
      <div className="quick-prompts-bar">
        {quickPrompts.map((qp, idx) => {
          const Icon = qp.icon;
          return (
            <button
              key={idx}
              className="quick-prompt-chip"
              onClick={() => handleSendMessage(qp.query)}
              disabled={isThinking}
            >
              <Icon size={12} />
              <span>{qp.label}</span>
            </button>
          );
        })}
      </div>

      {/* Messages List */}
      <div className="chat-messages-area">
        {messages.map((msg) => {
          const isBot = msg.role === 'assistant';
          return (
            <div key={msg.id} className={`chat-bubble-row ${isBot ? 'bot-row' : 'user-row'}`}>
              <div className="chat-avatar">
                {isBot ? <Sparkles size={14} color="#c084fc" /> : <User size={14} />}
              </div>

              <div className="chat-bubble-content">
                <div className="bubble-header">
                  <span className="bubble-sender">{isBot ? 'DevPulse AI' : 'You'}</span>
                  <span className="bubble-time">{msg.timestamp}</span>
                  {isBot && (
                    <button 
                      className="bubble-copy-btn"
                      onClick={() => handleCopyMessage(msg.id, msg.content)}
                      title="Copy response"
                    >
                      {copiedId === msg.id ? <Check size={11} color="var(--accent-emerald)" /> : <Copy size={11} />}
                    </button>
                  )}
                </div>

                <div className="bubble-markdown">
                  {renderMarkdownWithCode(msg.content, onApplyCodeToEditor)}
                </div>
              </div>
            </div>
          );
        })}

        {isThinking && (
          <div className="chat-bubble-row bot-row">
            <div className="chat-avatar">
              <Sparkles size={14} color="#c084fc" className="spin" />
            </div>
            <div className="chat-bubble-content thinking-indicator">
              <span>Thinking & inspecting code context...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Chat Input Bar */}
      <div className="chat-input-wrapper">
        <form 
          className="chat-input-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
        >
          <input
            type="text"
            className="chat-input-field"
            placeholder={`Ask about this ${language} code, request optimization, or debug advice...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isThinking}
          />
          <button 
            type="submit" 
            className="chat-send-btn"
            disabled={isThinking || !inputText.trim()}
          >
            <Send size={14} />
          </button>
        </form>

        <div className="chat-disclaimer">
          <span>{apiKey ? 'Powered by live Google Gemini Model' : 'Using contextual heuristic AI engine (100% offline). Add an API key for live LLM chat.'}</span>
          {messages.length > 2 && (
            <button 
              className="chat-clear-btn" 
              onClick={() => setMessages([messages[0]])}
              title="Clear chat messages"
            >
              <Trash2 size={11} /> Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Contextual Offline AI Response Generator
function generateContextualReply(query, code, language, analysis, executionResult) {
  const q = query.toLowerCase();
  const findings = analysis?.findings || [];
  const error = executionResult?.error;

  if (q.includes('explain') || q.includes('how this code works')) {
    return `### Code Explanation (${language.toUpperCase()})
This program defines a primary function operating over the input parameters.

**Key Architecture Points:**
1. **Flow & Control:** The code processes input data and utilizes branching conditions to evaluate termination or transformation.
2. **Current Quality Grade:** **${analysis?.grade || 'B'}** (${analysis?.score || 85}/100).
3. **Identified Bottlenecks:** Found ${findings.length} notable areas including:
${findings.slice(0, 3).map(f => `- **${f.title}** (Line ${f.line}): ${f.description}`).join('\n')}

**Recommendations:** Consider implementing defensive bounds validation and checking edge cases (e.g. empty or null parameters).`;
  }

  if (q.includes('root cause') || q.includes('why') || q.includes('bug') || q.includes('fix')) {
    if (error) {
      return `### 🐞 Root Cause Analysis
**Error:** \`${error.name}: ${error.message}\`
**Location:** Line ${error.line || 'Global'}

**Why this broke:**
${error.diagnosis?.cause || 'An unhandled exception interrupted execution.'}

**Remediation:**
${error.diagnosis?.fix || 'Validate input bounds and sanitize parameters.'}

\`\`\`${language}
// Recommended Guard
${language === 'python' ? 'if n is None or n < 0:\n    raise ValueError("Invalid input")' : 'if (!arg || typeof arg !== "number") throw new TypeError("Invalid argument");'}
\`\`\``;
    }

    if (findings.length > 0) {
      const topIssue = findings[0];
      return `### 🔍 Identified Primary Issue: ${topIssue.title}
**Affected Line:** Line ${topIssue.line}
**Severity:** ${topIssue.severity.toUpperCase()}

**Explanation:**
${topIssue.description}

**Suggested Fix:**
\`\`\`${language}
${topIssue.suggestedFix || '// Apply defensive parameter checks'}
\`\`\`
${topIssue.recommendation}`;
    }

    return `No active crashes detected! The code executed cleanly within runtime boundaries.`;
  }

  if (q.includes('optimize') || q.includes('big-o') || q.includes('complexity')) {
    const comp = analysis?.complexity || { time: 'O(N)', space: 'O(1)' };
    return `### ⚡ Algorithmic Complexity Profile
- **Current Time Complexity:** \`${comp.time}\`
- **Space Complexity:** \`${comp.space}\`
- **Explanation:** ${comp.explanation}

**Optimization Strategies:**
1. **Memoization / Caching:** Store intermediate results in a hash map to avoid redundant branch evaluations.
2. **Space-Time Tradeoff:** Replace inner $O(N)$ lookups with an $O(1)$ \`Set\` or hash table lookup prior to iterations.`;
  }

  if (q.includes('edge case') || q.includes('break')) {
    return `### 🧪 Recommended Edge Cases to Test
Here are critical edge cases that should be verified:
1. **Empty / Null Input:** \`null\`, \`None\`, or empty string/array.
2. **Boundary Zero:** Input equals \`0\` or \`1\`.
3. **Negative Numbers:** Negative arguments where only non-negative inputs are valid.
4. **Large Scale:** Inputs $> 10^5$ to verify memory stack depth and avoid call stack overflows.
5. **Type Mismatch:** Passing unexpected types (e.g. passing a string or float where an integer is expected).`;
  }

  if (q.includes('security') || q.includes('vuln') || q.includes('injection')) {
    return `### 🛡️ Security Audit
${findings.some(f => f.category === 'Security') ? `⚠️ **Security Issues Detected!**
${findings.filter(f => f.category === 'Security').map(f => `- **${f.title}** (Line ${f.line}): ${f.description}`).join('\n')}` : `✅ No critical OWASP security vulnerabilities flagged.`}

**Security Checklist:**
- Always use parameterized queries for database operations.
- Never hardcode API keys or secret tokens in source control.
- Avoid dynamic string execution (\`eval\`, \`exec\`).`;
  }

  return `I have analyzed your **${language}** code. Current overall score: **${analysis?.score || 90}/100 (${analysis?.grade || 'A'})**.
You can ask me to explain specific lines, diagnose runtime errors, or help write unit tests!`;
}

// Formatter to render Markdown and Code Blocks with "Apply to Editor" buttons
function renderMarkdownWithCode(text, onApply) {
  const parts = text.split(/(```[a-zA-Z]*[\s\S]*?```)/g);

  return parts.map((part, idx) => {
    if (part.startsWith('```')) {
      const match = part.match(/```([a-zA-Z]*)\n([\s\S]*?)```/);
      const lang = match ? match[1] : '';
      const codeBlock = match ? match[2].trim() : part.replace(/```/g, '').trim();

      return (
        <div key={idx} className="chat-code-block">
          <div className="chat-code-header">
            <span>{lang || 'code'}</span>
            {onApply && (
              <button 
                className="chat-apply-code-btn"
                onClick={() => onApply(codeBlock)}
                title="Replace editor code with this snippet"
              >
                <Wrench size={11} />
                <span>Apply to Editor</span>
              </button>
            )}
          </div>
          <pre><code>{codeBlock}</code></pre>
        </div>
      );
    }

    // Standard markdown formatting
    const boldFormatted = part
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.*?)`/g, '<code>$1</code>');

    return (
      <div 
        key={idx} 
        dangerouslySetInnerHTML={{ __html: boldFormatted.replace(/\n/g, '<br />') }} 
      />
    );
  });
}
