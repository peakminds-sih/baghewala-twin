import { Container } from "@/components/site/container";
import { ButtonLink } from "@/components/site/button-link";

// The only centered section on the page. Fixed green fill: on-green text
// keeps it readable when green turns light in dark mode (never white).
export function FinalCta() {
  return (
    <section className="bg-green py-16 text-on-green md:py-24">
      <Container className="flex flex-col items-center text-center">
        <h2 className="max-w-2xl font-serif text-h1 font-medium">
          Read the full technical documentation
        </h2>
        <p className="mt-4 max-w-xl text-body-lg text-on-green/80">
          A field guide, a physics reference, and the parameter tables. Written
          for a reader who has never worked in oil and gas.
        </p>
        <div className="mt-8">
          <ButtonLink href="/documents" variant="secondary">
            Read the documents
          </ButtonLink>
        </div>
        <p className="mt-6 text-caption text-on-green/60">
          SIH26120 · Oil India Limited
        </p>
      </Container>
    </section>
  );
}
