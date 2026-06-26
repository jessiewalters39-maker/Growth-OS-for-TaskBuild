import nodemailer from "nodemailer";
import { resolve4 } from "node:dns/promises";

// Resolve a host to an IPv4 via c-ares (resolve4), which sends DNS queries
// directly and bypasses the OS getaddrinfo() — the call that some Windows VPNs
// (notably NordVPN) lock up with "getaddrinfo EBUSY". Returns null on any
// failure (or if the host is already an IP) so callers fall back to the
// hostname. Harmless everywhere else, including production.
async function resolveHostIp(host: string): Promise<string | null> {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return null; // already an IP
  try {
    const ips = await resolve4(host);
    return ips[0] ?? null;
  } catch {
    return null;
  }
}

// Sends outreach email through the founder's own mailbox over SMTP, so messages
// come from a real inbox (good deliverability) and replies land back there.
// Now points at Google Workspace / Gmail. Config is env-only:
//   SMTP_USER      full mailbox address, e.g. jessie@taskbuildai.com  (the From)
//   SMTP_PASSWORD  a Google *App Password* (Account → Security → App passwords; needs 2-Step Verification on)
//   SMTP_HOST      optional, defaults to smtp.gmail.com
//   SMTP_PORT      optional, defaults to 465 (SSL); 587 = STARTTLS
//
// The legacy ZOHO_* names are still read as a fallback so a half-migrated
// environment (e.g. a Vercel project still holding the old keys) keeps working.
const SMTP_USER = process.env.SMTP_USER || process.env.ZOHO_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || process.env.ZOHO_APP_PASSWORD;
const SMTP_HOST =
  process.env.SMTP_HOST || process.env.ZOHO_SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || process.env.ZOHO_SMTP_PORT || 465);

export function mailerConfigured(): boolean {
  return Boolean(SMTP_USER && SMTP_PASSWORD);
}

export function senderAddress(): string | undefined {
  return SMTP_USER;
}

export async function sendOutreachEmail(opts: {
  to: string;
  subject: string;
  body: string;
  fromName?: string;
}): Promise<void> {
  const user = SMTP_USER;
  const pass = SMTP_PASSWORD;
  if (!user || !pass) {
    throw new Error(
      "SMTP not configured — set SMTP_USER and SMTP_PASSWORD",
    );
  }

  const host = SMTP_HOST;
  const port = SMTP_PORT;

  // Connect by resolved IP when possible (VPN getaddrinfo workaround), keeping
  // the real hostname as the TLS servername so cert validation still passes.
  const ip = await resolveHostIp(host);

  const transport = nodemailer.createTransport({
    host: ip ?? host,
    port,
    secure: port === 465, // 465 = implicit TLS; 587 upgrades via STARTTLS
    // Google shows App Passwords grouped as "abcd efgh ijkl mnop"; the spaces are
    // cosmetic and must be stripped or auth fails. (App passwords never contain
    // real spaces, so this is safe.)
    auth: { user, pass: pass.replace(/\s+/g, "") },
    ...(ip ? { tls: { servername: host } } : {}),
  });

  await transport.sendMail({
    from: opts.fromName ? `"${opts.fromName}" <${user}>` : user,
    to: opts.to,
    subject: opts.subject,
    // Plain text on purpose: cold outreach lands better and reads as a real
    // person typing, not a marketing template.
    text: opts.body,
  });
}
