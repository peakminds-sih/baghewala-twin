import { Section, SectionHeading } from "@/components/site/section";

// The chart palette (DESIGN.md §6.2): only green, gold and ink carry a
// series. Green is the oil-rate branch (a model output). Gold is the
// pump-safety branch (the attention colour, tied to the floating-risk limit).
const NEUTRAL = "var(--hairline-strong)";
const INK = "var(--ink)";
const GREEN = "var(--green)";
const GOLD = "var(--gold)";

type BoxProps = {
  x: number;
  y: number;
  w: number;
  h: number;
  lines: string[];
  color?: string;
};

function Box({ x, y, w, h, lines, color = INK }: BoxProps) {
  const cx = x + w / 2;
  const startY = y + h / 2 - (lines.length - 1) * 7;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={6}
        fill="var(--panel-raised)"
        stroke={color}
        strokeWidth="1.5"
      />
      <text textAnchor="middle" fontSize="11.5" fill={INK}>
        {lines.map((l, i) => (
          <tspan key={l} x={cx} y={startY + i * 14} dominantBaseline="central">
            {l}
          </tspan>
        ))}
      </text>
    </g>
  );
}

// Mobile node — one bordered box in the vertical chain.
function Node({
  children,
  color = "border-hairline-strong",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <div className={`rounded-sm border ${color} bg-cream px-4 py-2.5 text-center text-ui text-ink`}>
      {children}
    </div>
  );
}

function Arrow() {
  return <div className="text-center text-ui leading-none text-ink-muted">↓</div>;
}

export function TwoFailures() {
  return (
    <Section surface="cream">
      <SectionHeading title="Two failures, one cause" className="text-ink" />

      {/* Desktop diagram */}
      <div className="mt-12 hidden md:block">
        <svg
          viewBox="0 0 900 330"
          className="w-full"
          role="img"
          aria-label="Cause chain. Steam volume and quality set the heated zone, which sets temperature, which sets viscosity. Viscosity then splits into two branches. The oil-rate branch: mobility to productivity to inflow to oil rate. The pump-safety branch: rod damping to maximum safe pump speed. Both branches feed the steam-oil ratio."
        >
          <defs>
            {[
              ["arrow-neutral", NEUTRAL],
              ["arrow-green", GREEN],
              ["arrow-gold", GOLD],
            ].map(([id, color]) => (
              <marker
                key={id}
                id={id}
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M0,0 L10,5 L0,10 z" fill={color} />
              </marker>
            ))}
          </defs>

          {/* top chain */}
          <Box x={30} y={24} w={140} h={44} lines={["steam volume", "and quality"]} color={NEUTRAL} />
          <Box x={263} y={24} w={140} h={44} lines={["heated zone"]} color={NEUTRAL} />
          <Box x={496} y={24} w={140} h={44} lines={["temperature"]} color={NEUTRAL} />
          <Box x={729} y={24} w={140} h={44} lines={["viscosity"]} color={INK} />

          <line x1={170} y1={46} x2={261} y2={46} stroke={NEUTRAL} strokeWidth="1.5" markerEnd="url(#arrow-neutral)" />
          <line x1={403} y1={46} x2={494} y2={46} stroke={NEUTRAL} strokeWidth="1.5" markerEnd="url(#arrow-neutral)" />
          <line x1={636} y1={46} x2={727} y2={46} stroke={NEUTRAL} strokeWidth="1.5" markerEnd="url(#arrow-neutral)" />

          {/* split bus from viscosity */}
          <line x1={799} y1={68} x2={799} y2={92} stroke={NEUTRAL} strokeWidth="1.5" />
          <line x1={250} y1={92} x2={799} y2={92} stroke={NEUTRAL} strokeWidth="1.5" />
          <line x1={250} y1={92} x2={250} y2={110} stroke={GREEN} strokeWidth="1.5" markerEnd="url(#arrow-green)" />
          <line x1={660} y1={92} x2={660} y2={110} stroke={GOLD} strokeWidth="1.5" markerEnd="url(#arrow-gold)" />

          {/* left branch — oil rate */}
          <Box x={145} y={112} w={210} h={40} lines={["mobility → productivity"]} color={GREEN} />
          <line x1={250} y1={152} x2={250} y2={174} stroke={GREEN} strokeWidth="1.5" markerEnd="url(#arrow-green)" />
          <Box x={145} y={176} w={210} h={40} lines={["inflow → oil rate"]} color={GREEN} />

          {/* right branch — pump safety */}
          <Box x={555} y={112} w={210} h={40} lines={["rod damping"]} color={GOLD} />
          <line x1={660} y1={152} x2={660} y2={174} stroke={GOLD} strokeWidth="1.5" markerEnd="url(#arrow-gold)" />
          <Box x={555} y={176} w={210} h={40} lines={["maximum safe", "pump speed"]} color={GOLD} />

          {/* converge to SOR */}
          <line x1={250} y1={216} x2={250} y2={240} stroke={GREEN} strokeWidth="1.5" />
          <line x1={660} y1={216} x2={660} y2={240} stroke={GOLD} strokeWidth="1.5" />
          <line x1={250} y1={240} x2={660} y2={240} stroke={NEUTRAL} strokeWidth="1.5" />
          <line x1={455} y1={240} x2={455} y2={262} stroke={NEUTRAL} strokeWidth="1.5" markerEnd="url(#arrow-neutral)" />
          <Box x={345} y={264} w={220} h={44} lines={["steam-oil ratio (SOR)"]} color={INK} />
        </svg>

        <p className="mt-4 text-caption text-ink-muted">
          <span className="text-green">Green</span> is the oil-rate branch.{" "}
          <span className="text-gold-text">Gold</span> is the pump-safety branch.
        </p>
      </div>

      {/* Mobile vertical chain */}
      <div className="mt-10 flex flex-col gap-2 md:hidden">
        <Node>steam volume and quality</Node>
        <Arrow />
        <Node>heated zone</Node>
        <Arrow />
        <Node>temperature</Node>
        <Arrow />
        <Node color="border-ink">viscosity</Node>
        <Arrow />
        <div className="flex flex-col gap-2 border-l-2 border-hairline pl-4">
          <div className="border-l-2 border-green pl-3">
            <p className="mb-1 text-caption font-medium text-green">Oil-rate branch</p>
            <Node color="border-green">mobility → productivity → inflow → oil rate</Node>
          </div>
          <div className="border-l-2 border-gold pl-3">
            <p className="mb-1 text-caption font-medium text-gold-text">Pump-safety branch</p>
            <Node color="border-gold">rod damping → maximum safe pump speed</Node>
          </div>
        </div>
        <Arrow />
        <Node color="border-ink">steam-oil ratio (SOR)</Node>
      </div>

      <div className="mt-12 max-w-2xl space-y-5 text-ui text-ink">
        <p>
          Oil production and pump safety are not two problems that share a well.
          They are two results of one variable. If you optimise them separately,
          the result is always worse than the best answer.
        </p>
        <p>
          A large heated zone has less surface against the cold rock. It cools
          more slowly. Steam volume therefore buys time, not only temperature.
          This is the variable that turns &ldquo;inject more steam now&rdquo; or
          &ldquo;wait&rdquo; into a calculation.
        </p>
      </div>
    </Section>
  );
}
