import Link from "next/link";
import { UserX } from "lucide-react";

export default function MemberNotFound() {
  return (
    <div className="container-site py-20 text-center">
      <UserX size={32} className="mx-auto text-muted" aria-hidden />
      <h1 className="mt-4 text-2xl font-extrabold text-ink">Member not found</h1>
      <p className="mt-2 text-muted">This profile does not exist or is no longer active.</p>
      <Link href="/members" className="btn btn-primary mt-6">Back to Member Directory</Link>
    </div>
  );
}
