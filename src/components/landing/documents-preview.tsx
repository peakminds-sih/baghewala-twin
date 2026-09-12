import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section, SectionHeading } from "@/components/site/section";
import { DocumentCard } from "@/components/documents/document-card";
import { documents } from "@/lib/data/documents";
import { publicFileExists } from "@/lib/assets";

export function DocumentsPreview() {
  const preview = [...documents].sort((a, b) => a.id - b.id).slice(0, 3);

  return (
    <Section surface="soft">
      <SectionHeading title="Project documentation" />

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {preview.map((doc) => (
          <DocumentCard key={doc.id} doc={doc} available={publicFileExists(doc.file)} />
        ))}
      </div>

      <Link href="/documents" className="mt-8 inline-flex items-center gap-2 rounded-sm text-ui font-medium text-green">
        View all documents
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </Section>
  );
}
