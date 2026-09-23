import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { ArrowUp } from "lucide-react";
import type { ChatMessage } from "../hooks/UseWebSocket";
import { card, input, muted } from "../lib/ui";

interface Props {
  isConnected: boolean;
  messages: ChatMessage[];
  sendMessage: (text: string) => void;
}

const RoomChatComponent = ({ isConnected, messages, sendMessage }: Props) => {
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !isConnected) return;
    sendMessage(text);
    setDraft("");
  };

  return (
    <section className={`${card} flex h-96 flex-col`}>
      <h2 className="border-b border-zinc-200 px-4 py-3 font-semibold dark:border-zinc-800">Chat</h2>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <p className={`${muted} text-sm`}>No messages yet.</p>
        )}
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[85%]">
              <p className={`${muted} mb-0.5 text-xs ${message.isOwn ? "text-right" : ""}`}>
                {message.username} ·{" "}
                {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
              <p
                className={`rounded-2xl px-3 py-1.5 text-sm ${
                  message.isOwn
                    ? "bg-orange-500 text-zinc-950"
                    : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                }`}
              >
                {message.text}
              </p>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form onSubmit={submit} className="relative border-t border-zinc-200 p-3 dark:border-zinc-800">
        <input
          className={`${input} pr-11`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={isConnected ? "Message" : "Connecting..."}
          disabled={!isConnected}
        />
        <button
          type="submit"
          disabled={!draft.trim() || !isConnected}
          aria-label="Send"
          className="absolute top-1/2 right-5 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-orange-500 text-zinc-950 transition-colors hover:bg-orange-400 disabled:cursor-default disabled:bg-zinc-200 disabled:text-zinc-400 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
        >
          <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </form>
    </section>
  );
};

export default RoomChatComponent;
