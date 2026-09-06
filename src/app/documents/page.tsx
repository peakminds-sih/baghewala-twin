import type { Metadata } from "next";
import { Container } from "@/components/site/container";
import { DocumentCard } from "@/components/documents/document-card";
import { documents } from "@/lib/data/documents";
import { publicFileExists } from "@/lib/assets";

export const metadata: Metadata = {
  title: "Documents",
  description:
    "The written record of the Baghewala digital twin: a field guide, a technical reference, the full research document, and the project presentation.",
};

export default function DocumentsPage() {
  const docs = [...documents].sort((a, b) => a.id - b.id);

  return (
    <div className="bg-canvas pt-28 pb-16 md:pt-36 md:pb-24">
      <Container>
        <h1 className="text-[28px] leading-tight font-normal text-ink md:text-[32px]">
          Documents
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] text-body-text">
          Every document is a static PDF. Open it in the browser, or download it.
          The field guide needs no oil and gas background.
        </p>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {docs.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              available={publicFileExists(doc.file)}
            />
          ))}
        </div>
      </Container>
    </div>
  );
}
