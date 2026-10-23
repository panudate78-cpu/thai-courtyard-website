/**
 * Bundled demo imagery for the white-label platform.
 * A real restaurant replaces these via Business Settings (logo / hero /
 * about / gallery URLs) — components should prefer the restaurant config
 * images and use this manifest only as a neutral fallback.
 */
export type SiteImage = { src: string; width: number; height: number; alt: string; blurDataURL?: string };

const BLUR =
  "data:image/jpeg;base64,/9j/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAAJABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAwQF/8QAJhAAAgECAgsBAAAAAAAAAAAAAQIDAAQREwUSMTI0NWGBg6Gxs//EABQBAQAAAAAAAAAAAAAAAAAAAAP/xAAXEQEAAwAAAAAAAAAAAAAAAAAAAUFR/9oADAMBAAIRAxEAPwDYtSrwTG0SMEbIWXBlbrjSZxghTMxVl3lhAJ1ifVS3nEt4v0FNo3mNx3+0VlnX/9k=";

export const IMG = {
  hero: {
    src: "/images/demo-hero.jpg",
    width: 1800,
    height: 1013,
    alt: "A table spread of freshly prepared dishes, salads and bread",
    blurDataURL: BLUR,
  },
  dish1: {
    src: "/images/demo-dish-1.jpg",
    width: 1500,
    height: 1500,
    alt: "A plated main course with seasonal vegetables",
    blurDataURL: BLUR,
  },
  dish2: {
    src: "/images/demo-dish-2.jpg",
    width: 1500,
    height: 1500,
    alt: "A fresh salad and pasta dish on a rustic table",
    blurDataURL: BLUR,
  },
  interior: {
    src: "/images/demo-interior.jpg",
    width: 1800,
    height: 1200,
    alt: "A warm, welcoming restaurant dining room",
    blurDataURL: BLUR,
  },
  logo: {
    src: "/images/logo.svg",
    width: 160,
    height: 160,
    alt: "Restaurant logo",
  },
} satisfies Record<string, SiteImage>;

export const DEMO_GALLERY: SiteImage[] = [IMG.dish1, IMG.dish2, IMG.interior, IMG.hero];
