import { FC } from "react";
import "./StatusMessage.css";

interface StatusMessageProps {
  message: string;
}

function getStatusTone(status: string) {
  const normalizedStatus = status.toLowerCase();

  if (
    normalizedStatus.includes("please wait before requesting another otp") ||
    normalizedStatus === "sending message..."
  ) {
    return "warning";
  }

  if (
    normalizedStatus.startsWith("otp sent to ") ||
    normalizedStatus === "email verified. you can send the message now." ||
    normalizedStatus === "message sent successfully"
  ) {
    return "success";
  }

  return "default";
}

export const StatusMessage: FC<StatusMessageProps> = ({ message }) => {
  if (!message) return null;

  return (
    <p className={`status status-${getStatusTone(message)}`}>{message}</p>
  );
};
