import type { Profile, TemplateId } from "@/lib/types";
import ResumePreview from "@/components/ResumePreview";

// A4 at 96dpi. We render the real ResumePreview at full page width and scale it
// down, so a thumbnail is always a faithful mini of the actual template/PDF.
const PAGE_W = 794;
const PAGE_RATIO = 1123 / 794; // height / width

export default function TemplateThumbnail({
  profile,
  templateId,
  width = 240,
  className = "",
}: {
  profile: Profile;
  templateId: TemplateId;
  width?: number;
  className?: string;
}) {
  const scale = width / PAGE_W;
  return (
    <div
      className={`overflow-hidden bg-white ${className}`}
      style={{ width, height: width * PAGE_RATIO }}
      aria-hidden
    >
      <div
        style={{
          width: PAGE_W,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          pointerEvents: "none",
        }}
      >
        <ResumePreview profile={profile} templateId={templateId} />
      </div>
    </div>
  );
}
