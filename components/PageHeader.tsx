export default function PageHeader({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
}) {
  return (
    <section className="bg-forest-deep text-white">
      <div className="container-site py-12 sm:py-16">
        <p className="animate-rise text-gold text-xs font-bold tracking-[0.18em] uppercase">{eyebrow}</p>
        <h1 className="animate-rise mt-3 text-3xl sm:text-[2.6rem] font-extrabold leading-tight max-w-3xl" style={{ animationDelay: "60ms" }}>
          {title}
        </h1>
        {intro && (
          <p className="animate-rise mt-4 max-w-2xl text-white/75 leading-relaxed" style={{ animationDelay: "120ms" }}>
            {intro}
          </p>
        )}
      </div>
    </section>
  );
}
