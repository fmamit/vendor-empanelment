import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// One-time cleanup: unregister stale service workers and clear old caches
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
  caches.keys().then(names => names.forEach(name => caches.delete(name)));
}

createRoot(document.getElementById("root")!).render(<App />);
