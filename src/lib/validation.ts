import { z } from "zod";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return /^[+()\d\s.-]+$/.test(value) && digits.length >= 10 && digits.length <= 15;
}

export const nameSchema = z.string().trim().min(2, "Please enter your name").max(80, "Name is too long");

export const phoneSchema = z
  .string()
  .trim()
  .min(1, "Please enter your telephone number")
  .max(25, "Please enter a valid telephone number")
  .refine(isValidPhone, "Please enter a valid telephone number");

export const optionalPhoneSchema = z
  .string()
  .trim()
  .max(25, "Please enter a valid telephone number")
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || isValidPhone(v), "Please enter a valid telephone number");

export const optionalEmailSchema = z
  .string()
  .trim()
  .max(200, "Email address is too long")
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || EMAIL_RE.test(v), "Please enter a valid email address");

export const requiredEmailSchema = z
  .string()
  .trim()
  .min(1, "Please enter your email address")
  .max(200, "Email address is too long")
  .refine((v) => EMAIL_RE.test(v), "Please enter a valid email address");

export function firstError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Please check your details and try again.";
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}
