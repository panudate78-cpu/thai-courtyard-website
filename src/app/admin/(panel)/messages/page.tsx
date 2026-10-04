import type { Metadata } from "next";
import { MessagesList } from "@/components/admin/MessagesList";
import { listMessages } from "@/lib/admin-data";

export const metadata: Metadata = { title: "Messages" };

export default async function AdminMessagesPage() {
  const messages = await listMessages();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">Messages</h1>
        <p className="text-sm text-black/55">Enquiries sent through the website contact form.</p>
      </header>
      <MessagesList initialMessages={messages} />
    </div>
  );
}
