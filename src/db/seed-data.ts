import type { DietaryKey } from "@/lib/dietary";

/**
 * Initial menu, imported from the restaurant's existing FoodBooking ordering menu
 * (categories, prices and protein / spice choices). Editable afterwards in /admin/menu.
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

const SPICE: SeedGroup = {
  name: "Spice Level",
  required: true,
  maxSelect: 1,
  choices: [
    ["Mild", 0],
    ["Spicy", 0],
    ["Extra spicy", 0],
  ],
};

const TOPPINGS: SeedGroup = { name: "Additional Toppings", required: false, maxSelect: 1, choices: [["Fried Egg", 100]] };

const PROTEIN: SeedGroup = {
  name: "Choice of Protein",
  required: true,
  maxSelect: 1,
  choices: [
    ["Tofu", 0],
    ["Vegetable", 0],
    ["Chicken", 50],
    ["Pork", 50],
    ["Beef", 150],
    ["Prawn", 250],
    ["Mixed Seafood", 250],
  ],
};

const SOUP_PROTEIN: SeedGroup = {
  ...PROTEIN,
  choices: [
    ["Tofu", 0],
    ["Vegetable", 0],
    ["Chicken", 50],
    ["Prawn", 150],
    ["Mixed Seafood", 300],
  ],
};

export const SEED_MENU: SeedCategory[] = [
  {
    name: "Starters",
    description: "Crisp, fragrant small plates — perfect for sharing.",
    items: [
      { name: "Thai Prawn Crackers", price: 350, description: "Light, airy and deeply savoury crackers made from tapioca flour and ground prawns." },
      { name: "Vegetable Spring Rolls", price: 600, dietary: ["vegetarian"], description: "Shredded stir-fried vegetables wrapped in thin, flaky pastry and fried until golden and crunchy." },
      { name: "Satay Chicken", price: 750, dietary: ["nuts"], description: "Marinated, skewered and grilled chicken served with a savoury, spiced peanut dipping sauce." },
      { name: "Prawn Sesame Rolls", price: 850, description: "Savoury minced prawn coated in sesame seeds and fried until golden and crunchy." },
      { name: "Salt & Pepper Tofu", price: 650, dietary: ["vegetarian"], description: "Crispy tofu tossed with an aromatic blend of salt and white pepper." },
      { name: "Szechuan Peppercorn Squid", price: 800, dietary: ["spicy"], description: "Tender squid, lightly battered and fried, seasoned with ground Szechuan peppercorns and salt." },
      { name: "Pepper Wings", price: 750, dietary: ["spicy"], description: "Crispy fried chicken wings tossed with fried garlic and chillies." },
      { name: "Thai Fishcake", price: 850, dietary: ["nuts"], description: "Traditional Thai fishcakes served with sweet chilli sauce and ground nuts." },
      { name: "Red Wine Wings", price: 750, description: "Marinated chicken wings with a red wine glaze, topped with sesame seeds." },
      { name: "Red Wine Ribs", price: 850, description: "Marinated pork ribs with a red wine glaze, topped with sesame seeds." },
      { name: "Szechuan Ribs", price: 850, dietary: ["spicy"], description: "Fried pork ribs tossed with Szechuan seasoning, garlic and chilli." },
      { name: "Mussels", price: 800, description: "Steamed mussels in a mild curry sauce with lemongrass and basil leaf." },
      { name: "Pork Dumplings", price: 750, description: "Pan-fried pork dumplings with a ginger and Chinese vinegar dip." },
    ],
  },
  {
    name: "Soups",
    description: "Aromatic Thai broths — choose your protein and spice level.",
    groups: [SOUP_PROTEIN, SPICE],
    items: [
      { name: "Tom Yum", price: 850, dietary: ["veg_option", "spicy", "popular"], description: "The classic hot and sour soup, fragrant with lemongrass, galangal, kaffir lime leaves, chilli and lime juice." },
      { name: "Tom Kha", price: 850, dietary: ["veg_option"], description: "Creamy coconut milk soup infused with citrusy galangal, fragrant lemongrass and kaffir lime leaves." },
    ],
  },
  {
    name: "Curries",
    description: "Fragrant coconut curries — choose your protein and spice level. Pair with jasmine or coconut rice from our sides.",
    groups: [PROTEIN, SPICE],
    items: [
      { name: "Red Curry", price: 1150, dietary: ["veg_option", "spicy"], description: "Kaeng phet — a rich, aromatic red curry simmered with coconut milk." },
      { name: "Green Curry", price: 1150, dietary: ["veg_option", "spicy", "popular"], featured: true, description: "Kaeng khiao wan — a fragrant Central Thai curry whose vibrant colour comes from fresh green chillies." },
      { name: "Phanaeng", price: 1150, dietary: ["veg_option", "nuts"], featured: true, description: "A rich, thick and creamy red curry — mild to medium, with a sweet and nutty flavour, just like in Thailand." },
    ],
  },
  {
    name: "Stir Fried",
    description: "Wok-fried over high heat with fresh vegetables — choose your protein and spice level.",
    groups: [PROTEIN, SPICE, TOPPINGS],
    items: [
      { name: "Sweet & Sour", price: 1200, dietary: ["veg_option"], description: "Colourful, tangy and slightly sweet with pineapple, carrot, onion and red peppers." },
      { name: "Cashew Nut", price: 1200, dietary: ["veg_option", "nuts"], description: "Stir-fried with roasted chilli paste, cashew nuts, carrot, mushroom, onion and red peppers." },
      { name: "Pad Khing", price: 1200, dietary: ["veg_option"], description: "An aromatic stir-fry with plenty of shredded fresh ginger, mushrooms, carrots and spring onions." },
      { name: "Pad Grapow", price: 1200, dietary: ["veg_option", "spicy", "popular"], description: "A beloved Thai staple stir-fried with holy basil, garlic and bird's eye chillies." },
      { name: "Pad Kratiem Prik Thai", price: 1200, dietary: ["veg_option"], description: "Wok-fried with plenty of chopped garlic and aromatic white pepper in a savoury, slightly sweet sauce." },
      { name: "Pad Pak", price: 1100, dietary: ["veg_option"], description: "Crisp seasonal vegetables — pak choi, carrots, mushrooms, asparagus, tofu and baby corn — wok-fried with garlic, soy and oyster sauce." },
    ],
  },
  {
    name: "Salads",
    description: "Bright, zesty Thai salads balancing spicy, sour, salty and sweet.",
    items: [
      {
        name: "Yum Yum",
        price: 950,
        dietary: ["veg_option", "spicy"],
        description: "A vibrant, refreshing mixed salad with a signature dressing of lime juice, fish sauce, chilli and sugar.",
        groups: [
          {
            name: "Choice of Protein",
            required: true,
            maxSelect: 1,
            choices: [
              ["Tofu", 0],
              ["Vegetable", 0],
              ["Chicken", 200],
              ["Beef", 400],
              ["Prawn", 500],
              ["Mixed Seafood", 500],
            ],
          },
          SPICE,
        ],
      },
      {
        name: "Larb",
        price: 1000,
        dietary: ["veg_option", "spicy"],
        description: "A refreshing Isaan-style minced salad with lime juice, fish sauce, chilli flakes and toasted rice powder, loaded with mint and coriander.",
        groups: [
          {
            name: "Choice of Protein",
            required: true,
            maxSelect: 1,
            choices: [
              ["Tofu", 0],
              ["Vegetable", 0],
              ["Minced Chicken", 350],
              ["Minced Pork", 350],
            ],
          },
          SPICE,
        ],
      },
    ],
  },
  {
    name: "Recommended Dishes",
    description: "Our chef's signature plates.",
    items: [
      { name: "Lemon Grass Chicken", price: 1800, dietary: ["popular"], featured: true, description: "Chicken marinated in finely minced lemongrass, garlic, ginger, fish sauce and lime juice." },
      { name: "Tamarind Duck", price: 1850, dietary: ["popular"], featured: true, description: "Tender roasted duck with a savoury, sweet and tangy tamarind sauce." },
      { name: "Steamed Seabass", price: 2000, dietary: ["spicy", "popular"], featured: true, description: "Pla neung manao — sea bass gently steamed and finished with a bold sauce of fresh lime, garlic, chilli, fish sauce and coriander." },
    ],
  },
  {
    name: "Noodles / Rice",
    description: "Classic Thai noodle and rice dishes, wok-tossed to order.",
    groups: [PROTEIN, SPICE, TOPPINGS],
    items: [
      { name: "Pad Thai", price: 1200, dietary: ["veg_option", "nuts", "popular"], featured: true, description: "Thailand's famous stir-fried rice noodles with a sweet, sour and savoury flavour." },
      { name: "Pad Si-Ew", price: 1200, dietary: ["veg_option"], description: "Flat rice noodles stir-fried with soy sauce — sweet, savoury and smoky." },
      { name: "Pad Kee Mao", price: 1200, dietary: ["veg_option", "spicy"], description: "Drunken noodles — wide rice noodles wok-fried with garlic, chilli and holy basil." },
      { name: "Pad Mee", price: 1200, dietary: ["veg_option"], description: "Stir-fried noodles tossed with soy sauce, garlic and egg." },
      { name: "Fried Rice", price: 1200, dietary: ["veg_option"], description: "Khao pad — jasmine rice stir-fried over high heat with soy, fish and oyster sauces, garlic and egg." },
    ],
  },
  {
    name: "Sides",
    description: "Rice, noodles, roti and sauces to complete your meal.",
    items: [
      { name: "Steamed Jasmine Rice", price: 250, dietary: ["vegan", "gluten_free"] },
      { name: "Egg Fried Rice", price: 295, dietary: ["vegetarian"] },
      { name: "Coconut Rice", price: 350, dietary: ["vegan", "gluten_free"] },
      { name: "Egg Noodles", price: 300, dietary: ["vegetarian"] },
      { name: "Curry Sauce", price: 200 },
      { name: "Sweet & Sour Sauce", price: 200, dietary: ["vegetarian"] },
      { name: "Roti", price: 250, dietary: ["vegetarian"] },
      { name: "Fried Egg", price: 100, dietary: ["vegetarian", "gluten_free"] },
      { name: "Chilli Sauce", price: 100, dietary: ["vegetarian", "spicy"] },
    ],
  },
  {
    name: "Drinks",
    description: "Chilled soft drinks and water.",
    items: [
      { name: "Coke 330ml", price: 250 },
      { name: "Diet Coke 330ml", price: 250 },
      { name: "Fanta Orange 330ml", price: 250 },
      { name: "Sprite 330ml", price: 250 },
      { name: "Lipton Lemon Ice Tea 330ml", price: 250 },
      { name: "R Whites Lemonade 330ml", price: 250 },
      { name: "Still Water 500ml", price: 250 },
      { name: "Sparkling Water 500ml", price: 250 },
    ],
  },
];
