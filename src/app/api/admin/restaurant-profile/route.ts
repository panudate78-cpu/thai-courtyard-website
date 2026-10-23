import { adminGuard } from "@/lib/auth";
import { getRestaurantProfile, restaurantProfileSchema, saveRestaurantProfile } from "@/lib/restaurant";
import { firstError, readJson } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await adminGuard();
  if (denied) return denied;
  const profile = await getRestaurantProfile();
  return Response.json({ profile });
}

export async function PUT(req: Request) {
  const denied = await adminGuard();
  if (denied) return denied;
  const parsed = restaurantProfileSchema.safeParse(await readJson(req));
  if (!parsed.success) return Response.json({ error: firstError(parsed.error) }, { status: 400 });
  try {
    const profile = await saveRestaurantProfile(parsed.data);
    return Response.json({ profile });
  } catch (error) {
    console.error("[restaurant-profile] save failed", error);
    return Response.json({ error: "Could not save business settings" }, { status: 500 });
  }
}
