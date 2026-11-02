import Link from "next/link";
import { ArrowRight, HelpCircle } from "lucide-react";
import { Container } from "@/components/common/Container";

/**
 * QuizBandSection — "Confused hain kaunsa plant lein?" (blueprint D1.12).
 * Gives the existing Hinglish hook its destination: the /plant-finder quiz
 * (route ships separately; this band links to it).
 */
export function QuizBandSection() {
  return (
    <section className="section-padding bg-ivory" aria-label="Plant finder quiz">
      <Container>
        <div className="relative overflow-hidden rounded-[28px] bg-pine px-8 py-12 md:p-16 text-center">
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
            style={{
              background:
                "radial-gradient(50% 90% at 50% 110%, rgba(198,161,91,0.22) 0%, transparent 60%)",
            }}
          />
          <div className="relative max-w-2xl mx-auto">
            <span className="inline-flex size-14 items-center justify-center rounded-full bg-brass/15 border border-brass/30 text-brass mb-5">
              <HelpCircle className="size-7" aria-hidden="true" />
            </span>
            <h2 className="font-display text-ivory text-3xl md:text-5xl leading-tight">
              Confused hain kaunsa plant lein?
            </h2>
            <p className="mt-3 text-ivory/75 text-lg">
              5 sawaal, 1 minute — aapke ghar ki roshni, experience aur pets ke hisaab se plants.
            </p>
            <Link
              href="/plant-finder"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-brass px-8 py-4 text-base font-semibold text-pine-ink transition-all hover:bg-ivory hover:-translate-y-0.5 min-h-[52px]"
            >
              Take the quiz
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
