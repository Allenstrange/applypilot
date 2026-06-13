export default function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{title}</h1>
      {subtitle ? <p className="text-slate-500 mt-1 dark:text-slate-400">{subtitle}</p> : null}
    </div>
  );
}
