import { createCn } from "cn/config";

// Class merging that knows the DESIGN.md type scale. Without this, a custom
// size such as text-readout looks like a text colour and is dropped when a
// colour class (text-ink) follows it.
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [
        { text: ["display", "h1", "h2", "h3", "h4", "body-lg", "body", "ui", "caption", "overline", "readout"] },
      ],
    },
  },
});
