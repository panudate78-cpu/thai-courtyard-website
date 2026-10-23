"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Inbox, Mail, MailOpen, Phone, Trash2 } from "lucide-react";
import { formatDateLong, londonDateTime } from "@/lib/hours";
import type { MessageView } from "@/lib/types";
import { Notice, useNotice } from "./AdminUI";

export function MessagesList({ initialMessages }: { initialMessages: MessageView[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initialMessages);
  const [notice, setNotice] = useNotice();

  async function call(id: number, init: RequestInit) {
    const res = await fetch(`/api/admin/messages/${id}`, init);
    if (res.status === 401) {
      window.location.assign("/admin/login");
      return false;
    }
    if (!res.ok) {
      setNotice({ type: "error", text: "Could not update the message" });
      return false;
    }
    router.refresh();
    return true;
  }

  async function setRead(message: MessageView, read: boolean) {
    const ok = await call(message.id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read }),
    });
    if (ok) setRows((prev) => prev.map((m) => (m.id === message.id ? { ...m, read } : m)));
  }

  async function remove(message: MessageView) {
    if (!window.confirm(`Delete the message from ${message.name}?`)) return;
    if (await call(message.id, { method: "DELETE" })) {
      setRows((prev) => prev.filter((m) => m.id !== message.id));
      setNotice({ type: "ok", text: "Message deleted" });
    }
  }

  if (rows.length === 0) {
    return (
      <div className="adm-card flex flex-col items-center p-10 text-center text-black/50">
        <Inbox className="h-10 w-10" aria-hidden="true" />
        <p className="mt-3 font-medium">No messages yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((m) => {
        const sent = londonDateTime(m.createdAt);
        return (
          <article key={m.id} className={`adm-card p-5 ${m.read ? "" : "ring-2 ring-gold/60"}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 font-semibold">
                  {m.name}
                  {!m.read ? <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-charcoal uppercase">New</span> : null}
                </p>
                <p className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-black/60">
                  <a href={`mailto:${m.email}?subject=${encodeURIComponent("Re: your message to your website")}`} className="inline-flex items-center gap-1 break-all hover:underline">
                    <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                    {m.email}
                  </a>
                  {m.phone ? (
                    <a href={`tel:${m.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1 hover:underline">
                      <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                      {m.phone}
                    </a>
                  ) : null}
                </p>
              </div>
              <p className="text-xs text-black/45">
                {formatDateLong(sent.date)} · {sent.time}
              </p>
            </div>
            <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">{m.message}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={`mailto:${m.email}?subject=${encodeURIComponent("Re: your message to your website")}`} className="adm-btn-primary">
                <Mail aria-hidden="true" /> Reply
              </a>
              <button type="button" className="adm-btn" onClick={() => setRead(m, !m.read)}>
                {m.read ? <Mail aria-hidden="true" /> : <MailOpen aria-hidden="true" />}
                {m.read ? "Mark unread" : "Mark read"}
              </button>
              <button type="button" className="adm-btn-danger" onClick={() => remove(m)} aria-label={`Delete message from ${m.name}`}>
                <Trash2 aria-hidden="true" />
              </button>
            </div>
          </article>
        );
      })}
      <Notice notice={notice} onClose={() => setNotice(null)} />
    </div>
  );
}
