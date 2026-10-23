/**
 * Site-level configuration. Future sections (tools, shop, blog, community) are declared here
 * and switched on when they exist, so navigation never needs restructuring.
 */
export const SITE = {
  name: "Guitar Dojo",
  tagline: "Learn guitar by playing with it.",
  description:
    "Interactive guitar lessons: explore the fretboard, build chords, and learn music theory by doing, not just reading.",
};

export interface NavItem {
  readonly label: string;
  readonly href: string;
  readonly enabled: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: "Learn", href: "/learn", enabled: true },
  { label: "Tools", href: "/tools", enabled: false },
  { label: "Shop", href: "/shop", enabled: false },
  { label: "Blog", href: "/blog", enabled: false },
];
