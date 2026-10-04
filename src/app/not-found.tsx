import Image from "next/image";
import Link from "next/link";
import { IMG } from "@/lib/image-manifest";
import { SITE } from "@/lib/site";

export default function NotFound() {
  return (
    <main className="thai-pattern grid min-h-svh place-items-center bg-charcoal px-6 py-16 text-center text-cream">
      <div>
        <Image src={IMG.logo.src} alt="Thai Courtyard" width={150} height={143} className="mx-auto h-36 w-auto" />
        <h1 className="mt-8 font-serif text-5xl font-semibold">Page not found</h1>
        <p className="mx-auto mt-3 max-w-md text-cream/70">
          Sorry, we couldn&apos;t find that page. It may have moved — try the menu, or order for collection.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn-gold">
            Back to home
          </Link>
          <Link href="/menu" className="btn btn-outline-light">
            View menu
          </Link>
          <a href={SITE.phoneHref} className="btn btn-outline-light">
            Call {SITE.phoneDisplay}
          </a>
        </div>
      </div>
    </main>
  );
}
