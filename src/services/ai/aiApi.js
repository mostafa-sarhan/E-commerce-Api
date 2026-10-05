/* Client-side caller for the AI assistant.
 *
 * It talks to /api/chat on the same origin, which is the serverless
 * function in api/chat.js. No key, no model name and no provider URL
 * live here: this file only knows the local endpoint, so the browser
 * bundle has nothing sensitive to leak. */

export async function askAssistant(messages) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages }),
  });

  let data;
  const text = await response.text();

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text };
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        `The assistant request failed with status ${response.status}`
    );
  }

  return data?.reply || "";
}