import type { Metadata } from "next";
import ResetClient from "./ResetClient";

export const metadata: Metadata = { title: "Reset password" };

// The reset switch is an environment variable, so read it on every request.
export const dynamic = "force-dynamic";

export default function ResetPage() {
  const code = process.env.ADMIN_RESET_CODE?.trim() ?? "";
  return <ResetClient enabled={code.length >= 16} />;
}
