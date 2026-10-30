# TrustRAG frontend

TrustRAG is a Vite + React + TypeScript frontend. The workspace currently contains no Python application, virtual environment, `requirements.txt`, or `pyproject.toml`; therefore, a Python backend start command and its actual API contract cannot be confirmed here.

## Run locally

Requirements: Node.js and npm.

```powershell
Copy-Item .env.example .env.local
npm run dev
```

The Vite development server listens on `http://localhost:3000`. The example environment file enables a local mock/demo experience. Its sample data, canned answers, citations, and simulated indexing are illustrative only and are visibly labelled as demo data.

For API mode, set `VITE_TRUSTRAG_DEMO_MODE=false` and set `VITE_API_BASE_URL` to the URL confirmed by the backend owner. Restart Vite after changing environment variables. Requests use `credentials: 'include'` for a future server-managed cookie session; no authentication endpoint is currently integrated.

## Python backend integration

There is no Python backend or Python dependency manifest in this workspace, so do not infer a Python launch command from this frontend. The backend owner should confirm the framework, local host/port, CORS origins, authentication/session contract, request payloads, and response schemas. If frontend and backend use different local ports, the Python API must allow the Vite origin (normally `http://localhost:3000`) through its CORS configuration.

The service layer currently has these **proposed, unconfirmed** routes and shapes, based on the existing frontend adapter. Confirm or revise them with the backend owner before integration:

| Operation | Current frontend assumption |
| --- | --- |
| `GET /api/documents` | Returns `DocumentItem[]` |
| `POST /api/documents/upload` | Accepts repeated multipart fields named `files`; returns uploaded `DocumentItem[]` |
| `DELETE /api/documents/:id` | Returns a successful HTTP status when deletion completes |
| `GET /api/documents/:id/preview?page=1` | Returns `{ title, page, section, fullContent, highlight }` |
| `POST /api/query` | Accepts `{ question, document_scope, is_voice }`; returns a `ChatMessage` with only backend-provided sources, trust data, and retrieval details |
| `GET /api/history` | Returns `HistoryItem[]` |
| `POST /api/voice/transcribe` | Accepts multipart field `audio`; returns `{ text }` |

`GET /api/auth/me`, login/logout, server-side history deletion, document status polling, and a backend health check are not integrated because their contracts have not been confirmed. The frontend does not implement route security and never persists a password or a pretend authenticated user.

## Available scripts

- `npm run dev` — local development server
- `npm run lint` — TypeScript check (`tsc --noEmit`)
- `npm run build` — production build
- `npm run preview` — preview the built frontend locally
