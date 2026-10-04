import { after } from "next/server";
import { z } from "zod";
import { createOrder, OrderError, sendOrderNotifications } from "@/lib/orders";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { firstError, nameSchema, optionalEmailSchema, phoneSchema, readJson } from "@/lib/validation";

export const dynamic = "force-dynamic";

const orderSchema = z.object({
  items: z
    .array(
      z.object({
        itemId: z.number().int().positive(),
        quantity: z.number().int().min(1, "Invalid quantity").max(50, "Maximum 50 of any one dish"),
        choiceIds: z.array(z.number().int().positive()).max(20),
      }),
    )
    .min(1, "Your basket is empty")
    .max(60, "That's a big order! Please call us to place it."),
  collectionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Please choose a collection day"),
  collectionTime: z.string().regex(/^\d{2}:\d{2}$/, "Please choose a collection time"),
  name: nameSchema,
  phone: phoneSchema,
  email: optionalEmailSchema,
  instructions: z
    .string()
    .trim()
    .max(600, "Special instructions are too long")
    .optional()
    .transform((v) => (v ? v : null)),
  company: z.string().optional(),
});

export async function POST(req: Request) {
  if (!rateLimit(`order:${clientIp(req)}`, 10, 10 * 60_000)) {
    return Response.json(
      { error: "Too many orders in a short time. Please call us to complete your order." },
      { status: 429 },
    );
  }
  const parsed = orderSchema.safeParse(await readJson(req));
  if (!parsed.success) return Response.json({ error: firstError(parsed.error) }, { status: 400 });
  const { company, ...input } = parsed.data;
  if (company) return Response.json({ error: "Unable to process this order." }, { status: 400 });

  try {
    const { order, settings } = await createOrder(input);
    after(async () => {
      try {
        await sendOrderNotifications(order, settings);
      } catch (error) {
        console.error("[orders] notification failed", error);
      }
    });
    return Response.json({ publicId: order.publicId, orderNumber: order.number }, { status: 201 });
  } catch (error) {
    if (error instanceof OrderError) return Response.json({ error: error.message }, { status: error.status });
    console.error("[orders] failed to create order", error);
    return Response.json(
      { error: "Sorry, something went wrong placing your order. Please try again or call us." },
      { status: 500 },
    );
  }
}
