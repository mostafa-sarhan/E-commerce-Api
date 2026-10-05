import { useEffect, useRef, useState } from "react";
import { askAssistant } from "../../services/ai/aiApi";
import "./AIChatWidget.css";

const GREETING = "Hi 👋 I'm the Voltix AI Assistant. How can I help you today?";
const FALLBACK_REPLY = "Sorry, I couldn't respond right now. Please try again.";

/* Inline icons rather than emoji or an icon dependency. */
function SparkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="26"
      height="26"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3z" />
      <path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="19"
      height="19"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4.5 12h14" />
      <path d="M12.5 5.5L19 12l-6.5 6.5" />
    </svg>
  );
}

function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, role: "assistant", content: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const listRef = useRef(null);
  const inputRef = useRef(null);
  const idRef = useRef(1);

  function nextId() {
    idRef.current += 1;
    return idRef.current;
  }

  /* Newest message wins the scroll position. Runs for the pending
     bubble too, so the placeholder scrolls into view. */
  useEffect(() => {
    const list = listRef.current;

    if (!list) return;

    list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
  }, [messages, isSending]);

  /* Land the caret in the composer when the panel opens. */
  useEffect(() => {
    if (!isOpen) return;

    const frame = requestAnimationFrame(() => inputRef.current?.focus());

    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  async function handleSubmit(event) {
    event.preventDefault();

    const text = input.trim();

    if (!text || isSending) return;

    const conversation = [...messages, { id: nextId(), role: "user", content: text }];

    setMessages(conversation);
    setInput("");
    setIsSending(true);

    try {
      const reply = await askAssistant(conversation);

      setMessages((current) => [
        ...current,
        { id: nextId(), role: "assistant", content: reply || FALLBACK_REPLY },
      ]);
    } catch (error) {
      /* Technical detail stays in the console during development; the
         visitor just sees a normal assistant turn. */
      console.error("[ai] assistant request failed:", error?.message);

      setMessages((current) => [
        ...current,
        { id: nextId(), role: "assistant", content: FALLBACK_REPLY },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  /* Enter sends, Shift+Enter breaks the line. The textarea grows on its
     own up to a capped height, so nothing here measures the DOM. */
  function handleInputKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  }

  /* Escape closes. Handled as a bubbling React event from inside the
     panel rather than a window listener. */
  function handlePanelKeyDown(event) {
    if (event.key === "Escape") {
      event.stopPropagation();
      setIsOpen(false);
    }
  }

  return (
    <div className="ai-chat">
      {isOpen && (
        <section
          className="ai-chat-panel"
          role="dialog"
          aria-label="Voltix AI Assistant"
          onKeyDown={handlePanelKeyDown}
        >
          <header className="ai-chat-header">
            <span className="ai-chat-header-icon">
              <SparkIcon />
            </span>

            <div className="ai-chat-heading">
              <strong>Voltix AI Assistant</strong>
              <span className="ai-chat-status">
                <i aria-hidden="true" /> Online
              </span>
            </div>

            <button
              type="button"
              className="ai-chat-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close Voltix AI Assistant"
            >
              <CloseIcon />
            </button>
          </header>

          <div
            className="ai-chat-messages"
            ref={listRef}
            role="log"
            aria-live="polite"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`ai-chat-row is-${message.role}`}
              >
                <div className="ai-chat-bubble">{message.content}</div>
              </div>
            ))}

            {isSending && (
              <div className="ai-chat-row is-assistant">
                <div className="ai-chat-bubble is-pending">
                  <span className="ai-chat-dots" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                  <span className="ai-chat-pending-text">Thinking…</span>
                </div>
              </div>
            )}
          </div>

          <form className="ai-chat-compose" onSubmit={handleSubmit}>
            <label className="ai-chat-label" htmlFor="ai-chat-input">
              Message
            </label>

            <textarea
              id="ai-chat-input"
              ref={inputRef}
              className="ai-chat-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Ask me anything..."
              rows={1}
              autoComplete="off"
            />

            <button
              type="submit"
              className="ai-chat-send"
              disabled={isSending || !input.trim()}
              aria-label="Send message"
            >
              <SendIcon />
            </button>
          </form>
        </section>
      )}

      {/* Only one close control is ever on screen: the header cross. */}
      {!isOpen && (
        <button
          type="button"
          className="ai-chat-fab"
          onClick={() => setIsOpen(true)}
          aria-label="Open Voltix AI Assistant"
          aria-haspopup="dialog"
        >
          <SparkIcon />
        </button>
      )}
    </div>
  );
}

export default AIChatWidget;