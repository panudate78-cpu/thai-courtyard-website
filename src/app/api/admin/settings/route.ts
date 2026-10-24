import { z } from "zod";
import { adminGuard } from "@/lib/auth";
import { isPausedUntilActive, isValidDateString, londonNow } from "@/lib/hours";
import { updateSettings } from "@/lib/settings";
import { EMAIL_RE, readJson } from "@/lib/validation";

export const dynamic = "force-dynamic";

const schema = z.object({
  orderingEnabled: z.boolean(),
  pausedMessage: z.string().trim().max(300, "The paused message is too long").nullable(),
  orderingPausedUntil: z
    .string()
    .trim()
    .max(16, "The pause time is invalid")
    .nullable()
    .refine(
      (v) =>
        !v ||
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v),
      "Please choose a valid date and time",
    )
    .refine((v) => !v || isPausedUntilActive(v, londonNow()), "Choose a date and time in the future"),
  leadTimeMinutes: z.number().int().min(0).max(240),
  slotIntervalMinutes: z
    .number()
    .int()
    .refine((v) => [5, 10, 15, 20, 30].includes(v), "Choose a slot interval of 5, 10, 15, 20 or 30 minutes"),
  maxDaysAhead: z.number().int().min(1, "Allow at least 1 day").max(30, "Maximum 30 days ahead"),
  closedDates: z.array(z.string().refine(isValidDateString, "Closed dates must look like 2026-12-25")).max(200),
  notificationEmail: z
    .string()
    .trim()
    .max(200)
    .nullable()
    .refine((v) => !v || EMAIL_RE.test(v), "Please enter a valid notification email address"),
  announcement: z.string().trim().max(200, "The announcement is too long").nullable(),
});

export async function PUT(req: Request) {
  const denied = await adminGuard();
  if (denied) return denied;
  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid settings" }, { status: 400 });
  const data = parsed.data;
  const settings = await updateSettings({
    ...data,
    pausedMessage: data.pausedMessage || null,
    orderingPausedUntil: data.orderingPausedUntil || null,
    notificationEmail: data.notificationEmail || null,
    announcement: data.announcement || null,
    closedDates: [...new Set(data.closedDates)].sort(),
  });
  return Response.json({ settings });
}
