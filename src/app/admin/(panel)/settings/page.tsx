import type { Metadata } from "next";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { emailProvider } from "@/lib/email";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const settings = await getSettings();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="text-sm text-black/55">Online ordering, collection times, notifications and the website banner.</p>
      </header>
      <SettingsForm
        initial={settings}
        provider={emailProvider()}
        envRecipient={process.env.RESTAURANT_EMAIL || process.env.ORDER_NOTIFICATION_EMAIL || null}
      />
    </div>
  );
}
