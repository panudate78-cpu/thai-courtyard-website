/**
 * LaunchpadCredit — the standard Launchpad Studio footer credit.
 *
 * Renders: "Website designed, hosted and maintained by Launchpad Studio"
 * with "Launchpad Studio" linking to https://launchpadstudio.uk in a new tab.
 *
 * ── Reusing this on future client websites ──────────────────────────────────
 * This file is deliberately self-contained: no project imports, no site
 * config, no dependencies beyond React + Tailwind CSS. To use it on another
 * Launchpad Studio website, copy this single file into that project (e.g.
 * `src/components/LaunchpadCredit.tsx`) and drop it into the site footer:
 *
 *   import { LaunchpadCredit } from "@/components/LaunchpadCredit";
 *
 *   // Dark footer (self-contained muted white text):
 *   <LaunchpadCredit variant="dark" />
 *
 *   // Light footer (self-contained muted black text):
 *   <LaunchpadCredit variant="light" />
 *
 *   // Themed footer (default): sets no colours of its own and inherits the
 *   // footer's typography and text colour, so it always matches the site.
 *   // Refine it with the site's own palette via the class props, e.g.:
 *   <LaunchpadCredit
 *     className="text-cream/50"
 *     linkClassName="text-cream/70 decoration-cream/25 hover:text-gold-light hover:decoration-gold-light/70"
 *   />
 *
 * Layout/spacing (margins, alignment) is the caller's job — either wrap it
 * or pass utility classes such as `className="mt-4 text-center"`.
 *
 * ── Accessibility notes ──────────────────────────────────────────────────────
 * - The link is underlined so it is identifiable by more than colour alone.
 * - It opens in a new tab (`target="_blank"` + `rel="noopener noreferrer"`)
 *   and says so to screen-reader users via visually-hidden text.
 * - It has a visible keyboard-focus outline.
 * - Keep the muted text colour at ≥ 4.5:1 contrast against the footer
 *   background. The built-in `dark`/`light` variants assume a near-black /
 *   near-white footer; with `inherit`, check the colour you pass in.
 */

export const LAUNCHPAD_STUDIO = {
  name: "Launchpad Studio",
  url: "https://launchpadstudio.uk",
} as const;

export type LaunchpadCreditVariant = "inherit" | "dark" | "light";

export interface LaunchpadCreditProps {
  /**
   * - `inherit` (default) — no colours of its own; takes the footer's
   *   typography and text colour. Theme it with `className`/`linkClassName`.
   * - `dark` — muted white text for dark footers.
   * - `light` — muted black text for light footers.
   */
  variant?: LaunchpadCreditVariant;
  /** Extra classes for the credit line (spacing, alignment, themed colour). */
  className?: string;
  /** Extra classes for the Launchpad Studio link (themed colour/hover). */
  linkClassName?: string;
}

const TEXT_VARIANTS: Record<LaunchpadCreditVariant, string> = {
  inherit: "",
  dark: "text-white/55",
  light: "text-black/55",
};

const LINK_VARIANTS: Record<LaunchpadCreditVariant, string> = {
  // Colour comes from the surrounding footer; the thickening underline still
  // gives clear hover feedback if no themed hover colour is passed in.
  inherit: "hover:decoration-2",
  dark: "text-white/75 decoration-white/30 hover:text-white hover:decoration-white/70",
  light: "text-black/75 decoration-black/30 hover:text-black hover:decoration-black/70",
};

function joinClasses(...classes: Array<string | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function LaunchpadCredit({ variant = "inherit", className, linkClassName }: LaunchpadCreditProps) {
  return (
    <p className={joinClasses("text-xs leading-relaxed", TEXT_VARIANTS[variant], className)}>
      Website designed, hosted and maintained by{" "}
      <a
        href={LAUNCHPAD_STUDIO.url}
        target="_blank"
        rel="noopener noreferrer"
        className={joinClasses(
          "rounded-sm font-medium whitespace-nowrap underline underline-offset-4 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2",
          LINK_VARIANTS[variant],
          linkClassName,
        )}
      >
        {LAUNCHPAD_STUDIO.name}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    </p>
  );
}
