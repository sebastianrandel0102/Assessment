import { FormEvent, useEffect, useMemo, useState } from "react";
import { saveContactSupport, type ContactForm } from "./api/contactSupport";
import { Shell } from "./components/Shell/Shell";
import { ThemeToggle } from "./components/ThemeToggle/ThemeToggle";
import { BackgroundArt } from "./components/BackgroundArt/BackgroundArt";
import { ContactForm as ContactFormComponent } from "./components/ContactForm/ContactForm";
import { MessagePreview } from "./components/MessagePreview/MessagePreview";
import { StatusMessage } from "./components/StatusMessage/StatusMessage";

const emptyForm: ContactForm = {
  name: "",
  email: "",
  message: ""
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export default function App() {
  const [form, setForm] = useState<ContactForm>(emptyForm);
  const [status, setStatus] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const normalizedFormEmail = useMemo(() => normalizeEmail(form.email), [form.email]);

  const canSend = useMemo(
    () => Boolean(form.name.trim() && EMAIL_PATTERN.test(normalizedFormEmail) && form.message.trim()),
    [form.name, form.message, normalizedFormEmail]
  );

  useEffect(() => {
    if (status.toLowerCase() !== "message sent successfully") {
      return;
    }

    const timer = window.setTimeout(() => {
      setStatus("");
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [status]);

  function updateField(field: keyof ContactForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSend) {
      setStatus("Please complete the form with a valid email before sending.");
      return;
    }

    setIsSending(true);
    setStatus("Sending message...");

    try {
      await saveContactSupport({
        ...form,
        email: normalizedFormEmail
      });
      setForm(emptyForm);
      setStatus("Message Sent Successfully");
    } catch (error) {
      setStatus(getErrorMessage(error, "Please complete the form with a valid email before sending."));
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Shell theme={theme}>
      <ThemeToggle theme={theme} onChange={setTheme} />
      <BackgroundArt />

      <section className="contact-hero" aria-labelledby="contact-title">
        <section className="contact-card" aria-label="Contact workspace">
          <ContactFormComponent
            form={form}
            isSending={isSending}
            canSend={canSend}
            onFieldChange={updateField}
            onSubmit={sendMessage}
          />

          <aside className="side-panel">
            <MessagePreview form={form} />
          </aside>
        </section>
      </section>

      <StatusMessage message={status} />
    </Shell>
  );
}
