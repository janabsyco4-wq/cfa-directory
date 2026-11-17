"use client";

import { useEffect } from "react";

// Lets the phone keep the fixed parts of the site (see public/sw.js). Production only,
// so local development always shows the latest code.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
  }, []);
  return null;
}
