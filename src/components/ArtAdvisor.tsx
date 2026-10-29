"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

// ---------------------------------------------------------------------------
// Floating "Art Advisor" chat widget (bottom-right on every page).
//
// Teaching notes:
//   • useChat (from the Vercel AI SDK) manages the whole conversation:
//     message list, sending, streaming updates, and loading status.
//   • Each message is made of "parts". A text part is something the AI wrote;
//     a "tool-searchArtworks" part is the result of the AI searching our
//     database. We render tool results as clickable artwork cards.
// ---------------------------------------------------------------------------

interface FoundArtwork {
  slug: string;
  title: string;
  artist: string;
  price: number;
  imageUrl: string;
}

const STARTERS = [
  "Something calm and blue under $1,000",
  "A bold piece for a modern office",
  "What photography do you have?",
];

export default function ArtAdvisor() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/ai/advisor" }),
  });
  const busy = status === "submitted" || status === "streaming";

  // Keep the newest message in view
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const send = (text: string) => {
    if (!text.trim() || busy) return;
    sendMessage({ text: text.trim() });
    setInput("");
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 px-5 py-3 bg-gallery-text text-white text-xs uppercase tracking-widest rounded-full shadow-lg hover:bg-gallery-accent-hover transition-colors"
      >
        ✨ Art Advisor
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[calc(100vw-3rem)] max-w-sm h-[32rem] flex flex-col bg-white border border-gallery-border rounded-sm shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gallery-border">
        <div>
          <p className="font-serif text-gallery-text">Art Advisor</p>
          <p className="text-[11px] text-gallery-muted">AI suggestions from our gallery</p>
        </div>
        <button
          onClick={() => setOpen(false)}
          aria-label="Close advisor"
          className="text-gallery-muted hover:text-gallery-text text-xl leading-none"
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-sm">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-gallery-muted">
              Tell me about your space, style, or budget and I&apos;ll find artworks for you.
            </p>
            {STARTERS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="block w-full text-left px-3 py-2 border border-gallery-border rounded-sm text-gallery-text hover:border-gallery-text transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={message.role === "user" ? "text-right" : ""}>
            {message.parts.map((part, i) => {
              if (part.type === "text") {
                return (
                  <p
                    key={i}
                    className={`inline-block max-w-[90%] px-3 py-2 rounded-sm whitespace-pre-wrap text-left ${
                      message.role === "user"
                        ? "bg-gallery-text text-white"
                        : "bg-gallery-subtle text-gallery-text"
                    }`}
                  >
                    {part.text}
                  </p>
                );
              }
              if (part.type === "tool-searchArtworks") {
                if (part.state !== "output-available") {
                  return (
                    <p key={i} className="text-xs text-gallery-muted italic">
                      Searching the gallery…
                    </p>
                  );
                }
                const found = (part.output as { artworks?: FoundArtwork[] }).artworks ?? [];
                return (
                  <div key={i} className="flex gap-2 overflow-x-auto pb-1 my-2">
                    {found.slice(0, 4).map((a) => (
                      <Link
                        key={a.slug}
                        href={`/artwork/${a.slug}`}
                        className="flex-shrink-0 w-28 group"
                      >
                        <div className="relative w-28 h-28 bg-gallery-subtle rounded-sm overflow-hidden">
                          <Image src={a.imageUrl} alt={a.title} fill sizes="112px" className="object-cover" />
                        </div>
                        <p className="mt-1 text-xs text-gallery-text truncate group-hover:underline">
                          {a.title}
                        </p>
                        <p className="text-[11px] text-gallery-muted">
                          ${a.price.toLocaleString()}
                        </p>
                      </Link>
                    ))}
                  </div>
                );
              }
              return null;
            })}
          </div>
        ))}

        {status === "submitted" && (
          <p className="text-xs text-gallery-muted italic">Thinking…</p>
        )}
        {error && (
          <p className="text-xs text-red-600">Something went wrong. Please try again.</p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex border-t border-gallery-border"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about artworks…"
          maxLength={500}
          className="flex-1 px-4 py-3 text-sm bg-transparent text-gallery-text placeholder:text-gallery-muted/60 focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="px-4 text-xs uppercase tracking-widest text-gallery-text disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}
