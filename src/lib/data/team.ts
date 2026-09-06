export type TeamMember = {
  id: number; // 1 to 7. This sets the display order.
  name: string;
  role: string; // Example: "Team Leader"
  description: string; // One line. Maximum 90 characters.
  photo: string; // Example: "/team/Pratham.jpeg"
  linkedin?: string;
  instagram?: string;
};

// Photos live in /public/team, named after the member.
// A missing photo falls back to initials. See team-photo.tsx.
// Keep the id values 1 to 7. The id sets the display order.
export const team: TeamMember[] = [
  {
    id: 1,
    name: "Pratham Jadhav",
    role: "Team Leader",
    description: "Led the team and ran the research for the ML development work.",
    photo: "/team/Pratham.jpeg",
    linkedin: "https://www.linkedin.com/in/jadhavprathammm/",
    instagram: "https://www.instagram.com/jadhavprathammm/",
  },
  {
    id: 2,
    name: "Shreyas Date",
    role: "Developer",
    description: "Ran research and built the project website.",
    photo: "/team/Shreyas.jpeg",
    linkedin: "https://www.linkedin.com/in/shreyas-date/",
    instagram: "https://www.instagram.com/shre.yash_date/",
  },
  {
    id: 3,
    name: "Vinit Limkar",
    role: "AIML Developer",
    description: "Works as an ML developer and researcher with the team.",
    photo: "/team/Vinit.jpeg",
    linkedin: "https://www.linkedin.com/in/vinit-limkar-b7a57a2a5",
    instagram: "https://www.instagram.com/vinitlimkar6527/",
  },
  {
    id: 4,
    name: "Nidhee Rajesh Fukte",
    role: "UI/UX Designer",
    description: "Works as a UI/UX designer with the team.",
    photo: "/team/Nidhi.jpeg",
    linkedin: "https://www.linkedin.com/in/nidhee-fukte-5a962033a",
    instagram: "https://www.instagram.com/nidheeeee_07",
  },
  {
    id: 5,
    name: "Sumit Sanjay Mate",
    role: "AIML Developer",
    description: "Works as an ML developer and researcher with the team.",
    photo: "/team/Sumit.jpeg",
    linkedin: "https://www.linkedin.com/in/sumit-mate-a2510232b",
    instagram: "https://www.instagram.com/sumitmate07",
  },
  {
    id: 6,
    name: "Chitrangda Singh Parmar",
    role: "Data Analyst",
    description: "Verified and corrected all team and project information.",
    photo: "/team/Chitra.jpeg",
    linkedin: "https://www.linkedin.com/in/chitrangda-singh-parmar-7288542a0",
    instagram: "https://www.instagram.com/chitraa.s.parmar",
  },
  {
    id: 7,
    name: "Sarah Khambatta",
    role: "Mentor",
    description: "Mentored the team through the process and set the overall direction.",
    photo: "/team/Sarah.jpeg",
    linkedin: "https://www.linkedin.com/in/sarah-khambatta-468507259/",
    instagram: "https://www.instagram.com/sarahzk_47/",
  },
];
