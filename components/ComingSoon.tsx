import PageHeader from "@/components/PageHeader";

export default function ComingSoon({
  title,
  subtitle,
  phase,
}: {
  title: string;
  subtitle: string;
  phase: string;
}) {
  return (
    <div className="p-8">
      <PageHeader title={title} subtitle={subtitle} />
      <div className="card rounded-xl p-12 text-center text-gray-500">
        <div className="text-sm">
          This section is being ported from the legacy app and lands in {phase}.
        </div>
      </div>
    </div>
  );
}
