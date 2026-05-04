import { createRoot } from "react-dom/client";
import AppConsumer from "./AppConsumer.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<AppConsumer />);
