import { getOverview } from "@/lib/business/analytics";
import type { Overview } from "@/lib/business/types";
import { MetricGrid, OriginBanner, Panel } from "./widgets";

/**
 * Analytics content for the dashboard's business area. Rendered below the
 * operational sections — the page supplies the "Business dashboard" heading.
 */
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
        <p className="text-sm text-black/60">
          Business metrics could not be loaded. Operational tools above are unaffected.
        </p>
      </Panel>
    );
  }
  return (
    <div className="space-y-4">
      <OriginBanner origin={overview.origin} warning={overview.warning} note={overview.note} />
      <MetricGrid metrics={overview.metrics} />
    </div>
  );
}
