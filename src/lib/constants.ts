export const PAYMENT_LABELS = {
  cash: "Espèces",
  mobile_money: "Mobile Money",
} as const;

export const DISCOUNT_LABELS = {
  commercial_discount: "Remise commerciale",
  regular_customer: "Client régulier",
  goodwill: "Geste commercial",
  error: "Erreur",
  other: "Autre",
} as const;

export const NATURE_LABELS = {
  FIXE: "Fixe",
  VARIABLE: "Variable",
} as const;

export const SALARY_STATUS_LABELS = {
  to_pay: "À payer",
  partial: "Partiellement payé",
  paid: "Payé",
} as const;

export const FREQUENCY_LABELS = {
  weekly: "Hebdomadaire",
  monthly: "Mensuelle",
  yearly: "Annuelle",
} as const;

export const OCCURRENCE_LABELS = {
  pending: "À confirmer",
  confirmed: "Confirmée",
  skipped: "Ignorée",
} as const;
