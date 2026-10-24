import { getOverview } from "@/lib/business/analytics";
import type { Overview } from "@/lib/business/types";
import { MetricGrid, OriginBanner, Panel } from "./widgets";

export async function BusinessOverview() {
  let overview: Overview | null = null;
  try {
    overview = await getOverview();
  } catch (error) {
    console.error("[business] overview", error);
  }
  if (!overview) {
    return (
      <Panel title="Performance">
        <p className="text-sm text-black/60">Business metrics could not be loaded. Orders, bookings and messages below are unchanged.</p>
      </Panel>
    );
  }
  return (
    <section aria-labelledby="business-performance" className="space-y-4">
      <div>
        <p className="eyebrow-dark">Business</p>
        <h2 id="business-performance" className="mt-1 font-serif text-2xl font-semibold sm:text-3xl">
          Performance
        </h2>
      </div>
      <OriginBanner origin={overview.origin} warning={overview.warning} note={overview.note} />
      <MetricGrid metrics={overview.metrics} />
    </section>
  );
}
