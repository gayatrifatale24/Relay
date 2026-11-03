# Relay: AI Customer Support Agent

A full-stack customer support chat app. Users sign up, chat with an AI support assistant, and come back to their saved conversations at any time.

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS 4, TanStack Query, Framer Motion
- **Backend:** Node.js, Express 5, TypeScript, MongoDB (Mongoose)
- **Auth:** JWT in an HttpOnly, SameSite cookie, passwords hashed with bcrypt
- **AI:** OpenRouter chat completions (any model, free models by default)
- **DevOps:** Dockerfiles for both apps, `docker compose up` runs everything including MongoDB

## Features

- **Accounts:** sign up, sign in and sign out, with validation on both client and server. Passwords are hashed with bcrypt (12 rounds).
- **Protected routes:** `/chat` is guarded by a Next.js proxy, and every API route verifies the JWT.
- **AI chat:** each request sends the recent conversation history (last 20 turns) to the model, so replies stay in context.
- **Streaming replies:** replies arrive over Server-Sent Events and appear token by token with a blinking cursor. A Stop button ends a reply early, and the partial text is kept and saved.
- **Saved history:** conversations are stored in MongoDB per user, listed in the sidebar grouped by date (Today, Yesterday, ...), searchable and deletable.
- **Chat experience:**
  - Enter to send, Shift + Enter for a new line.
  - Typing indicator while the assistant replies.
  - Markdown rendering and a copy button on replies.
  - Auto-scroll with a jump-to-latest button.
  - Failed messages can be retried or edited.
  - Duplicate submissions are blocked.
- **UI:** responsive layout with a collapsible sidebar on desktop and a drawer on mobile. Light and dark themes follow the system. Animations respect `prefers-reduced-motion`.
- **Bonus items:**
  - Rate limiting: 20 messages per minute per user, 30 auth attempts per 15 minutes.
  - Typing indicator.
  - Dev and prod configuration through env vars.

## Project structure

```
.
├── client/                    Next.js app
│   └── src/
│       ├── app/               Routes: (auth)/login, (auth)/signup, (dashboard)/chat/[conversationId]
│       ├── features/
│       │   ├── auth/          components, hooks, services, types, validations
│       │   └── chat/          components (sidebar, transcript, composer…), hooks, services, types, utils
│       ├── components/ui/     Button, TextField, Dialog, DropdownMenu, Skeleton, Logo…
│       ├── lib/api/client.ts  Axios instance and normalized ApiError
│       ├── providers/         React Query + Framer Motion config, global 401 handling
│       └── proxy.ts           Route guard (Next.js 16 "proxy", formerly middleware)
├── server/                    Express API
│   └── src/
│       ├── config/env.ts      Validated environment config (zod)
│       ├── models/            User, Conversation (embedded messages)
│       ├── routes/            auth.routes.ts, chat.routes.ts
│       ├── middleware/        requireAuth, validation, error handler
│       └── services/          token (JWT + cookie), ai (OpenRouter)
└── docker-compose.yml
```

### How auth works

The browser only talks to the Next.js origin. Next.js rewrites `/api/*` to the Express server, so the JWT cookie is first-party, `HttpOnly`, `SameSite=Lax`, and `Secure` in production. The token is never readable from JavaScript and never stored in `localStorage`. The Express API also accepts `Authorization: Bearer <token>` for non-browser clients.

## API

All chat routes require authentication.

| Method | Path | Description |
| --- | --- | --- |
| POST | `/auth/signup` | `{ name, email, password }`: creates the account and sets the session cookie |
| POST | `/auth/login` | `{ email, password }`: sets the session cookie |
| POST | `/auth/logout` | Clears the session cookie |
| GET | `/auth/me` | Current user |
| POST | `/chat/send` | `{ message, conversationId? }`: returns the complete AI reply as JSON. Omit `conversationId` to start a new conversation |
| POST | `/chat/stream` | Same body as `/chat/send`, but streams the reply as Server-Sent Events (used by the web app, see below) |
| GET | `/chat/history` | The user's conversations (title, preview, timestamps), newest first |
| GET | `/chat/conversations/:id` | One conversation with all messages |
| DELETE | `/chat/conversations/:id` | Deletes a conversation |

Errors use one shape: `{ "error": { "message": "...", "code": "..." } }`.

### Streaming (`POST /chat/stream`)

The response is `text/event-stream`. Validation, auth and provider errors (for example rate limits) are returned as normal JSON errors before the stream starts. Once streaming begins, the server sends these events:

```
event: start   data: {"conversation":{"id","title","createdAt"},"userMessage":{"id","createdAt"},"assistantMessage":{"id","createdAt"}}
event: delta   data: {"text":"Hi Ravi, I'm sorry"}          (one per generated chunk)
event: done    data: {"conversation":{...},"messages":[user, assistant]}   (same shape as /chat/send)
event: error   data: {"message":"...","code":"..."}       (failure after streaming began)
```

If the client disconnects mid-reply (the Stop button aborts the request), the server saves the partial reply under the ids from `start`. Try it with curl:

```bash
curl -N -b cookies.txt -X POST http://localhost:5000/chat/stream -H "Content-Type: application/json" -d '{"message":"How do I reset my password?"}'
```

## Running with Docker (recommended)

You need Docker Desktop and an OpenRouter API key from https://openrouter.ai/keys (free models are available).

```bash
cp .env.example .env
```

Then edit `.env` and set `JWT_SECRET` (32+ random characters) and `OPENROUTER_API_KEY`. Start everything with:

```bash
docker compose up --build
```

Open http://localhost:3000. Compose starts MongoDB, the API (port 5000) and the web app (port 3000).

## Running locally without Docker

You need Node.js 20+ and MongoDB, either running locally or a MongoDB Atlas connection string.

```bash
# 1. API
cd server
cp .env.example .env        # set MONGO_URI, JWT_SECRET, OPENROUTER_API_KEY
npm install
npm run dev                 # http://localhost:5000

# 2. Web app (in a second terminal)
cd client
cp .env.example .env.local  # API_URL=http://localhost:5000
npm install
npm run dev                 # http://localhost:3000
```

Generate a JWT secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Environment variables

**server/.env**

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `MONGO_URI` | yes | – | Local MongoDB or Atlas `mongodb+srv://…` |
| `JWT_SECRET` | yes | – | At least 32 characters |
| `OPENROUTER_API_KEY` | yes | – | The server starts without it, but `/chat/send` returns 503 until it is set |
| `OPENROUTER_MODEL` | no | `nvidia/nemotron-3-ultra-550b-a55b:free` | Any OpenRouter model id |
| `OPENROUTER_BASE_URL` | no | `https://openrouter.ai/api/v1` | Only for an OpenRouter-compatible proxy |
| `JWT_EXPIRES_IN` | no | `7d` | |
| `CLIENT_ORIGIN` | no | `http://localhost:3000` | CORS origin(s), comma separated |
| `COOKIE_SECURE` | no | `true` in production | Set `false` only for plain-HTTP setups such as local Docker |
| `PORT` / `NODE_ENV` | no | `5000` / `development` | |

**client/.env.local**

| Variable | Default | Notes |
| --- | --- | --- |
| `API_URL` | `http://localhost:5000` | Where Next.js proxies `/api/*`. Read at build time |

## Scripts

| | client | server |
| --- | --- | --- |
| Dev server | `npm run dev` | `npm run dev` |
| Production build | `npm run build` | `npm run build` |
| Start build | `npm start` | `npm start` |
| Lint | `npm run lint` | `npm run lint` |
| Type check | `npx tsc --noEmit` | `npm run typecheck` |

## Deployment (free tiers)

1. **Database:** create a free MongoDB Atlas cluster and allow access from your API host.
2. **API (Render or Railway):** deploy `server/` with build command `npm ci && npm run build` and start command `npm start`. Set the server env vars, with `NODE_ENV=production` and `CLIENT_ORIGIN=https://<your-web-domain>`.
3. **Web (Vercel):** import the repo with root directory `client/` and set `API_URL=https://<your-api-domain>`. Because the browser calls `/api` on the Vercel domain, the auth cookie stays first-party and no cross-site cookie settings are needed.

## Notes and limitations

- Free OpenRouter models are rate limited and change over time. If the default model is unavailable, set `OPENROUTER_MODEL` to another id from https://openrouter.ai/models.
- Context sent to the model is capped at the last 20 messages of a conversation.
# Relay
