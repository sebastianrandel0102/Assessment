import { FC } from "react";
import "./ThemeToggle.css";

interface ThemeToggleProps {
  theme: "light" | "dark";
  onChange: (theme: "light" | "dark") => void;
}

export const ThemeToggle: FC<ThemeToggleProps> = ({ theme, onChange }) => {
  return (
    <button
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      aria-pressed={theme === "dark"}
      className="theme-toggle"
      onClick={() => onChange(theme === "light" ? "dark" : "light")}
      type="button"
    >
      <span className="theme-toggle-track">
        <span className="theme-toggle-thumb" />
      </span>
      <span>{theme === "light" ? "Light" : "Dark"}</span>
    </button>
  );
};
