export default function SectionHeading({
  title,
  subtitle,
  align = "center",
}: {
  title: string;
  subtitle?: string;
  align?: "center" | "left";
}) {
  const wrap =
    align === "center" ? "text-center max-w-2xl mx-auto" : "text-left max-w-2xl";
  return (
    <div className={wrap}>
      <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight dark:text-slate-100 text-balance">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-3 text-slate-600 dark:text-slate-300 text-pretty">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
