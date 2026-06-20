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

// Sends outreach email through the founder's own Zoho mailbox over SMTP, so
// messages come from a real inbox (good deliverability) and replies land back in
// Zoho. Config is env-only:
//   ZOHO_USER          full mailbox address, e.g. jessie@taskbuildai.com  (the From)
//   ZOHO_APP_PASSWORD  a Zoho *app-specific* password (Settings → Security → App Passwords)
//   ZOHO_SMTP_HOST     optional, defaults to smtp.zoho.com (use smtp.zoho.eu/.in/etc per data center)
//   ZOHO_SMTP_PORT     optional, defaults to 465 (SSL); 587 = STARTTLS

export function mailerConfigured(): boolean {
  return Boolean(process.env.ZOHO_USER && process.env.ZOHO_APP_PASSWORD);
}

export function senderAddress(): string | undefined {
  return process.env.ZOHO_USER;
}

export async function sendOutreachEmail(opts: {
  to: string;
  subject: string;
  body: string;
  fromName?: string;
}): Promise<void> {
  const user = process.env.ZOHO_USER;
  const pass = process.env.ZOHO_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error(
      "Zoho SMTP not configured — set ZOHO_USER and ZOHO_APP_PASSWORD",
    );
  }

  const host = process.env.ZOHO_SMTP_HOST || "smtp.zoho.com";
  const port = Number(process.env.ZOHO_SMTP_PORT || 465);

  // Connect by resolved IP when possible (VPN getaddrinfo workaround), keeping
  // the real hostname as the TLS servername so cert validation still passes.
  const ip = await resolveHostIp(host);

  const transport = nodemailer.createTransport({
    host: ip ?? host,
    port,
    secure: port === 465, // 465 = implicit TLS; 587 upgrades via STARTTLS
    auth: { user, pass },
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
