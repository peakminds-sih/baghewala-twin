import type { Metadata } from "next";
import { Container } from "@/components/site/container";
import { TeamCard } from "@/components/team/team-card";
import { team } from "@/lib/data/team";
import { publicFileExists } from "@/lib/assets";

export const metadata: Metadata = {
  title: "Team",
  description:
    "The people building the Baghewala digital twin: reservoir physics, machine learning, backend, frontend, data engineering, and hardware.",
};

export default function TeamPage() {
  const members = [...team].sort((a, b) => a.id - b.id);

  return (
    <div className="bg-canvas pt-28 pb-16 md:pt-36 md:pb-24">
      <Container>
        <h1 className="text-[28px] leading-tight font-normal text-ink md:text-[32px]">
          The team
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] text-body-text">
          Six people across reservoir physics, machine learning, software, data,
          and hardware. Each one owns a part of the model end to end.
        </p>

        <ul className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <li key={member.id}>
              <TeamCard
                member={member}
                available={publicFileExists(member.photo)}
              />
            </li>
          ))}
        </ul>
      </Container>
    </div>
  );
}
