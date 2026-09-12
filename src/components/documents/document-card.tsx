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
        "flex flex-col rounded-md border border-hairline bg-cream p-6",
        !available && "opacity-70"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="rounded-sm bg-panel px-2 py-1 text-caption font-medium text-ink-muted">
          {doc.category}
        </span>
        <span className="text-ui text-ink-muted">
          {fileType} · {doc.fileSize}
        </span>
      </div>

      <h3 className="mt-4 line-clamp-2 text-h4 font-semibold text-ink">
        {doc.title}
      </h3>
      <p className="mt-2 line-clamp-3 text-ui text-ink">{doc.description}</p>

      <p className="mt-4 text-caption text-ink-muted">
        Updated {formatDate(doc.updated)}
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        {available ? (
          <>
            <a
              href={doc.file}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-green px-4 py-2.5 text-ui font-medium text-on-green transition-colors hover:bg-green-hover"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              View
            </a>
            <a
              href={doc.file}
              download
              className="inline-flex items-center gap-2 rounded-lg border border-hairline-strong bg-cream px-4 py-2.5 text-ui font-medium text-ink transition-colors hover:bg-panel"
            >
              <Download className="size-4" aria-hidden="true" />
              Download
            </a>
          </>
        ) : (
          <span className="text-ui font-medium text-ink-muted">
            File not added yet.
          </span>
        )}
      </div>
    </article>
  );
}
