// ============================================
// Industries
// ============================================
export const INDUSTRIES = [
  "Retail",
  "Food & Beverage",
  "Healthcare",
  "Technology",
  "Education",
  "Manufacturing",
  "Professional Services",
  "Real Estate",
  "Hospitality",
  "Transportation",
  "Agriculture",
  "Construction",
  "Entertainment",
  "Finance",
  "Non-Profit",
  "Other",
] as const;

export type Industry = (typeof INDUSTRIES)[number];

// ============================================
// Areas of Interest / Expertise
// ============================================
export const EXPERTISE_AREAS = [
  "Marketing",
  "Digital Marketing",
  "Social Media",
  "Finance",
  "Accounting",
  "Taxation",
  "Auditing",
  "Operations",
  "Supply Chain",
  "Human Resources",
  "Strategy",
  "Business Development",
  "Sales",
  "Customer Service",
  "Product Management",
  "Project Management",
  "Data Analytics",
  "Business Intelligence",
  "Market Research",
  "Branding",
  "E-commerce",
  "Content Strategy",
  "Financial Planning",
  "Investment",
  "Risk Management",
  "Legal Compliance",
  "Sustainability",
  "Innovation",
] as const;

export type ExpertiseArea = (typeof EXPERTISE_AREAS)[number];

// ============================================
// Degree Levels
// ============================================
export const DEGREE_LEVELS = [
  { value: "undergraduate", label: "Undergraduate (Bachelor's)" },
  { value: "masters", label: "Master's (MBA, MS, etc.)" },
  { value: "doctorate", label: "Doctorate (PhD, DBA)" },
  { value: "other", label: "Other" },
] as const;

// ============================================
// Compensation Types
// ============================================
export const COMPENSATION_TYPES = [
  { value: "paid", label: "Paid" },
  { value: "voluntary", label: "Voluntary (Unpaid)" },
  { value: "negotiable", label: "Negotiable" },
] as const;

// ============================================
// Issue Status
// ============================================
export const ISSUE_STATUSES = [
  { value: "open", label: "Open", color: "primary" },
  { value: "in_progress_accepting", label: "In Progress (Accepting)", color: "blue" },
  { value: "in_progress_full", label: "In Progress (Full)", color: "amber" },
  { value: "completed", label: "Completed", color: "green" },
  { value: "closed", label: "Closed", color: "slate" },
] as const;

// ============================================
// Interest Status
// ============================================
export const INTEREST_STATUSES = [
  { value: "pending", label: "Pending", color: "amber" },
  { value: "approved", label: "Approved", color: "emerald" },
  { value: "rejected", label: "Rejected", color: "red" },
  { value: "withdrawn", label: "Withdrawn", color: "slate" },
] as const;

// ============================================
// App Constants
// ============================================
export const APP_NAME = "FirstPrincipleBiz";
export const APP_DESCRIPTION =
  "Platform connecting business students with small/local businesses";

export const PAGINATION_LIMIT = 10;
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];










