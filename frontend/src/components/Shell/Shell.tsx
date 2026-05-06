import { ReactNode, FC } from "react";
import "./Shell.css";

interface ShellProps {
  theme: "light" | "dark";
  children: ReactNode;
}

export const Shell: FC<ShellProps> = ({ theme, children }) => {
  return (
    <main className="shell" data-theme={theme}>
      {children}
    </main>
  );
};
