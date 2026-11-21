import type { AllergenKey } from "./allergens";
import type { DietaryKey } from "./dietary";

export type MenuChoice = { id: number; name: string; pricePence: number; available: boolean };

export type MenuGroup = {
  id: number;
  categoryId: number | null;
  itemId: number | null;
  name: string;
  required: boolean;
  maxSelect: number;
  sortOrder: number;
  choices: MenuChoice[];
};

export type MenuItem = {
  id: number;
  categoryId: number;
  name: string;
  description: string | null;
  pricePence: number;
  dietary: DietaryKey[];
  allergens: AllergenKey[];
  available: boolean;
  visible: boolean;
  featured: boolean;
  sortOrder: number;
  /** Groups attached directly to this dish. */
  ownGroups: MenuGroup[];
  /** Effective groups shown to customers (dish groups + category groups). */
  groups: MenuGroup[];
};

export type MenuCategory = {
  id: number;
  name: string;
  description: string | null;
  sortOrder: number;
  visible: boolean;
  groups: MenuGroup[];
  items: MenuItem[];
};

export type Settings = {
  orderingEnabled: boolean;
  pausedMessage: string | null;
  leadTimeMinutes: number;
  slotIntervalMinutes: number;
  maxDaysAhead: number;
  closedDates: string[];
  notificationEmail: string | null;
  announcement: string | null;
};

export const ORDER_STATUSES = ["new", "accepted", "ready", "collected", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type OrderOption = { group: string; choice: string; pricePence: number };

export type OrderLineView = {
  id: number;
  name: string;
  quantity: number;
  unitPricePence: number;
  lineTotalPence: number;
  options: OrderOption[];
};

export type PaymentMethod = "pay_on_collection" | "stripe_online";
export type PaymentStatus = "unpaid" | "paid";

export type OrderView = {
  id: number;
  number: number;
  publicId: string;
  customerName: string;
  phone: string;
  email: string | null;
  instructions: string | null;
  collectionDate: string;
  collectionTime: string;
  subtotalPence: number;
  itemCount: number;
  status: OrderStatus;
  emailStatus: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  stripeSessionId: string | null;
  paidAt: string | null;
  createdAt: string;
  items: OrderLineView[];

  customerStatus?: string;
};


export const BOOKING_STATUSES = ["pending", "confirmed", "declined", "cancelled"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export type BookingView = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  partySize: number;
  date: string;
  time: string;
  notes: string | null;
  status: BookingStatus;
  createdAt: string;
};

export type MessageView = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  read: boolean;
  createdAt: string;
};
