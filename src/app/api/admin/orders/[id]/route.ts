import { after } from "next/server";
import { z } from "zod";
import { adminGuard } from "@/lib/auth";
import { sendOrderReadyEmail, updateOrderStatus } from "@/lib/orders";
import { ORDER_STATUSES } from "@/lib/types";
import { readJson } from "@/lib/validation";

export const dynamic = "force-dynamic";

const schema = z.object({ status: z.enum(ORDER_STATUSES) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard();
  if (denied) return denied;
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId) || orderId <= 0) return Response.json({ error: "Invalid order" }, { status: 400 });
  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success) return Response.json({ error: "Invalid status" }, { status: 400 });

  const order = await updateOrderStatus(orderId, parsed.data.status);
  if (!order) return Response.json({ error: "Order not found" }, { status: 404 });
  if (parsed.data.status === "ready" && order.email) {
    after(async () => {
      try {
        await sendOrderReadyEmail(order);
      } catch (error) {
        console.error("[orders] ready email failed", error);
      }
    });
  }
  return Response.json({ order });
}
