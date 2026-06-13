# AI Service (LangChain.js + Google Gemini)

A small Express microservice that powers TaskMaster Pro's AI features using
[LangChain.js](https://js.langchain.com) with Google Gemini. The Spring backend calls it
(`POST /chat`, `POST /complete`) and uses it as the **primary** AI provider; if it's unreachable
the backend transparently falls back to its in-JVM providers and rule-based engine.

Keeping the model call here means **your Gemini API key never reaches the browser.**

## Endpoints
- `GET  /health` → `{ status, provider, keyConfigured, models }`
- `POST /chat` → body `{ systemPrompt, turns: [{ role: "user"|"assistant", content }] }` → `{ text }`
- `POST /complete` → body `{ systemPrompt, userContent }` → `{ text }`

## Where to put your Gemini API key

**Option A — Docker (recommended).** Put it in a `.env` file at the **project root** (next to
`docker-compose.yml`); compose passes it to this service:
```
GEMINI_API_KEY=AIza...your key...
```
Then: `docker compose up --build`

**Option B — Run locally (no Docker).**
```
cd ai-service
cp .env.example .env        # then edit .env and set GEMINI_API_KEY
npm install
GEMINI_API_KEY=AIza... npm start      # or rely on the .env value
```
Point the backend at it by setting `AI_SERVICE_URL=http://localhost:8090` before starting Spring.

Get a key from Google AI Studio: https://aistudio.google.com/app/apikey
