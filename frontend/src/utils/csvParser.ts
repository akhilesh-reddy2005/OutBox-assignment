const EMAIL_REGEX =
  /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*/g;

export function extractEmailsFromText(text: string): string[] {
  const matches = text.match(EMAIL_REGEX) ?? [];
  const unique = new Set<string>();

  for (const email of matches) {
    unique.add(email.toLowerCase());
  }

  return Array.from(unique);
}

export async function parseEmailFile(file: File): Promise<string[]> {
  const text = await file.text();
  return extractEmailsFromText(text);
}
