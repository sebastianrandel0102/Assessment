import { FormEvent, FC } from "react";
import "./ContactForm.css";
import type { ContactForm as ContactFormType } from "../../api/contactSupport";

interface ContactFormProps {
  form: ContactFormType;
  isSending: boolean;
  canSend: boolean;
  onFieldChange: (field: keyof ContactFormType, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export const ContactForm: FC<ContactFormProps> = ({
  form,
  isSending,
  canSend,
  onFieldChange,
  onSubmit
}) => {
  return (
    <div className="form-panel">
      <div className="card-cap">
        <p className="eyebrow">Contact workspace</p>
        <h1 id="contact-title">Send a message</h1>
      </div>

      <form className="form-stack" onSubmit={onSubmit}>
        <label className="field">
          <span className="field-icon">N</span>
          <input
            aria-label="Full Name"
            value={form.name}
            onChange={(event) => onFieldChange("name", event.target.value)}
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
            onChange={(event) => onFieldChange("email", event.target.value)}
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
            onChange={(event) => onFieldChange("message", event.target.value)}
            placeholder="Message"
            rows={7}
            required
          />
        </label>

        <button className="primary-button" disabled={!canSend || isSending} type="submit">
          {isSending ? "Sending..." : "Send Message"}
        </button>
      </form>
    </div>
  );
};
