import { FormEvent, FC } from "react";
import "./ContactForm.css";
import type { ContactForm as ContactFormType } from "../../api/contactSupport";

const OTP_LENGTH = 6;

interface ContactFormProps {
  form: ContactFormType;
  otp: string;
  otpPanelOpen: boolean;
  otpSecondsRemaining: number;
  isEmailVerified: boolean;
  isOtpSending: boolean;
  isOtpVerifying: boolean;
  isSending: boolean;
  canRequestOtp: boolean;
  canVerifyOtp: boolean;
  canSend: boolean;
  otpTimerLabel: string;
  onFieldChange: (field: keyof ContactFormType, value: string) => void;
  onOtpChange: (value: string) => void;
  onRequestOtp: () => void;
  onVerifyOtp: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export const ContactForm: FC<ContactFormProps> = ({
  form,
  otp,
  otpPanelOpen,
  otpSecondsRemaining,
  isEmailVerified,
  isOtpSending,
  isOtpVerifying,
  isSending,
  canRequestOtp,
  canVerifyOtp,
  canSend,
  otpTimerLabel,
  onFieldChange,
  onOtpChange,
  onRequestOtp,
  onVerifyOtp,
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

        <div className={`otp-panel ${otpPanelOpen || isEmailVerified ? "otp-panel-open" : ""}`}>
          <div className="otp-action-row">
            <button
              className={`otp-send-button ${isEmailVerified ? "otp-verified-button" : ""} ${
                isOtpSending ? "otp-sending-button" : ""
              }`}
              disabled={!canRequestOtp}
              onClick={onRequestOtp}
              type="button"
            >
              {isEmailVerified
                ? "Verified"
                : isOtpSending
                  ? "Sending OTP..."
                  : otpSecondsRemaining > 0
                    ? `Send again in ${otpTimerLabel}`
                    : otpPanelOpen
                      ? "Send OTP Again"
                      : "Verify Email"}
            </button>

            {isEmailVerified ? (
              <span className="otp-note">Email verified</span>
            ) : otpPanelOpen ? (
              <span className="otp-note">
                {otpSecondsRemaining > 0 ? `OTP expires in ${otpTimerLabel}` : "OTP expired"}
              </span>
            ) : null}
          </div>

          {otpPanelOpen && !isEmailVerified ? (
            <div className="otp-entry-row">
              <label className="field otp-code-field">
                <span className="field-icon">#</span>
                <input
                  aria-label="OTP Code"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  maxLength={OTP_LENGTH}
                  onChange={(event) => onOtpChange(event.target.value)}
                  placeholder="OTP"
                  value={otp}
                />
              </label>

              <button
                className="secondary-button"
                disabled={!canVerifyOtp}
                onClick={onVerifyOtp}
                type="button"
              >
                {isOtpVerifying ? "Checking..." : "Confirm OTP"}
              </button>
            </div>
          ) : null}
        </div>

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
          {isSending ? "Sending..." : isEmailVerified ? "Send Message" : "Verify Email First"}
        </button>
      </form>
    </div>
  );
};
