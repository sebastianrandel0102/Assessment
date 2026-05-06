import { FC } from "react";
import "./BackgroundArt.css";

export const BackgroundArt: FC = () => {
  return (
    <div className="background-art" aria-hidden="true">
      <span className="art-ring art-ring-one" />
      <span className="art-ring art-ring-two" />
      <span className="art-dot art-dot-one" />
      <span className="art-dot art-dot-two" />
      <span className="art-pill" />
    </div>
  );
};
