export type ContactForm = {
  name: string;
  email: string;
  message: string;
};

export async function saveContactSupport(form: ContactForm) {
  const response = await fetch("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form)
  });

  if (!response.ok) {
    throw new Error("Failed to save contact support message.");
  }

  return response.json();
}
