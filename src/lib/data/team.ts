export type TeamMember = {
  id: number; // 1 to 6. This sets the display order.
  name: string;
  role: string; // Example: "Reservoir physics and thermal modelling"
  description: string; // One line. Maximum 90 characters.
  photo: string; // Example: "/team/1.jpg"
  linkedin?: string;
  instagram?: string;
};

// Placeholder names. Replace each name, role, and link before launch.
// Keep the id values 1 to 6. The id sets the display order.
export const team: TeamMember[] = [
  {
    id: 1,
    name: "Member One",
    role: "Reservoir physics and thermal modelling",
    description: "Builds the cooling model and the viscosity curve for the well.",
    photo: "/team/1.jpg",
    linkedin: "https://www.linkedin.com/",
    instagram: "https://www.instagram.com/",
  },
  {
    id: 2,
    name: "Member Two",
    role: "Machine learning and model correction",
    description: "Trains the models that correct the error between physics and real data.",
    photo: "/team/2.jpg",
    linkedin: "https://www.linkedin.com/",
  },
  {
    id: 3,
    name: "Member Three",
    role: "Backend and system integration",
    description: "Runs the twin as a service and moves sensor data through it.",
    photo: "/team/3.jpg",
    linkedin: "https://www.linkedin.com/",
    instagram: "https://www.instagram.com/",
  },
  {
    id: 4,
    name: "Member Four",
    role: "Frontend and data visualisation",
    description: "Builds the operator view and the charts that explain each decision.",
    photo: "/team/4.jpg",
    linkedin: "https://www.linkedin.com/",
  },
  {
    id: 5,
    name: "Member Five",
    role: "Data engineering and sensor pipelines",
    description: "Cleans the load, pressure, and steam data before the model reads it.",
    photo: "/team/5.jpg",
    linkedin: "https://www.linkedin.com/",
    instagram: "https://www.instagram.com/",
  },
  {
    id: 6,
    name: "Member Six",
    role: "Hardware interface and documentation",
    description: "Connects the pump drive and keeps the technical documents current.",
    photo: "/team/6.jpg",
    linkedin: "https://www.linkedin.com/",
  },
];
