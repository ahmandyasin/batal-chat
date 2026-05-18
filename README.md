# batal

Anonymous real-time text chat. No accounts, no bots — only random pairing between real users.

## Run locally

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Open a second tab or window to test matching between two users.

## Stack

- **Backend:** Node.js, Express, Socket.io
- **Frontend:** HTML, CSS, JavaScript (no framework)

## How it works

1. Click **Start Chat** on the landing page.
2. You are placed in a waiting queue until another real user connects.
3. When matched, messages are relayed in real time and never stored on the server.
