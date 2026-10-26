import type { Metadata } from "next";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata: Metadata = {
  title: { default: "CFA Admin", template: "%s | CFA Admin" },
  description: "CFA Pakistan Admin Panel",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-gray-950 flex">
      <AdminSidebar />
      <div className="flex-1 min-w-0 flex flex-col min-h-dvh lg:ml-64">
        <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-[4.5rem] sm:pt-20 lg:pt-6 pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
