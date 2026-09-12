import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section, SectionHeading } from "@/components/site/section";
import { TeamPhoto } from "@/components/team/team-photo";
import { team } from "@/lib/data/team";
import { publicFileExists } from "@/lib/assets";

export function TeamPreview() {
  const members = [...team].sort((a, b) => a.id - b.id);

  return (
    <Section surface="canvas">
      <SectionHeading title="The team" />

      <ul className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-7">
        {members.map((member) => (
          <li key={member.id} className="flex flex-col items-center text-center">
            <TeamPhoto
              member={member}
              available={publicFileExists(member.photo)}
              shape="round"
              className="size-[72px] text-base"
            />
            <span className="mt-3 text-caption font-medium text-ink">{member.name}</span>
          </li>
        ))}
      </ul>

      <Link href="/team" className="mt-8 inline-flex items-center gap-2 rounded-sm text-ui font-medium text-green">
        Meet the team
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </Section>
  );
}
