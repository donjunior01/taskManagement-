// LangChain.js + Google Gemini sidecar for TaskMaster Pro.
//
// The Spring backend calls this service (POST /chat, POST /complete) for AI replies; LangChain.js
// handles the Gemini conversation. Keeping it here means the API key never reaches the browser.
//
// Configuration (environment variables):
//   GEMINI_API_KEY   (required)  your Google AI Studio / Gemini API key
//   GEMINI_MODELS    (optional)  comma-separated model fallback list
//   GEMINI_MAX_TOKENS(optional)  max output tokens (default 1024)
//   PORT             (optional)  listen port (default 8090)

import express from 'express';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { SystemMessage, HumanMessage, AIMessage } from '@langchain/core/messages';

// Load a local ai-service/.env if present (local dev). No-op under Docker, where compose
// injects the environment. Requires Node >= 20.12; guarded so older runtimes still start.
try { process.loadEnvFile?.(); } catch { /* no .env file — rely on the process environment */ }

const PORT = parseInt(process.env.PORT || '8090', 10);
const API_KEY = process.env.GEMINI_API_KEY || '';
const MODELS = (process.env.GEMINI_MODELS || 'gemini-2.5-flash,gemini-2.0-flash')
  .split(',').map((s) => s.trim()).filter(Boolean);
const MAX_TOKENS = parseInt(process.env.GEMINI_MAX_TOKENS || '1024', 10);

const app = express();
app.use(express.json({ limit: '1mb' }));

/** Convert (role, content) turns + a system prompt into LangChain message objects. */
function toMessages(systemPrompt, turns) {
  const messages = [];
  if (systemPrompt && String(systemPrompt).trim()) {
    messages.push(new SystemMessage(String(systemPrompt)));
  }
  for (const turn of Array.isArray(turns) ? turns : []) {
    const content = turn && turn.content != null ? String(turn.content) : '';
    if (!content.trim()) continue;
    messages.push(turn.role === 'assistant' ? new AIMessage(content) : new HumanMessage(content));
  }
  return messages;
}

/** Run the conversation through LangChain, trying each configured model until one answers. */
async function generate(systemPrompt, turns) {
  if (!API_KEY) {
    const err = new Error('GEMINI_API_KEY is not configured on the ai-service.');
    err.code = 'NO_KEY';
    throw err;
  }
  const messages = toMessages(systemPrompt, turns);
  if (messages.length === 0) {
    const err = new Error('No content provided.');
    err.code = 'NO_INPUT';
    throw err;
  }

  let lastError;
  for (const model of MODELS) {
    try {
      const llm = new ChatGoogleGenerativeAI({ apiKey: API_KEY, model, maxOutputTokens: MAX_TOKENS });
      const res = await llm.invoke(messages);
      const text = typeof res.content === 'string'
        ? res.content
        : Array.isArray(res.content)
          ? res.content.map((c) => (typeof c === 'string' ? c : c.text || '')).join('')
          : '';
      if (text && text.trim()) return text.trim();
    } catch (err) {
      lastError = err;
      console.warn(`[ai-service] model "${model}" failed, trying next: ${err.message}`);
    }
  }
  const err = new Error(lastError ? lastError.message : 'No model produced a response.');
  err.code = 'NO_OUTPUT';
  throw err;
}

function sendError(res, err) {
  const status = err.code === 'NO_KEY' ? 503 : err.code === 'NO_INPUT' ? 400 : 502;
  res.status(status).json({ error: err.message, code: err.code || 'ERROR' });
}

app.get('/health', (_req, res) => {
  res.json({ status: 'UP', provider: 'gemini-langchain', keyConfigured: Boolean(API_KEY), models: MODELS });
});

// Multi-turn chat: { systemPrompt, turns: [{ role: 'user'|'assistant', content }] } -> { text }
app.post('/chat', async (req, res) => {
  try {
    const { systemPrompt, turns } = req.body || {};
    res.json({ text: await generate(systemPrompt, turns) });
  } catch (err) {
    sendError(res, err);
  }
});

// Single-turn completion: { systemPrompt, userContent } -> { text }
app.post('/complete', async (req, res) => {
  try {
    const { systemPrompt, userContent } = req.body || {};
    res.json({ text: await generate(systemPrompt, [{ role: 'user', content: userContent || '' }]) });
  } catch (err) {
    sendError(res, err);
  }
});

app.listen(PORT, () => {
  console.log(`[ai-service] LangChain.js Gemini service listening on :${PORT}`);
  console.log(`[ai-service] models: ${MODELS.join(', ')} | key configured: ${Boolean(API_KEY)}`);
});
