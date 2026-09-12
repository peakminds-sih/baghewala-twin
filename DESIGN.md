# DESIGN.md — Baghewala digital twin

Working baseline, 12 September 2026. Change it when the product needs it, and
record the change here.

## 1. Principles

- **Restrained.** Cream ground, ink text, one dark green and one gold. No
  gradients, no glass, no decorative shadows. The quality comes from spacing,
  type and precise alignment.
- **Colour carries meaning.** Each of the three colours has one job (section 2).
  Do not use a colour only because it looks good in a place.
- **Numbers first.** This is an engineering tool. Values, units and sources are
  the content. Show a number with its unit and, when it is inferred, say so.
- **Never colour alone.** Every colour signal also has a word, an icon, a line
  style or a position. A reader who cannot see colour must get the same
  information.
- **Motion explains change.** Animate only to show what changed and where it
  went (section 7). Never animate for decoration.

## 2. Colour

### 2.1 The three brand colours

| Token | Hex | Job |
|---|---|---|
| `green` | `#0E4F47` | Structure and the model. Headings, primary buttons, active controls, selected states, and the main series in a chart (a model output). |
| `gold` | `#C08319` | Attention. The operator's setting, limits, thresholds, the current-day marker, warnings, and tier D (assumed) values. |
| `ink` | `#191B1E` | Text and facts. Body text, axes, and measured values (what a sensor reads). |

The ground is `cream` `#FBFAF7`. It is a surface, not a signal.

### 2.2 Neutrals and tints (derived, light mode)

All neutrals come from ink on cream. Do not add greys from outside this list.

| Token | Hex | Use |
|---|---|---|
| `cream` | `#FBFAF7` | Page background |
| `panel` | `#F4F2EC` | Panels, input wells, table header rows |
| `panel-raised` | `#FFFFFF` | Popovers, tooltips, the one raised card on a page |
| `hairline` | `#E3E0D8` | 1 px borders and dividers, chart grid lines |
| `hairline-strong` | `#C9C5BA` | Input borders, slider tracks |
| `ink-muted` | `#5A5D60` | Secondary text, captions, axis labels (6.4 : 1 on cream) |
| `ink-faint` | `#8A8C8E` | Disabled text, placeholder only. Never for real content. |
| `green-hover` | `#0A3F39` | Primary button hover and press |
| `green-tint` | `#E3ECEA` | Selected rows, active tab ground, soak phase band |
| `gold-text` | `#946410` | Gold used as small text or thin icons (4.9 : 1 on cream) |
| `gold-tint` | `#F6EBD6` | Warning callout ground, injection phase band, floating-risk region |

### 2.3 Contrast rules

- `ink` on `cream` is 16.6 : 1. `green` on `cream` is 9.0 : 1. Both are safe for
  any text size.
- `gold` on `cream` is 3.1 : 1. Use it for lines, fills, markers, focus rings
  and large text (24 px and larger) only. For small gold text use `gold-text`.
- Text on a `green` fill is `cream`. Text on a `gold` fill is `ink`.

### 2.4 Status

There is no red and no traffic-light scale. Status uses gold plus a word:

| State | Signal |
|---|---|
| Normal | No marker. |
| Caution (risk 0.8 to 1.0) | `gold-text` word "Caution", gold outline on the value. |
| Critical (risk above 1.0, rod floating) | Gold fill, ink text "Rod floating", warning icon. |
| Information | Green outline, green icon. |

## 3. Typography

### 3.1 Families (free, Google Fonts)

| Role | Family | Loaded as |
|---|---|---|
| Display and headings | **Source Serif 4** (variable, optical sizes) | `next/font/google`, `--font-serif` |
| Interface, body, numbers | **Inter** (variable) | `next/font/google`, `--font-sans` |
| Code, CSV samples | **Geist Mono** (already loaded) | `--font-mono` |

- Equation variables are set in Source Serif 4 italic (for example *T*, *μ*,
  *r*<sub>h</sub>). Operators and digits in equations stay upright.
- All numbers in tables, readouts and chart ticks use Inter with
  `font-variant-numeric: tabular-nums` so digits line up and do not jump when
  they change.
- Units follow the number after a thin space, in `ink-muted`: `123.6 °C`.

### 3.2 Scale (ratio 1.25, base 16 px)

| Token | Size / line height | Family, weight | Use |
|---|---|---|---|
| `display` | 48 / 52 | Serif 500, −0.01 em | Page title, once per page |
| `h1` | 39 / 44 | Serif 500 | Section title |
| `h2` | 31 / 38 | Serif 500 | Sub-section title |
| `h3` | 25 / 32 | Serif 500 | Panel title, equation name |
| `h4` | 20 / 28 | Sans 600 | Group label in a panel |
| `body-lg` | 18 / 28 | Sans 400 | Lead paragraph |
| `body` | 16 / 26 | Sans 400 | Running text |
| `ui` | 14 / 20 | Sans 500 | Controls, table cells, tooltips |
| `caption` | 12 / 16 | Sans 500, +0.02 em | Axis labels, units, source tags |
| `overline` | 11 / 16 | Sans 600, +0.08 em, upper case | Section kickers, tag text |
| `readout` | 32 / 36 | Sans 500, tabular | Live values in readout tiles |

- Headings are `green`. Body is `ink`. Secondary text is `ink-muted`.
- Keep running text to 68 characters wide (`max-width: 68ch`).
- Weight is never above 600. Emphasis comes from size and colour.

## 4. Space and layout

### 4.1 Spacing scale (4 px base)

| Token | px | Typical use |
|---|---|---|
| `1` | 4 | Icon to label |
| `2` | 8 | Inside tags, between a value and its unit row |
| `3` | 12 | Between related controls |
| `4` | 16 | Panel padding (compact), gap in control groups |
| `6` | 24 | Panel padding (default), gap between panels |
| `8` | 32 | Between groups inside a section |
| `12` | 48 | Between sections on a tool page |
| `16` | 64 | Page top margin |
| `24` | 96 | Between major bands on a reading page |

These map to the Tailwind default scale (`p-4` is 16 px), so use the Tailwind
classes directly.

### 4.2 Grid

- Content width 1200 px maximum, 24 px side gutters (16 px below 640 px).
- The simulator uses two columns at 1024 px and wider: controls 320 px fixed,
  charts fill the rest. Below 1024 px the controls stack above the charts.
- Charts sit in a two-column grid of small multiples at 1024 px and wider, one
  column below.

### 4.3 Shape

- Radius: `4px` for inputs, buttons and tags. `8px` for panels and cards.
  Nothing is fully rounded except slider thumbs and status dots.
- Borders: 1 px `hairline`. Inputs use `hairline-strong`.
- Elevation: none on the page. Only popovers and tooltips have a shadow:
  `0 4px 16px rgb(25 27 30 / 0.08)`.

## 5. Components

### 5.1 Buttons

| Variant | Look | Use |
|---|---|---|
| Primary | `green` fill, `cream` text, 36 px high, 16 px side padding | One per view. "Export CSV", "Run". |
| Secondary | `cream` fill, `ink` text, `hairline-strong` border | Other actions |
| Quiet | No fill or border, `green` text, underline on hover | Inline actions, "Reset to default" |

Hover darkens the fill (`green-hover`) or the border (`ink-muted`). Press
scales to 0.98 (section 7). Disabled uses `ink-faint` text and no fill.

### 5.2 Focus

Every interactive element has a visible focus ring: 2 px `gold`, 2 px offset.
Use `:focus-visible`, not `:focus`.

### 5.3 Sliders (operator inputs)

- Layout: label (`ui`, `ink`) on the left, the value on the right in a small
  editable number field, unit after it. The slider sits on the next row.
- Track: 4 px, `hairline-strong`. The filled part is `green`.
- Thumb: 16 px circle, `cream` fill, 2 px `green` border. It grows to 20 px while
  dragged.
- Under the slider: the range ends in `caption`, `ink-muted` (for example
  `500` and `4,000 m³`), and a tier tag (5.7).
- If part of the range is outside field experience (for example steam quality
  above 0.70), mark that part of the track with a `gold-tint` band and say so
  in the caption.
- Arrow keys step by the input's step. Shift plus arrow steps ten times.

### 5.4 Number fields and selects

- 36 px high, `panel` ground, `hairline-strong` border, radius 4 px, tabular
  numbers, right-aligned.
- An invalid value gets a gold border and a `gold-text` message below it. Do
  not clear the field.

### 5.5 Segmented control and tabs

- A row of equal buttons in one `hairline-strong` frame. The active segment has
  a `green` fill and `cream` text. The active indicator slides between segments
  (section 7).
- Tabs are text with a 2 px `green` underline on the active tab.

### 5.6 Day scrubber (time control)

- A full-width track under the charts, with the CSS phases shown as bands:
  injection in `gold-tint`, soak in `green-tint`, production with no fill.
  Each band has a text label.
- The current day is a 2 px `gold` vertical line through every chart, with the
  day number in a tag above the scrubber: `Day 42 · production day 30`.
- Controls: play/pause, step back, step forward, and a speed segment
  (1×, 5×, 20× days per second). Space toggles play. Left and right arrows
  step one day.

### 5.7 Tags

Small labels, `overline` style, radius 4 px, 2 px by 6 px padding.

| Tag | Look |
|---|---|
| `Measured` | `ink` outline, `ink` text |
| `Inferred` | `green` outline, `green` text |
| Tier A (problem statement) | `green` fill, `cream` text |
| Tier B (Oil India / SPE) | `green` outline, `green` text |
| Tier D (assumption) | `gold` outline, `gold-text` text |
| std (physical constant) | `hairline-strong` outline, `ink-muted` text |

### 5.8 Panels

- `panel` ground, 1 px `hairline`, radius 8 px, 24 px padding.
- Header: `h3` title on the left, tags or a quiet action on the right, 16 px
  gap to the content. No divider line unless the panel scrolls.
- Do not nest panels. Inside a panel, group with space and `h4` labels.

### 5.9 Readout tiles

- One value per tile: `caption` label, `readout` value with unit, and a
  `Measured` or `Inferred` tag.
- A second line in `caption` names the source: `Eq 2 · T(t) = Tᵢ + (Tₛ − Tᵢ)e^(−t/τ)`.
- Values update at once while inputs move (section 7).

### 5.10 Equation cards

- Title in `h3`, the formula on its own line in Source Serif 4 at 20 px, then a
  table of the variables: symbol, meaning, value now, unit, tier tag.
- Inputs to the equation are listed above the formula and outputs below it,
  with a small arrow, so the chain between equations is visible.
- Hovering a variable highlights the same variable in the other cards and
  charts (`green-tint` ground).

### 5.11 Tables

- `ui` text, tabular numbers, numbers right-aligned, text left-aligned.
- Header row on `panel` in `caption` style, `ink-muted`.
- Rows divided by 1 px `hairline`. No zebra stripes. Selected row is
  `green-tint`.

### 5.12 Callouts

- Note: `green-tint` ground, 2 px `green` left border.
- Warning or open question: `gold-tint` ground, 2 px `gold` left border.

## 6. Charts

### 6.1 Frame

- No chart border. Plot on the `cream` or `panel` ground.
- Grid: horizontal lines only, 1 px `hairline`. No vertical grid lines except
  phase boundaries.
- Axes: `caption` ticks in `ink-muted`, tabular numbers. The axis title names
  the variable and unit: `Viscosity (cP, log scale)`.
- Use a log scale for viscosity. Say "log scale" in the axis title.
- The chart title is a question or a fact in `h4`, not a variable name only:
  "Temperature falls back to the reservoir value".

### 6.2 Series encoding

Use at most three series in one chart. For more, use small multiples.

| Series role | Colour | Line | Weight |
|---|---|---|---|
| Main model output (inferred) | `green` | solid | 2 px |
| Measured signal | `ink` | solid, 3 px dot markers at each data point | 1.5 px |
| Operator setting or limit | `gold` | dashed 6 / 4 | 1.5 px |
| Comparison or second output | `ink` | dotted 2 / 3 | 1.5 px |

Rules:

- Only green, gold and ink carry series. Checked with the dataviz palette
  validator: in both themes every pair passes colour-blind separation
  (ΔE ≥ 14) and normal-vision separation (ΔE ≥ 16). Grey fails against
  green, so grey is never a series colour. The brand green and ink sit darker
  than the validator's lightness band; line style and labels carry the
  difference.
- Each series is separated by two channels, colour and line style. It must
  still read in grey scale.
- Show a legend for two or more series, and also label each series at its
  line end. Label text uses text colours (`ink-muted`), keyed by a short line
  in the series colour; text never takes the series colour. If end labels
  would collide, drop them and keep the legend.
- A region where the operator's setting passes a limit (for example N above
  N<sub>max</sub>) is hatched in gold at 45° and labelled "Floating risk", so
  it does not read as the injection band.
- An uncertainty range (for example B from 3.2 to 3.8) is a `green` fill at
  12 % opacity behind the main line, labelled with its range.
- Several cases of the same variable (for example SOR at five steam volumes)
  use one hue in steps: `green` at 100 %, 70 %, 45 % and 25 % opacity, with the
  highlighted case at 100 % and labelled.
- CSS phase bands (injection `gold-tint`, soak `green-tint`) sit behind the
  data and match the day scrubber.

### 6.3 Interaction

- A shared crosshair: hovering one chart shows the same day on all charts.
- The tooltip is `panel-raised`, `ui` text, one line per series with its
  colour key, value and unit, and the day.
- The current-day line (5.6) is `gold` and sits above the data.

## 7. Motion

Library: **Motion for React** (`motion` package, import from `motion/react`).

### 7.1 Timings

| Token | Duration | Use |
|---|---|---|
| `instant` | 100 ms | Button press, hover colour |
| `quick` | 160 ms | Tooltips, highlights |
| `base` | 240 ms | Segment indicator, view change, marker jump, status fill |
| `draw` | 900 ms | First draw of a chart, once per page load |

Interface motion stays under 300 ms. Only the first draw is longer, because
it explains the chart once.

### 7.2 Easing

| Token | Curve | Use |
|---|---|---|
| `ease-out` | `cubic-bezier(0.23, 1, 0.32, 1)` | Entering, settling, colour. The default. |
| `ease-in-out` | `cubic-bezier(0.77, 0, 0.175, 1)` | Moving from one place to another on screen |
| `spring-ui` | `{ type: "spring", visualDuration: 0.24, bounce: 0.1 }` | Segment indicator |

Never use ease-in: it delays the moment the reader is watching. No bounce
above 0.1; nothing overshoots.

### 7.3 What moves

- **Input changes do not animate.** Dragging a slider is direct
  manipulation: charts, readouts and the risk region follow the hand at once.
  A tween would lag behind it.
- **First draw:** each chart reveals from left to right over `draw`, once per
  page load.
- **Day scrubber:** during play the current-day line follows the day with no
  easing. When the user picks a day, the line moves there over `base` with
  `ease-in-out`.
- **Critical state:** when risk passes 1.0, the tile's gold fill fades in over
  `base`. No pulsing, shaking or looping.
- **Segment indicator:** slides to the chosen segment with `spring-ui`.
- **Equation links:** a highlighted variable fades in over `quick`.
- **Research views:** switching views cross-fades over `base`. Moving to the
  next or previous relationship slides 8 px in the direction of travel.
- **Press:** buttons scale to 0.98 over `instant`.

Keyboard shortcuts (space, arrow keys on the scrubber) add no animation of
their own.

### 7.4 Reduced motion

Wrap the app in `<MotionConfig reducedMotion="user">`. With reduced motion on,
transforms and layout animations are skipped and only opacity and colour
changes remain. The first draw and the marker jump are skipped. Playback of
the day scrubber still works, because it is content, not decoration.

## 8. Dark mode

Dark mode follows the system setting by default. A toggle in the header
overrides it and sets the `.dark` class on `<html>`. Tokens change; roles do
not.

| Token | Light | Dark |
|---|---|---|
| `cream` (ground) | `#FBFAF7` | `#121614` |
| `panel` | `#F4F2EC` | `#1A1F1D` |
| `panel-raised` | `#FFFFFF` | `#222826` |
| `hairline` | `#E3E0D8` | `#2C3331` |
| `hairline-strong` | `#C9C5BA` | `#414947` |
| `ink` (text) | `#191B1E` | `#ECE8DF` |
| `ink-muted` | `#5A5D60` | `#A7A59E` |
| `ink-faint` | `#8A8C8E` | `#6E716F` |
| `green` | `#0E4F47` | `#7DB8AC` |
| `green-hover` | `#0A3F39` | `#95C7BC` |
| `green-tint` | `#E3ECEA` | `#1C2E2A` |
| `gold` | `#C08319` | `#D69A2E` |
| `gold-text` | `#946410` | `#E0AE52` |
| `gold-tint` | `#F6EBD6` | `#33291A` |

- In dark mode, green and gold are lighter so they keep contrast on the dark
  ground (green 8.1 : 1, gold 7.4 : 1). Text on a `green` or `gold` fill
  becomes `#121614`.
- Charts keep the same encoding. The measured series uses the dark `ink`
  (light text colour).
- The tooltip shadow becomes `0 4px 16px rgb(0 0 0 / 0.4)`.

## 9. Writing on screen

- Short sentences, common words, one idea per sentence (ASD-STE100).
- Use the active voice and the imperative for instructions: "Set the steam
  volume."
- Say what a value is before what it means: "Safe pump speed: 6.4 SPM. The
  set speed is 6 SPM, so the rods still fall freely."
- Always give the unit. Always say when a value is inferred.
- Name the source of every equation and constant with its tier.

## 10. Implementation

- Tokens live in `src/app/globals.css`: brand and neutral colours as CSS
  variables on `:root` and `.dark`, mapped to Tailwind with `@theme inline`
  (`bg-cream`, `text-green`, `border-hairline` and so on).
- Chart code reads colours from the same CSS variables, not from hex values in
  components.
- Motion tokens live in one file, `src/lib/motion.ts`, and every component
  imports them from there.
- The older Airtable-style token names in `globals.css` are aliases onto the
  new tokens while the older pages migrate. Remove each one once nothing uses
  it.
