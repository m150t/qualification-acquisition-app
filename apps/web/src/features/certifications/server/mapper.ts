// ==================================================
// Certifications: UI向けDTO
// ==================================================

export type CertificationListItem = {
  code: string;
  name: string;
};

export function toCertificationListItem(input: unknown): CertificationListItem | null {
  const code = (input as { code?: unknown } | null)?.code;
  const name = (input as { name?: unknown } | null)?.name;

  if (typeof code !== "string" || typeof name !== "string") return null;
  return { code, name };
}

export type ServiceError = { status: number; error: string };
