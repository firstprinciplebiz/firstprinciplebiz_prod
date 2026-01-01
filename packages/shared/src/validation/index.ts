import { z } from "zod";
import { INDUSTRIES, EXPERTISE_AREAS } from "../constants";

// ============================================
// Auth Schemas
// ============================================
export const emailSchema = z.string().email("Invalid email address");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(["student", "business"]),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// ============================================
// Student Profile Schema
// ============================================
export const studentProfileSchema = z.object({
  full_name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{9,14}$/, "Invalid phone number")
    .optional()
    .or(z.literal("")),
  date_of_birth: z.string().optional(),
  university_name: z
    .string()
    .min(2, "University name is required")
    .max(200, "University name is too long"),
  degree_name: z
    .string()
    .min(2, "Degree name is required")
    .max(200, "Degree name is too long"),
  major: z
    .string()
    .min(2, "Major is required")
    .max(200, "Major is too long"),
  degree_level: z.enum(["undergraduate", "masters", "doctorate", "other"]),
  bio: z.string().max(1000, "Bio is too long").optional(),
  areas_of_interest: z.array(z.string()).optional().default([]),
  expertise: z.array(z.string()).optional().default([]),
  open_to_paid: z.boolean().optional().default(true),
  open_to_voluntary: z.boolean().optional().default(true),
});

export type StudentProfileInput = z.infer<typeof studentProfileSchema>;

// ============================================
// Business Profile Schema
// ============================================
export const businessProfileSchema = z.object({
  owner_name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{9,14}$/, "Invalid phone number")
    .optional()
    .or(z.literal("")),
  business_name: z
    .string()
    .min(2, "Business name is required")
    .max(200, "Business name is too long"),
  business_description: z.string().max(2000, "Description is too long").optional(),
  industry: z.enum(INDUSTRIES as unknown as [string, ...string[]]),
  address: z.string().max(500, "Address is too long").optional(),
  business_age_years: z.number().min(0).max(200).optional(),
  looking_for: z.array(z.enum(EXPERTISE_AREAS as unknown as [string, ...string[]])).optional().default([]),
});

export type BusinessProfileInput = z.infer<typeof businessProfileSchema>;

// ============================================
// Issue Schema
// ============================================
export const issueSchema = z.object({
  title: z
    .string()
    .min(10, "Title must be at least 10 characters")
    .max(200, "Title is too long"),
  description: z
    .string()
    .min(50, "Description must be at least 50 characters")
    .max(5000, "Description is too long"),
  expectations: z.string().max(2000, "Expectations is too long").optional(),
  compensation_type: z.enum(["paid", "voluntary", "negotiable"]),
  compensation_amount: z.number().min(0).optional(),
  duration_days: z.number().min(1).max(365).optional(),
  required_skills: z.array(z.string()).optional().default([]),
});

export type IssueInput = z.infer<typeof issueSchema>;

// ============================================
// Interest Schema
// ============================================
export const interestSchema = z.object({
  issue_id: z.string().uuid(),
  cover_message: z.string().max(1000, "Message is too long").optional(),
});

export type InterestInput = z.infer<typeof interestSchema>;

// ============================================
// Message Schema
// ============================================
export const messageSchema = z.object({
  receiver_id: z.string().uuid(),
  issue_id: z.string().uuid().optional(),
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(5000, "Message is too long"),
});

export type MessageInput = z.infer<typeof messageSchema>;













