export function toSearchString(
  values: Record<string, string | number | null | undefined>,
  extra?: Record<string, string | number | null | undefined>,
) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...values, ...extra })) {
    if (value === null || value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  const serialized = search.toString();
  return serialized ? `?${serialized}` : "";
}
