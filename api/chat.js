/* OpenRouter proxy for the storefront AI assistant.
 *
 * This module is deployed as a Vercel serverless function and never
 * reaches the browser bundle. The OpenRouter key is read from
 * process.env.OPENROUTER_API_KEY here, on the server, and is never
 * echoed back to the client or written to any log line.
 *
 * The client only ever sees POST /api/chat with a { messages } body
 * and receives a plain { reply } string. */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/* The store rules live here rather than in the browser so a tampered
 * client cannot rewrite them: the assistant is told, in one place,
 * that it has no access to live prices, stock, delivery, warranty or
 * refund data. */
const STORE_SYSTEM_PROMPT = `You are Voltix AI Assistant, a helpful shopping assistant for an electronics store.

Help users:
- understand electronics products
- compare products
- choose between available options
- understand product features
- answer general shopping questions

Keep answers clear, concise, and friendly.

Do not claim store policies, prices, availability, warranties, discounts, or product details unless they are supplied by the application or conversation.

If you do not know something about the Voltix store, say so clearly.`;

/* The browser may only contribute conversation turns. Anything else is
 * dropped so the client cannot inject its own system instructions. */
const ALLOWED_ROLES = new Set(["user", "assistant"]);
const MAX_TURNS = 24;
const MAX_CONTENT_LENGTH = 2000;

function buildConversation(incoming) {
  const turns = incoming
    .filter(
      (turn) =>
        turn &&
        ALLOWED_ROLES.has(turn.role) &&
        typeof turn.content === "string" &&
        turn.content.trim()
    )
    .slice(-MAX_TURNS)
    .map((turn) => ({
      role: turn.role,
      content: turn.content.slice(0, MAX_CONTENT_LENGTH),
    }));

  return [{ role: "system", content: STORE_SYSTEM_PROMPT }, ...turns];
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed." });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.error(
      "[ai] OPENROUTER_API_KEY is not set. Add it to .env for local dev, " +
        "or to the Vercel project environment variables."
    );

    /* Deliberately vague: the browser must not learn how the server is
     * configured. */
    return res.status(500).json({ message: "The assistant is not configured yet." });
  }

  const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const conversation = buildConversation(messages);

  if (conversation.length === 1) {
    return res.status(400).json({ message: "A message is required." });
  }

  try {
    const upstream = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.PUBLIC_SITE_URL || "https://voltix-store.vercel.app",
        "X-Title": "Voltix AI Assistant",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
        messages: conversation,
      }),
    });

    const data = await upstream.json().catch(() => null);

    if (!upstream.ok) {
      /* Status and upstream message only - never the Authorization
       * header, so the key cannot leak through the logs. */
      console.error(
        "[ai] openrouter rejected the request:",
        upstream.status,
        data?.error?.message
      );

      return res.status(502).json({ message: "The assistant is unavailable right now." });
    }

    const reply = data?.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res.status(502).json({ message: "The assistant returned an empty reply." });
    }

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("[ai] proxy request failed:", error?.message);

    return res.status(502).json({ message: "The assistant is unavailable right now." });
  }
}