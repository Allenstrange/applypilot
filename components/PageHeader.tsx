export default function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6">
      <h1 className="text-[22px] leading-7 font-semibold tracking-tight text-slate-900 dark:text-slate-100">
        {title}
      </h1>
      {subtitle ? (
        <p className="text-sm text-slate-500 mt-0.5 dark:text-slate-400">{subtitle}</p>
      ) : null}
    </div>
  );
}
