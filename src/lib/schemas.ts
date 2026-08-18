import { z } from "zod";

export const amountSchema = z.coerce.number().int().min(0);

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Mot de passe trop court"),
});

export const washSchema = z
  .object({
    vehicleTypeId: z.string().uuid("Type de véhicule requis"),
    plate: z.string().trim().min(1, "Plaque requise").max(20),
    serviceIds: z.array(z.string().uuid()).min(1, "Choisissez au moins une prestation"),
    employeeIds: z.array(z.string().uuid()).min(1, "Choisissez au moins un employé"),
    paymentMethod: z.enum(["cash", "mobile_money"]),
    theoreticalAmount: amountSchema,
    finalAmount: amountSchema,
    discountReason: z
      .enum(["commercial_discount", "regular_customer", "goodwill", "error", "other"])
      .optional()
      .nullable(),
    discountNote: z.string().optional().nullable(),
    customerId: z.string().uuid().optional().nullable(),
    customerName: z.string().optional().nullable(),
    customerPhone: z.string().optional().nullable(),
    note: z.string().optional().nullable(),
  })
  .refine((data) => data.theoreticalAmount === data.finalAmount || data.discountReason, {
    message: "Indiquez le motif de la différence de prix",
    path: ["discountReason"],
  });

export const serviceSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, "Nom requis"),
  description: z.string().optional().nullable(),
  referencePrice: amountSchema,
  prices: z.array(
    z.object({
      vehicleTypeId: z.string().uuid(),
      price: amountSchema,
    }),
  ),
});

export const vehicleTypeSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2),
  slug: z.string().min(2),
});

export const employeeSchema = z.object({
  id: z.string().uuid().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional().nullable(),
  roleId: z.string().uuid().optional().nullable(),
  monthlySalary: amountSchema,
  hiredAt: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
});

export const expenseSchema = z.object({
  amount: amountSchema.min(1, "Montant requis"),
  date: z.string().min(1),
  categoryId: z.string().uuid(),
  nature: z.enum(["FIXE", "VARIABLE"]),
  description: z.string().min(2),
  supplier: z.string().optional().nullable(),
  paymentMethod: z.enum(["cash", "mobile_money"]),
});

export const recurringExpenseSchema = z.object({
  categoryId: z.string().uuid(),
  description: z.string().min(2),
  amount: amountSchema.min(1),
  nature: z.enum(["FIXE", "VARIABLE"]),
  paymentMethod: z.enum(["cash", "mobile_money"]),
  frequency: z.enum(["weekly", "monthly", "yearly"]),
  startDate: z.string().min(1),
});

export const salaryPaymentSchema = z.object({
  employeeId: z.string().uuid(),
  periodMonth: z.string().min(1),
  expectedAmount: amountSchema,
  paidAmount: amountSchema,
  paidAt: z.string().optional().nullable(),
  comment: z.string().optional().nullable(),
});

export const cashOpenSchema = z.object({
  businessDate: z.string().min(1),
  openingCash: amountSchema,
  openingMobileMoney: amountSchema,
});

export const cashCloseSchema = z.object({
  sessionId: z.string().uuid(),
  countedCash: amountSchema,
  countedMobileMoney: amountSchema,
  comment: z.string().optional().nullable(),
});

export const goalSchema = z.object({
  periodMonth: z.string().min(1),
  revenueTarget: amountSchema,
  washesTarget: z.coerce.number().int().min(0),
});

export const organizationSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  defaultOpeningCash: amountSchema,
});

export const categorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2),
  defaultNature: z.enum(["FIXE", "VARIABLE"]),
});
