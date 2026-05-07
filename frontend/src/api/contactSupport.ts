export type ContactForm = {
  name: string;
  email: string;
  message: string;
};

const CONTACT_SUPPORT_ENDPOINT = "/api/contact";

export class ContactSupportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContactSupportError";
  }
}

async function readError(response: Response, fallback: string) {
  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    return new ContactSupportError(fallback);
  }

  if (!payload || typeof payload !== "object") {
    return new ContactSupportError(fallback);
  }

  const errorPayload = payload as { error?: unknown };
  const message = typeof errorPayload.error === "string" ? errorPayload.error : fallback;

  return new ContactSupportError(message);
}

export async function saveContactSupport(form: ContactForm) {
  const response = await fetch(CONTACT_SUPPORT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form)
  });

  if (!response.ok) {
    throw await readError(response, "Failed to save contact support message.");
  }

  return response.json();
}
