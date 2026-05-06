import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ContactSupportError,
  requestContactSupportOtp,
  saveContactSupport,
  verifyContactSupportOtp,
  type ContactForm
} from "./api/contactSupport";
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

const OTP_LENGTH = 6;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function formatTimer(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export default function App() {
  const [form, setForm] = useState<ContactForm>(emptyForm);
  const [otp, setOtp] = useState("");
  const [otpPanelOpen, setOtpPanelOpen] = useState(false);
  const [otpSecondsRemaining, setOtpSecondsRemaining] = useState(0);
  const [verificationToken, setVerificationToken] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [status, setStatus] = useState("");
  const [isOtpSending, setIsOtpSending] = useState(false);
  const [isOtpVerifying, setIsOtpVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const normalizedFormEmail = useMemo(() => normalizeEmail(form.email), [form.email]);
  const isEmailVerified = Boolean(verificationToken && verifiedEmail === normalizedFormEmail);
  const hasIdentity = useMemo(
    () => Boolean(form.name.trim() && EMAIL_PATTERN.test(normalizedFormEmail)),
    [form.name, normalizedFormEmail]
  );
  const otpTimerLabel = formatTimer(otpSecondsRemaining);

  const canSend = useMemo(
    () => Boolean(form.name.trim() && normalizedFormEmail && form.message.trim() && isEmailVerified),
    [form.name, form.message, normalizedFormEmail, isEmailVerified]
  );
  const canRequestOtp =
    hasIdentity && !isOtpSending && !isEmailVerified && otpSecondsRemaining === 0;
  const canVerifyOtp =
    otp.length === OTP_LENGTH && otpSecondsRemaining > 0 && !isOtpVerifying && !isEmailVerified;

  useEffect(() => {
    if (otpSecondsRemaining <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setOtpSecondsRemaining((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [otpSecondsRemaining]);

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

    if (field === "email") {
      setOtp("");
      setOtpPanelOpen(false);
      setOtpSecondsRemaining(0);
      setVerificationToken("");
      setVerifiedEmail("");
    }
  }

  function updateOtp(value: string) {
    setOtp(value.replace(/\D/g, "").slice(0, OTP_LENGTH));
  }

  async function requestOtp() {
    if (!hasIdentity || isEmailVerified) {
      return;
    }

    setOtpPanelOpen(true);
    setIsOtpSending(true);
    setStatus("Sending OTP...");

    try {
      const result = await requestContactSupportOtp({
        name: form.name,
        email: normalizedFormEmail
      });

      setOtp("");
      setVerificationToken("");
      setVerifiedEmail("");
      setOtpSecondsRemaining(result.retryAfterSeconds || result.expiresInSeconds || 120);
      setStatus(`OTP sent to ${normalizedFormEmail}.`);
    } catch (error) {
      if (error instanceof ContactSupportError && error.retryAfterSeconds) {
        setOtpSecondsRemaining(error.retryAfterSeconds);
      }

      setStatus(getErrorMessage(error, "Failed to send OTP email."));
    } finally {
      setIsOtpSending(false);
    }
  }

  async function verifyOtp() {
    if (!canVerifyOtp) {
      return;
    }

    setIsOtpVerifying(true);
    setStatus("Checking OTP...");

    try {
      const result = await verifyContactSupportOtp({
        email: normalizedFormEmail,
        otp
      });

      setOtp("");
      setOtpPanelOpen(false);
      setOtpSecondsRemaining(0);
      setVerificationToken(result.verificationToken);
      setVerifiedEmail(normalizeEmail(result.verifiedEmail));
      setStatus("Email verified. You can send the message now.");
    } catch (error) {
      setStatus(getErrorMessage(error, "Failed to verify OTP."));
    } finally {
      setIsOtpVerifying(false);
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isEmailVerified) {
      setOtpPanelOpen(true);
      setStatus("Please verify your email before sending.");
      return;
    }

    setIsSending(true);
    setStatus("Sending message...");

    try {
      await saveContactSupport({
        ...form,
        email: normalizedFormEmail,
        verificationToken
      });
      setForm(emptyForm);
      setOtp("");
      setOtpPanelOpen(false);
      setOtpSecondsRemaining(0);
      setVerificationToken("");
      setVerifiedEmail("");
      setStatus("Message Sent Successfully");
    } catch (error) {
      if (getErrorMessage(error, "").toLowerCase().includes("verify")) {
        setVerificationToken("");
        setVerifiedEmail("");
        setOtpPanelOpen(true);
      }

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
            otp={otp}
            otpPanelOpen={otpPanelOpen}
            otpSecondsRemaining={otpSecondsRemaining}
            isEmailVerified={isEmailVerified}
            isOtpSending={isOtpSending}
            isOtpVerifying={isOtpVerifying}
            isSending={isSending}
            canRequestOtp={canRequestOtp}
            canVerifyOtp={canVerifyOtp}
            canSend={canSend}
            otpTimerLabel={otpTimerLabel}
            onFieldChange={updateField}
            onOtpChange={updateOtp}
            onRequestOtp={requestOtp}
            onVerifyOtp={verifyOtp}
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
