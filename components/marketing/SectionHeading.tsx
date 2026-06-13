export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <div className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">
        {eyebrow}
      </div>
      <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
        {title}
      </h2>
      {subtitle ? <p className="mt-3 text-slate-600">{subtitle}</p> : null}
    </div>
  );
}
