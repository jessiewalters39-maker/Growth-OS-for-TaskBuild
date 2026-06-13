// One-time helper: mint a Google Search Console refresh token via OAuth, so the
// app can read organic-search metrics without a service-account key (which a
// Google org policy commonly blocks).
//
// Prereq: a Google Cloud OAuth client of type "Desktop app" (gives a client id
// + secret). Enable the "Google Search Console API" and publish the OAuth
// consent screen to "In production" so the refresh token doesn't expire.
//
// Run (from the project root), signed into the browser as the Search Console
// owner:
//   node scripts/gsc-auth.mjs <CLIENT_ID> <CLIENT_SECRET>
// or set GSC_CLIENT_ID / GSC_CLIENT_SECRET in the env and run with no args.
//
// It prints GSC_REFRESH_TOKEN — paste that into Vercel + .env.local alongside
// GSC_CLIENT_ID, GSC_CLIENT_SECRET, and GSC_SITE_URL.

import http from "node:http";

const CLIENT_ID = process.argv[2] || process.env.GSC_CLIENT_ID;
const CLIENT_SECRET = process.argv[3] || process.env.GSC_CLIENT_SECRET;
const PORT = 5858;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "Missing credentials.\n" +
      "  node scripts/gsc-auth.mjs <CLIENT_ID> <CLIENT_SECRET>\n" +
      "  (or set GSC_CLIENT_ID and GSC_CLIENT_SECRET in the env)",
  );
  process.exit(1);
}

const authUrl =
  "https://accounts.google.com/o/oauth2/v2/auth?" +
  new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline", // ask for a refresh token
    prompt: "consent", // force it even if previously granted
  }).toString();

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://localhost:${PORT}`);
  if (u.pathname !== "/callback") {
    res.writeHead(404);
    res.end();
    return;
  }

  const err = u.searchParams.get("error");
  if (err) {
    res.end(`Auth error: ${err}. Check the terminal.`);
    console.error("\nAuth error:", err);
    server.close();
    return;
  }

  const code = u.searchParams.get("code");
  if (!code) {
    res.end("No authorization code received.");
    return;
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }).toString(),
    });
    const tok = await tokenRes.json();

    if (!tok.refresh_token) {
      res.end(
        "No refresh_token returned — see the terminal. Re-run after revoking " +
          "prior access, and make sure access_type=offline + prompt=consent.",
      );
      console.error("\nNo refresh_token in response:", tok);
    } else {
      res.end("Success! Your refresh token is printed in the terminal. You can close this tab.");
      console.log("\n========================================");
      console.log("GSC_REFRESH_TOKEN=" + tok.refresh_token);
      console.log("========================================\n");
      console.log("Add that (plus GSC_CLIENT_ID, GSC_CLIENT_SECRET, GSC_SITE_URL)");
      console.log("to Vercel env vars and your local .env.local.\n");
    }
  } catch (e) {
    res.end("Token exchange failed — see terminal.");
    console.error("\nToken exchange failed:", e);
  }
  server.close();
});

server.listen(PORT, () => {
  console.log("\n1. Make sure your OAuth client lists this redirect URI:");
  console.log("   " + REDIRECT_URI);
  console.log("   (Desktop-app clients allow localhost automatically.)\n");
  console.log("2. Open this URL in your browser, signed in as the Search Console owner:\n");
  console.log("   " + authUrl + "\n");
  console.log("3. Approve access (click through the 'unverified app' notice if shown).");
  console.log("   Waiting for the redirect on port " + PORT + "...\n");
});
