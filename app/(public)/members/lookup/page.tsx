import { permanentRedirect } from "next/navigation";

// Verification moved to /verify; keep old links and bookmarks working.
export default function LookupPage() {
  permanentRedirect("/verify");
}
