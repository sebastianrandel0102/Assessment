import { FC } from "react";
import "./StatusMessage.css";

interface StatusMessageProps {
  message: string;
}

function getStatusTone(status: string) {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus === "sending message...") {
    return "warning";
  }

  if (normalizedStatus === "message sent successfully") {
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
