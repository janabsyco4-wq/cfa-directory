export default function ResetLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-gray-950">
      {children}
    </div>
  );
}
