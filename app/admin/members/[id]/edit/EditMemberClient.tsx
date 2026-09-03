"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import MemberForm, { MemberFormData } from "@/components/admin/MemberForm";

export default function EditMemberClient({ memberId }: { memberId: string }) {
  const [data, setData]       = useState<MemberFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    fetch(`/api/admin/members/${memberId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.member) {
          // Normalise joinedDate to yyyy-mm-dd for the date input
          const m = json.member;
          setData({
            ...m,
            fee: m.fee ?? 0,
            joinedDate: m.joinedDate
              ? new Date(m.joinedDate).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0],
          });
        } else {
          setError("Member not found.");
        }
      })
      .catch(() => setError("Failed to load member."))
      .finally(() => setLoading(false));
  }, [memberId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 gap-3 text-gray-500">
        <Loader2 size={20} className="animate-spin" />
        <span className="text-sm">Loading member...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm max-w-md mx-auto mt-10">
        {error}
      </div>
    );
  }

  return <MemberForm mode="edit" memberId={memberId} initialData={data ?? undefined} />;
}
