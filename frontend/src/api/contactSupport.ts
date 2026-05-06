export type ContactForm = {
  name: string;
  email: string;
  message: string;
};

export type ContactSubmission = ContactForm & {
  verificationToken: string;
};

export type OtpRequest = Pick<ContactForm, "name" | "email">;

export type OtpVerification = {
  email: string;
  otp: string;
};

export type OtpRequestResponse = {
  expiresInSeconds: number;
  retryAfterSeconds: number;
};

export type OtpVerificationResponse = {
  verificationToken: string;
  verifiedEmail: string;
};

const CONTACT_SUPPORT_ENDPOINT = "/api/contact";

export class ContactSupportError extends Error {
  retryAfterSeconds?: number;

  constructor(message: string, retryAfterSeconds?: number) {
    super(message);
    this.name = "ContactSupportError";
    this.retryAfterSeconds = retryAfterSeconds;
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

  const errorPayload = payload as { error?: unknown; retryAfterSeconds?: unknown };
  const message = typeof errorPayload.error === "string" ? errorPayload.error : fallback;
  const retryAfterSeconds =
    typeof errorPayload.retryAfterSeconds === "number" ? errorPayload.retryAfterSeconds : undefined;

  return new ContactSupportError(message, retryAfterSeconds);
}

export async function requestContactSupportOtp(form: OtpRequest): Promise<OtpRequestResponse> {
  const response = await fetch(`${CONTACT_SUPPORT_ENDPOINT}/otp/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form)
  });

  if (!response.ok) {
    throw await readError(response, "Failed to send OTP email.");
  }

  return response.json();
}

export async function verifyContactSupportOtp(
  verification: OtpVerification
): Promise<OtpVerificationResponse> {
  const response = await fetch(`${CONTACT_SUPPORT_ENDPOINT}/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(verification)
  });

  if (!response.ok) {
    throw await readError(response, "Failed to verify OTP.");
  }

  return response.json();
}

export async function saveContactSupport(form: ContactSubmission) {
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
