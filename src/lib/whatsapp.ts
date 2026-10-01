const GUINEA_CODE = "224";
const GUINEA_LOCAL_MOBILE = /^0?(6\d{8})$/;
const GUINEA_INTERNATIONAL_MOBILE = /^2246\d{8}$/;
const INTERNATIONAL_NUMBER = /^[1-9]\d{7,14}$/;

export const NAME_PLACEHOLDER = "{nom}";

export type WhatsAppRecipient = {
  number: string;
  name: string | null;
};

export type UnreachableCustomer = {
  id: string;
  name: string | null;
  phone: string;
};

type CustomerContact = {
  id: string;
  name: string | null;
  phone: string | null;
};

/** Returns the number as WhatsApp expects it (country code, digits only), or null if unusable. */
export function toWhatsAppNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  const isInternational = trimmed.startsWith("+") || digits.startsWith("00");

  if (!isInternational) {
    const local = GUINEA_LOCAL_MOBILE.exec(digits);
    if (local) return `${GUINEA_CODE}${local[1]}`;
    return GUINEA_INTERNATIONAL_MOBILE.test(digits) ? digits : null;
  }

  const number = digits.replace(/^00/, "");
  return INTERNATIONAL_NUMBER.test(number) ? number : null;
}

export function formatWhatsAppNumber(number: string) {
  if (!GUINEA_INTERNATIONAL_MOBILE.test(number)) return `+${number}`;
  const local = number.slice(GUINEA_CODE.length);
  return `+${GUINEA_CODE} ${local.slice(0, 3)} ${local.slice(3, 5)} ${local.slice(5, 7)} ${local.slice(7)}`;
}

export function personalizeMessage(message: string, name: string | null) {
  if (name) return message.replaceAll(NAME_PLACEHOLDER, name);
  return message.replaceAll(` ${NAME_PLACEHOLDER}`, "").replaceAll(NAME_PLACEHOLDER, "");
}

export function whatsAppUrl(number: string, message: string) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function groupWhatsAppRecipients(customers: CustomerContact[]) {
  const recipients = new Map<string, WhatsAppRecipient>();
  const unreachable: UnreachableCustomer[] = [];

  for (const customer of customers) {
    if (!customer.phone) continue;
    const number = toWhatsAppNumber(customer.phone);
    if (!number) {
      unreachable.push({ id: customer.id, name: customer.name, phone: customer.phone });
      continue;
    }
    const existing = recipients.get(number);
    if (!existing) {
      recipients.set(number, { number, name: customer.name });
      continue;
    }
    if (!existing.name && customer.name) existing.name = customer.name;
  }

  return { recipients: [...recipients.values()], unreachable };
}
