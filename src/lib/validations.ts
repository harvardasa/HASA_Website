import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

// Admin password policy — stricter than member password (14+ chars).
// Members use magic links, so they have no password. This applies only to CMS admins.
export const adminPasswordSchema = z
  .string()
  .min(14, 'Password must be at least 14 characters')
  .regex(/[a-z]/, 'Must include a lowercase letter')
  .regex(/[A-Z]/, 'Must include an uppercase letter')
  .regex(/[0-9]/, 'Must include a number')
  .regex(/[^a-zA-Z0-9]/, 'Must include a symbol (e.g. !@#$%^&*)')

export const adminLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const adminResetPasswordSchema = z
  .object({
    password: adminPasswordSchema,
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  })

const urlOrEmpty = z
  .string()
  .optional()
  .refine(
    (val) => !val || /^https?:\/\/.+/.test(val),
    { message: 'Must be a valid URL starting with http:// or https://' }
  )

const emailOrEmpty = z
  .string()
  .optional()
  .refine(
    (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    { message: 'Must be a valid email address' }
  )

export const onboardingStep1Schema = z.object({
  prefix: z.string().optional(),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  preferred_name: z.string().optional(),
})

export const onboardingStep2Schema = z.object({
  harvard_school: z.string().min(1, 'School is required'),
  harvard_school_code: z.string().min(1, 'School code is required'),
  degree_abbreviation: z.string().optional(),
  concentration_field: z.string().optional(),
  graduation_year: z.coerce
    .number()
    .int()
    .min(1636, 'Year seems too early')
    .max(2040, 'Year seems too far in the future')
    .optional()
    .nullable(),
  is_current_student: z.boolean(),
  house: z.string().optional(),
})

export const onboardingStep3Schema = z.object({
  country_of_origin: z.string().min(1, 'Country of origin is required'),
  africa_region: z
    .enum(['north', 'west', 'east', 'central', 'southern', 'diaspora'])
    .optional()
    .nullable(),
  languages: z.array(z.string()),
})

export const onboardingStep4Schema = z.object({
  job_title: z.string().optional(),
  current_company: z.string().optional(),
  industry: z.string().optional(),
  city: z.string().optional(),
  country_of_residence: z.string().optional(),
})

export const onboardingStep5Schema = z.object({
  contact_email: emailOrEmpty,
  linkedin_url: urlOrEmpty,
  personal_website: urlOrEmpty,
  short_bio: z
    .string()
    .max(600, 'Bio must be 600 characters or less')
    .optional(),
})

export const onboardingStep6Schema = z.object({
  willing_to_mentor: z.boolean(),
  open_to_coffee_chats: z.boolean(),
  show_email_to_members: z.boolean(),
})

export const fullProfileSchema = onboardingStep1Schema
  .merge(onboardingStep2Schema)
  .merge(onboardingStep3Schema)
  .merge(onboardingStep4Schema)
  .merge(onboardingStep5Schema)
  .merge(onboardingStep6Schema)

export type LoginFormData = z.infer<typeof loginSchema>
export type OnboardingStep1Data = z.infer<typeof onboardingStep1Schema>
export type OnboardingStep2Data = z.infer<typeof onboardingStep2Schema>
export type OnboardingStep3Data = z.infer<typeof onboardingStep3Schema>
export type OnboardingStep4Data = z.infer<typeof onboardingStep4Schema>
export type OnboardingStep5Data = z.infer<typeof onboardingStep5Schema>
export type OnboardingStep6Data = z.infer<typeof onboardingStep6Schema>
export type FullProfileData = z.infer<typeof fullProfileSchema>
