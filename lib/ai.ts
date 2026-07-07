import Anthropic from "@anthropic-ai/sdk";

// All AI calls go through this one file. `askJson` enforces JSON-only output
// and parses defensively. Token caps are passed per use case by the caller
// (score: 300, sequence: 8000, CMO: 2000). A cap that's too small truncates the
// response mid-object; askJson detects that (stop_reason "max_tokens") and
// retries once at double the budget before giving up, so a slightly-too-small
// cap self-heals instead of surfacing as an "unparseable JSON" error.
export const AI_MODEL = "claude-sonnet-4-6";

let client: Anthropic | null = null;
function anthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not set");
  client ??= new Anthropic();
  return client;
}

const SYSTEM =
  "You are a precise B2B growth assistant for TaskBuildAI. Respond with ONLY " +
  "valid, minified JSON matching the exact shape requested. No prose, no " +
  "markdown, no code fences, no explanation outside the JSON.";

export async function askJson<T = unknown>(
  prompt: string,
  maxTokens: number,
): Promise<T> {
  let msg = await callModel(prompt, maxTokens);

  // A response that hits the token ceiling ends mid-JSON — the string or object
  // never closes, so JSON.parse fails on output that *started* valid. That reads
  // as "unparseable JSON" but the real cause is truncation, so detect it via
  // stop_reason and retry once with double the budget rather than guessing at a
  // fixed cap. (This is the failure that kept recurring on the 9-message
  // sequence: each bump to the cap bought time until the campaigns outgrew it.)
  if (msg.stop_reason === "max_tokens") {
    msg = await callModel(prompt, maxTokens * 2);
  }
  if (msg.stop_reason === "max_tokens") {
    throw new Error(
      `AI response was truncated at the ${maxTokens * 2}-token limit before the JSON closed. ` +
        `Raise the token cap for this call or shorten the requested output.`,
    );
  }

  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  return parseJson<T>(text);
}

function callModel(prompt: string, maxTokens: number) {
  return anthropic().messages.create({
    model: AI_MODEL,
    max_tokens: maxTokens,
    system: SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });
}

// Pull the first balanced JSON object/array out of a model response, tolerating
// stray prose or code fences even though the system prompt forbids them.
function parseJson<T>(raw: string): T {
  let s = raw.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  }
  const objStart = s.indexOf("{");
  const arrStart = s.indexOf("[");
  let start = -1;
  if (objStart === -1) start = arrStart;
  else if (arrStart === -1) start = objStart;
  else start = Math.min(objStart, arrStart);

  if (start !== -1) {
    const open = s[start];
    const close = open === "{" ? "}" : "]";
    const end = s.lastIndexOf(close);
    if (end > start) s = s.slice(start, end + 1);
  }
  try {
    return JSON.parse(s) as T;
  } catch {
    throw new Error(`AI returned unparseable JSON: ${raw.slice(0, 200)}`);
  }
}
