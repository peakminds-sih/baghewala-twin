export type ProjectDocument = {
  id: number; // 1 to 4. This sets the display order.
  slug: string; // Example: "field-guide"
  title: string;
  description: string; // Two lines maximum.
  category: "Background" | "Technical reference" | "Deep research" | "Presentation";
  file: string; // Example: "/documents/field-guide.pdf"
  fileSize: string; // Example: "85 KB"
  updated: string; // Format: "2026-09-05"
};

// The id sets the display order. Update fileSize after you add each PDF.
export const documents: ProjectDocument[] = [
  {
    id: 1,
    slug: "field-guide",
    title: "Baghewala field guide",
    description:
      "The problem, written for a reader with no oil and gas background. Why the oil will not flow, why steam fades, and why the pump breaks.",
    category: "Background",
    file: "/documents/field-guide.pdf",
    fileSize: "613 KB",
    updated: "2026-09-12",
  },
  {
    id: 2,
    slug: "technical-reference",
    title: "Merged technical reference",
    description:
      "The physics of the twin in one place. The governing equations, every parameter with its unit and source, and the objective function.",
    category: "Technical reference",
    file: "/documents/technical-reference.pdf",
    fileSize: "1.1 MB",
    updated: "2026-09-12",
  },
  {
    id: 3,
    slug: "research",
    title: "Full research document",
    description:
      "The complete working research behind the twin, 350 pages with a dated errata page at the end. Model derivations, data sources, assumptions, and the open questions.",
    category: "Deep research",
    file: "/documents/research.pdf",
    fileSize: "5.7 MB",
    updated: "2026-09-12",
  },
  {
  id: 4,
  slug: "variable-relationships",
  title: "Variables and equations",
  description:
    "Every variable in the problem with its unit, range and source. The model equations, each worked through with real Baghewala numbers, plus plain-language explanations and the open calibration items.",
  category: "Technical reference",
  file: "/documents/variable-relationships.pdf",
  fileSize: "253 KB",
  updated: "2026-09-12",
},
  {
    id: 5,
    slug: "presentation",
    title: "Project presentation",
    description:
      "The slide deck for the Smart India Hackathon round. The problem, the solution, and the expected change, in brief.",
    category: "Presentation",
    file: "/documents/presentation.pdf",
    fileSize: "TBD",
    updated: "2026-09-05",
  },
];
