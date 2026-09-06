import { Download, ExternalLink } from "lucide-react";
import type { ProjectDocument } from "@/lib/data/documents";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

// One card, used on both the documents page and the landing-page preview.
// `available` is resolved on the server from the file in /public/documents.
export function DocumentCard({
  doc,
  available,
}: {
  doc: ProjectDocument;
  available: boolean;
}) {
  const fileType = doc.file.split(".").pop()?.toUpperCase() ?? "PDF";

  return (
    <article
      className={cn(
        "flex flex-col rounded-md border border-hairline bg-canvas p-6",
        !available && "opacity-70"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="rounded-sm bg-surface-soft px-2 py-1 text-[12px] font-medium tracking-[0.16px] text-muted-ink">
          {doc.category}
        </span>
        <span className="text-[13px] text-muted-ink">
          {fileType} · {doc.fileSize}
        </span>
      </div>

      <h3 className="mt-4 line-clamp-2 text-[18px] font-medium text-ink">
        {doc.title}
      </h3>
      <p className="mt-2 line-clamp-3 text-[14px] text-body-text">
        {doc.description}
      </p>

      <p className="mt-4 text-[13px] text-muted-ink">
        Updated {formatDate(doc.updated)}
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        {available ? (
          <>
            <a
              href={doc.file}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[14px] font-medium text-white outline-none transition-colors active:bg-[#0d1218] focus-visible:ring-2 focus-visible:ring-link focus-visible:ring-offset-2"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              View
            </a>
            <a
              href={doc.file}
              download
              className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-canvas px-4 py-2.5 text-[14px] font-medium text-ink outline-none transition-colors active:bg-surface-soft focus-visible:ring-2 focus-visible:ring-link focus-visible:ring-offset-2"
            >
              <Download className="size-4" aria-hidden="true" />
              Download
            </a>
          </>
        ) : (
          <span className="text-[13px] font-medium text-muted-ink">
            File not added yet.
          </span>
        )}
      </div>
    </article>
  );
}
