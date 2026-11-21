import type { Metadata } from "next";
import AccountingClient from "./AccountingClient";

export const metadata: Metadata = { title: "Accounting Exports" };
export const dynamic = "force-dynamic";

export default function AccountingPage() {
  return <AccountingClient />;
}
