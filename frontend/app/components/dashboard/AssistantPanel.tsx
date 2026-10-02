"use client";

import { useState, type FormEvent } from "react";
import { chatWithAssistant, type AssistantMessage } from "../../lib/api";

const welcomeMessage: AssistantMessage = {
  role: "assistant",
  content:
    "Hi, I am your Roadwise assistant. Ask me about driving theory, lesson preparation, or a topic you want to practise.",
};

export function AssistantPanel() {
  const [messages, setMessages] = useState<AssistantMessage[]>([welcomeMessage]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage || loading) return;

    const userMessage: AssistantMessage = { role: "user", content: trimmedMessage };
    setMessages((current) => [...current, userMessage]);
    setMessage("");
    setError("");
    setLoading(true);
    try {
      const response = await chatWithAssistant(trimmedMessage, messages);
      setMessages((current) => [
        ...current,
        { role: "assistant", content: response.reply },
      ]);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The assistant is unavailable right now",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mb-8">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
          Roadwise support
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Ask your driving assistant
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-text-secondary">
          Get a clear explanation, a practice prompt, or help preparing for your next lesson.
        </p>
      </div>
      <section className="overflow-hidden rounded-lg border border-border bg-surface">
        <div className="grid min-h-96 gap-5 overflow-y-auto bg-background p-5 sm:p-7">
          {messages.map((item, index) => (
            <div
              className={`max-w-2xl rounded-lg p-4 text-sm leading-6 ${item.role === "user" ? "ml-auto bg-primary text-white" : "border border-border bg-surface text-text"}`}
              key={`${item.role}-${index}`}
            >
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] opacity-60">
                {item.role === "user" ? "You" : "Roadwise assistant"}
              </p>
              <p className="whitespace-pre-wrap">{item.content}</p>
            </div>
          ))}
          {loading && (
            <p className="text-sm text-text-secondary">Thinking...</p>
          )}
        </div>
        <form className="border-t border-border p-4 sm:p-5" onSubmit={sendMessage}>
          {error && <p className="mb-3 text-xs font-bold text-error">{error}</p>}
          <div className="flex items-end gap-3">
            <textarea
              className="min-h-12 flex-1 resize-y rounded-md border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary-light"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Ask a question..."
              rows={2}
              maxLength={2000}
              disabled={loading}
            />
            <button
              className="rounded-md bg-primary px-4 py-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
              type="submit"
              disabled={!message.trim() || loading}
            >
              Send
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
