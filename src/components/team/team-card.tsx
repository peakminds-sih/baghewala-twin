import type { TeamMember } from "@/lib/data/team";
import { TeamPhoto } from "./team-photo";
import { LinkedInIcon, InstagramIcon } from "./social-icons";

// Full team card for /team.
// Large / medium screens: photo on top, text below.
// Small screens: 88px square photo on the left, text on the right.
export function TeamCard({
  member,
  available,
}: {
  member: TeamMember;
  available: boolean;
}) {
  return (
    <article className="flex flex-row gap-4 rounded-md border border-hairline bg-cream p-5 sm:flex-col sm:gap-5">
      <TeamPhoto
        member={member}
        available={available}
        className="size-[88px] shrink-0 text-lg sm:aspect-square sm:size-auto sm:w-full sm:text-3xl"
      />
      <div className="min-w-0">
        <h3 className="text-h4 font-semibold text-ink">{member.name}</h3>
        <p className="mt-1 text-ui text-ink">{member.role}</p>
        <p className="mt-2 text-caption text-ink-muted">{member.description}</p>

        {(member.linkedin || member.instagram) && (
          <div className="mt-4 flex gap-2">
            {member.linkedin && (
              <a
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${member.name} on LinkedIn`}
                className="flex size-9 items-center justify-center rounded-full border border-hairline text-ink-muted transition-colors hover:bg-panel"
              >
                <LinkedInIcon className="size-4" />
              </a>
            )}
            {member.instagram && (
              <a
                href={member.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${member.name} on Instagram`}
                className="flex size-9 items-center justify-center rounded-full border border-hairline text-ink-muted transition-colors hover:bg-panel"
              >
                <InstagramIcon className="size-4" />
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
