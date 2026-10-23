import type { DietaryKey } from "@/lib/dietary";

/**
 * Bundled *demo* menu for the white-label platform.
 *
 * This is deliberately brand-neutral sample content used for the demo
 * restaurant, the Setup Wizard's "start from the demo menu" option, and
 * Admin → Settings → Reset Demo Data. A real restaurant replaces it via
 * Admin → Menu or Menu Import (CSV / Excel / PDF) — no code change needed.
 */
export type SeedGroup = { name: string; required: boolean; maxSelect: number; choices: Array<[string, number]> };
export type SeedItem = {
  name: string;
  description?: string;
  price: number;
  dietary?: DietaryKey[];
  featured?: boolean;
  groups?: SeedGroup[];
};
export type SeedCategory = { name: string; description?: string; groups?: SeedGroup[]; items: SeedItem[] };

const SAUCE: SeedGroup = {
  name: "Choice of Sauce",
  required: false,
  maxSelect: 1,
  choices: [
    ["House dressing", 0],
    ["Garlic mayo", 0],
    ["Chilli jam", 50],
  ],
};

const SIDE_UPGRADE: SeedGroup = {
  name: "Add a Side",
  required: false,
  maxSelect: 1,
  choices: [
    ["Skin-on fries", 350],
    ["Seasonal greens", 350],
    ["House salad", 300],
  ],
};

export const SEED_MENU: SeedCategory[] = [
  {
    name: "Starters",
    description: "Small plates to start — great for sharing.",
    items: [
      { name: "Soup of the Day", price: 650, dietary: ["vegetarian"], description: "Chef's daily soup served with warm bread. Ask your server for today's choice." },
      { name: "Crispy Halloumi", price: 750, dietary: ["vegetarian", "popular"], featured: true, description: "Golden fried halloumi with chilli jam and dressed leaves.", groups: [SAUCE] },
      { name: "Chicken Wings", price: 800, description: "Glazed chicken wings with sesame and spring onion." },
      { name: "Garlic Bread", price: 450, dietary: ["vegetarian"], description: "Wood-fired garlic butter flatbread." },
      { name: "Prawn Cocktail", price: 850, description: "Classic prawn cocktail with Marie Rose sauce and baby gem lettuce." },
    ],
  },
  {
    name: "Mains",
    description: "Freshly prepared main courses, cooked to order.",
    items: [
      { name: "Grilled Chicken", price: 1650, dietary: ["gluten_free", "popular"], featured: true, description: "Chargrilled chicken breast with seasonal vegetables and herb sauce.", groups: [SIDE_UPGRADE] },
      { name: "House Burger", price: 1550, description: "Beef burger with cheddar, house sauce and skin-on fries." },
      { name: "Fish & Chips", price: 1600, description: "Beer-battered fish with chunky chips, peas and tartare sauce." },
      { name: "Garden Risotto", price: 1450, dietary: ["vegetarian", "gluten_free"], featured: true, description: "Creamy risotto with seasonal garden vegetables and parmesan." },
      { name: "Steak Frites", price: 2150, description: "Grilled steak with fries and peppercorn sauce.", groups: [SIDE_UPGRADE] },
    ],
  },
  {
    name: "Grill",
    description: "From the grill — choose your sauce.",
    groups: [SAUCE],
    items: [
      { name: "Mixed Grill", price: 2400, featured: true, description: "A generous sharing grill with chicken, sausage and steak." },
      { name: "Lamb Chops", price: 2200, description: "Grilled lamb chops with rosemary and garlic." },
      { name: "Grilled Salmon", price: 1950, dietary: ["gluten_free"], description: "Salmon fillet with lemon butter and seasonal greens." },
    ],
  },
  {
    name: "Sides",
    description: "The perfect extras.",
    items: [
      { name: "Skin-on Fries", price: 400, dietary: ["vegan"] },
      { name: "House Salad", price: 450, dietary: ["vegan", "gluten_free"] },
      { name: "Seasonal Greens", price: 450, dietary: ["vegan"] },
      { name: "Onion Rings", price: 450, dietary: ["vegetarian"] },
    ],
  },
  {
    name: "Desserts",
    description: "Save room for something sweet.",
    items: [
      { name: "Sticky Toffee Pudding", price: 750, dietary: ["vegetarian", "popular"], featured: true, description: "Warm date sponge with toffee sauce and vanilla ice cream." },
      { name: "Chocolate Brownie", price: 700, dietary: ["vegetarian"], description: "Rich chocolate brownie with salted caramel ice cream." },
      { name: "Seasonal Fruit Crumble", price: 700, dietary: ["vegetarian"], description: "Baked fruit crumble with custard." },
      { name: "Ice Cream Selection", price: 600, dietary: ["vegetarian"], description: "Three scoops — ask for today's flavours." },
    ],
  },
  {
    name: "Drinks",
    description: "Chilled soft drinks and water.",
    items: [
      { name: "Coke 330ml", price: 250 },
      { name: "Diet Coke 330ml", price: 250 },
      { name: "Lemonade 330ml", price: 250 },
      { name: "Orange Juice", price: 300 },
      { name: "Still Water 500ml", price: 200 },
      { name: "Sparkling Water 500ml", price: 200 },
    ],
  },
];

/** Demo-menu alias used by the setup wizard / demo reset. */
export const DEMO_MENU = SEED_MENU;
