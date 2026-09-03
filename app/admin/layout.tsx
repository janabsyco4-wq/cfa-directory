import type { Metadata } from "next";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata: Metadata = {
  title: { default: "CFA Admin", template: "%s | CFA Admin" },
  description: "CFA Pakistan Admin Panel",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 flex">
      <AdminSidebar />
      {/* Main content — offset for sidebar */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-6">
          {children}
        </main>
      </div>
    </div>
  );
}
