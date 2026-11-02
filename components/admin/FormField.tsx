export const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-base sm:text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 disabled:opacity-60 transition";

export function Field({
  label, required, hint, children,
}: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-gray-500 text-[11px] mt-1.5 leading-relaxed">{hint}</p>}
    </div>
  );
}

export function Panel({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{title}</p>
      {description && <p className="text-gray-500 text-sm mt-1">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Feedback({ error, success }: { error?: string; success?: string }) {
  return (
    <>
      {error && (
        <div role="alert" className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div role="status" className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl px-4 py-3 text-sm">
          {success}
        </div>
      )}
    </>
  );
}

export const primaryBtn =
  "inline-flex items-center justify-center gap-2 min-h-11 px-5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition";
export const secondaryBtn =
  "inline-flex items-center justify-center gap-2 min-h-11 px-5 rounded-xl bg-gray-800 border border-gray-700 text-gray-300 text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 transition";
