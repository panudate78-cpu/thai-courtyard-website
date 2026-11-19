"use client";

import { useState } from "react";
import { Mail, Check, Loader2 } from "lucide-react";

export function NewsletterSignup({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim(), marketingConsent: "yes" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not sign up");
      setStatus("ok");
      setMsg("You're in! Watch your inbox for exclusive offers.");
      setEmail("");
      setName("");
    } catch (err) {
      setStatus("error");
      setMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (status === "ok") {
    return (
      <div className={`flex items-center gap-3 rounded-2xl bg-jade/10 p-4 text-jade ring-1 ring-jade/20 ${compact ? "text-sm" : ""}`}>
        <Check className="h-5 w-5 shrink-0" aria-hidden="true" />
        <p className="font-medium">{msg}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={`flex flex-col gap-3 ${compact ? "sm:flex-row" : "sm:flex-row"}`}>
      {!compact ? (
        <label className="sr-only" htmlFor="newsletter-name">
          Name
        </label>
      ) : null}
      <input
        id={compact ? undefined : "newsletter-name"}
        type="text"
        placeholder="Your name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="input flex-1"
        disabled={status === "loading"}
      />
      <label className="sr-only" htmlFor="newsletter-email">
        Email
      </label>
      <input
        id={compact ? undefined : "newsletter-email"}
        type="email"
        required
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="input flex-1"
        disabled={status === "loading"}
      />
      <button type="submit" disabled={status === "loading"} className="btn btn-gold shrink-0">
        {status === "loading" ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Mail aria-hidden="true" />}
        Join VIP
      </button>
      {status === "error" ? <p className="text-sm text-chili sm:col-span-2">{msg}</p> : null}
    </form>
  );
}
