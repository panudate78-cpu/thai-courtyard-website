"use client";

import { useState, type FormEvent } from "react";
import { Loader2, MailCheck, Send } from "lucide-react";

const EMPTY = { name: "", email: "", phone: "", message: "", company: "" };

export function ContactForm() {
  const [form, setForm] = useState(EMPTY);
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const update = (patch: Partial<typeof EMPTY>) => setForm((f) => ({ ...f, ...patch }));

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setState("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Sorry, your message could not be sent. Please call us.");
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div role="status" className="mt-6 rounded-2xl bg-jade/10 p-6 text-center">
        <MailCheck className="mx-auto h-10 w-10 text-jade" aria-hidden="true" />
        <p className="mt-3 font-serif text-2xl font-semibold">Thank you, {form.name.split(" ")[0]}!</p>
        <p className="mt-1 text-sm text-charcoal/70">Your message has been sent. We&apos;ll get back to you soon.</p>
        <button
          type="button"
          onClick={() => {
            setForm(EMPTY);
            setState("idle");
          }}
          className="btn btn-outline mt-5"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="label">
            Name *
          </label>
          <input
            id="contact-name"
            required
            autoComplete="name"
            maxLength={80}
            value={form.name}
            onChange={(e) => update({ name: e.target.value })}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="contact-phone" className="label">
            Telephone <span className="font-normal text-charcoal/50">(optional)</span>
          </label>
          <input
            id="contact-phone"
            type="tel"
            autoComplete="tel"
            maxLength={25}
            value={form.phone}
            onChange={(e) => update({ phone: e.target.value })}
            className="input"
          />
        </div>
      </div>
      <div>
        <label htmlFor="contact-email" className="label">
          Email *
        </label>
        <input
          id="contact-email"
          type="email"
          required
          autoComplete="email"
          maxLength={200}
          value={form.email}
          onChange={(e) => update({ email: e.target.value })}
          className="input"
        />
      </div>
      <div>
        <label htmlFor="contact-message" className="label">
          Message *
        </label>
        <textarea
          id="contact-message"
          required
          rows={5}
          minLength={10}
          maxLength={2000}
          value={form.message}
          onChange={(e) => update({ message: e.target.value })}
          className="input resize-y"
        />
      </div>
      <div className="hidden" aria-hidden="true">
        <label htmlFor="contact-company">Company</label>
        <input id="contact-company" tabIndex={-1} autoComplete="off" value={form.company} onChange={(e) => update({ company: e.target.value })} />
      </div>
      {error ? (
        <p role="alert" className="rounded-xl bg-chili/10 p-3 text-sm font-medium text-chili">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={state === "sending"} className="btn btn-dark w-full py-3.5">
        {state === "sending" ? (
          <>
            <Loader2 className="animate-spin" aria-hidden="true" /> Sending…
          </>
        ) : (
          <>
            <Send aria-hidden="true" /> Send message
          </>
        )}
      </button>
    </form>
  );
}
