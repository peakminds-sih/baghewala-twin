import { Container } from "@/components/site/container";
import { ButtonLink } from "@/components/site/button-link";

// The only centered section on the page.
export function FinalCta() {
  return (
    <section className="bg-surface-dark py-16 text-white md:py-24">
      <Container className="flex flex-col items-center text-center">
        <h2 className="max-w-2xl text-[28px] leading-tight font-normal md:text-[32px]">
          Read the full technical documentation
        </h2>
        <p className="mt-4 max-w-xl text-[15px] text-white/80">
          A field guide, a physics reference, and the parameter tables. Written
          for a reader who has never worked in oil and gas.
        </p>
        <div className="mt-8">
          <ButtonLink href="/documents" variant="secondary">
            Read the documents
          </ButtonLink>
        </div>
        <p className="mt-6 text-[12px] text-white/60">
          SIH26120 · Oil India Limited
        </p>
      </Container>
    </section>
  );
}
