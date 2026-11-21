import { redirect } from "next/navigation";
import { getRestaurantConfig } from "@/lib/restaurant";
import { SetupWizard } from "@/components/setup/SetupWizard";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ token?: string }>;
};

function hasValidSetupToken(searchToken: string | undefined): boolean {
  const envToken = process.env.SETUP_TOKEN;
  if (!envToken) return true; // no token configured — allow (dev / first run)
  if (!searchToken) return false;
  return searchToken === envToken;
}

export default async function SetupPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const cfg = await getRestaurantConfig().catch(() => null);

  // If setup already completed and no valid token, lock the wizard
  if (cfg?.setupCompleted) {
    if (!hasValidSetupToken(token)) {
      // Show locked message instead of redirecting so operator knows how to re-open
      return (
        <div className="container-x py-16 text-center">
          <h1 className="font-serif text-3xl font-semibold">Setup is locked</h1>
          <p className="mx-auto mt-3 max-w-xl text-charcoal/70">
            This restaurant has already completed setup. Re-open it from <span className="font-semibold">/admin → Settings → Re-open Setup Wizard</span> (admin login required)
            {process.env.SETUP_TOKEN ? (
              <>
                {" "}
                or visit <code className="rounded bg-black/5 px-1">/setup?token=SETUP_TOKEN</code>.
              </>
            ) : null}
          </p>
          <a href="/admin" className="btn btn-dark mt-6">
            Go to Admin
          </a>
        </div>
      );
    }
  } else {
    // Setup not completed — if SETUP_TOKEN is set, require it
    if (process.env.SETUP_TOKEN && !hasValidSetupToken(token)) {
      return (
        <div className="container-x py-16 text-center">
          <h1 className="font-serif text-3xl font-semibold">Setup is protected</h1>
          <p className="mx-auto mt-3 max-w-xl text-charcoal/70">
            This wizard is protected by <code>SETUP_TOKEN</code>. Open it with <code className="rounded bg-black/5 px-1">/setup?token=YOUR_TOKEN</code>.
          </p>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="border-b border-sand bg-white">
        <div className="container-x flex items-center justify-between py-4">
          <span className="font-serif text-xl font-semibold">New Restaurant Setup</span>
          <span className="text-xs text-charcoal/60">Step-by-step — under 60 min to go live</span>
        </div>
      </div>
      <SetupWizard initialConfig={cfg} token={token} />
    </div>
  );
}
