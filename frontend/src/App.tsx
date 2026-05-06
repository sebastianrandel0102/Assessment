import { FormEvent, useMemo, useState } from "react";
import { saveContactSupport, type ContactForm } from "./api/contactSupport";

const emptyForm: ContactForm = {
  name: "",
  email: "",
  message: ""
};

export default function App() {
  const [form, setForm] = useState<ContactForm>(emptyForm);
  const [status, setStatus] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const canSend = useMemo(
    () => Boolean(form.name.trim() && form.email.trim() && form.message.trim()),
    [form]
  );

  function updateField(field: keyof ContactForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSending(true);
    setStatus("Sending message...");

    try {
      await saveContactSupport(form);
      setForm(emptyForm);
      setStatus("Message Sent Successfully");
    } catch {
      setStatus("Please complete the form with a valid email before sending.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="shell" data-theme={theme}>
      <button
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        aria-pressed={theme === "dark"}
        className="theme-toggle"
        onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
        type="button"
      >
        <span className="theme-toggle-track">
          <span className="theme-toggle-thumb" />
        </span>
        <span>{theme === "light" ? "Light" : "Dark"}</span>
      </button>

      <div className="background-art" aria-hidden="true">
        <span className="art-ring art-ring-one" />
        <span className="art-ring art-ring-two" />
        <span className="art-dot art-dot-one" />
        <span className="art-dot art-dot-two" />
        <span className="art-pill" />
      </div>

      <section className="contact-hero" aria-labelledby="contact-title">
        <section className="contact-card" aria-label="Contact workspace">
          <div className="form-panel">
            <div className="card-cap">
              <p className="eyebrow">Contact workspace</p>
              <h1 id="contact-title">Send a message</h1>
            </div>

            <form className="form-stack" onSubmit={sendMessage}>
              <label className="field">
                <span className="field-icon">N</span>
                <input
                  aria-label="Full Name"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="Name"
                  autoComplete="name"
                  required
                />
              </label>

              <label className="field">
                <span className="field-icon">@</span>
                <input
                  aria-label="Email Address"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="E-mail"
                  autoComplete="email"
                  type="email"
                  required
                />
              </label>

              <label className="field message-field">
                <span className="field-icon">...</span>
                <textarea
                  aria-label="Message"
                  value={form.message}
                  onChange={(event) => updateField("message", event.target.value)}
                  placeholder="Message"
                  rows={7}
                  required
                />
              </label>

              <button className="primary-button" disabled={!canSend || isSending} type="submit">
                {isSending ? "Saving..." : "Save It!"}
              </button>
            </form>
          </div>

          <aside className="side-panel">
            <aside className="preview" aria-label="Live message preview">
              <p className="preview-label">Live Preview</p>
              <p className="preview-name">{form.name || "Your Name"}</p>
              <a className="preview-email" href={form.email ? `mailto:${form.email}` : undefined}>
                {form.email || "your@email.com"}
              </a>
              <p className="preview-message">{form.message || "Start typing to preview."}</p>
            </aside>
          </aside>
        </section>
      </section>

      {status ? <p className="status">{status}</p> : null}
    </main>
  );
}
