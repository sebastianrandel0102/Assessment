import { FC } from "react";
import "./MessagePreview.css";
import type { ContactForm } from "../../api/contactSupport";

interface MessagePreviewProps {
  form: ContactForm;
}

export const MessagePreview: FC<MessagePreviewProps> = ({ form }) => {
  return (
    <aside className="preview" aria-label="Live message preview">
      <p className="preview-label">Live Preview</p>
      <p className="preview-name">{form.name || "Your Name"}</p>
      <a className="preview-email" href={form.email ? `mailto:${form.email}` : undefined}>
        {form.email || "your@email.com"}
      </a>
      <p className="preview-message">{form.message || "Start typing to preview."}</p>
    </aside>
  );
};
