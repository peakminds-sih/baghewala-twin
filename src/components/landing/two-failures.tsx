import { Section, SectionHeading } from "@/components/site/section";

const NEUTRAL = "#9297a0";
const INK = "#181d26";
const BLUE = "#1b61c9";
const CORAL = "#aa2d00";

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
        fill="#ffffff"
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
  color = "border-border-strong",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <div
      className={`rounded-sm border ${color} bg-canvas px-4 py-2.5 text-center text-[13px] text-ink`}
    >
      {children}
    </div>
  );
}

function Arrow() {
  return <div className="text-center text-[14px] leading-none text-border-strong">↓</div>;
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
              ["arrow-blue", BLUE],
              ["arrow-coral", CORAL],
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
          <line x1={250} y1={92} x2={250} y2={110} stroke={BLUE} strokeWidth="1.5" markerEnd="url(#arrow-blue)" />
          <line x1={660} y1={92} x2={660} y2={110} stroke={CORAL} strokeWidth="1.5" markerEnd="url(#arrow-coral)" />

          {/* left branch — oil rate */}
          <Box x={145} y={112} w={210} h={40} lines={["mobility → productivity"]} color={BLUE} />
          <line x1={250} y1={152} x2={250} y2={174} stroke={BLUE} strokeWidth="1.5" markerEnd="url(#arrow-blue)" />
          <Box x={145} y={176} w={210} h={40} lines={["inflow → oil rate"]} color={BLUE} />

          {/* right branch — pump safety */}
          <Box x={555} y={112} w={210} h={40} lines={["rod damping"]} color={CORAL} />
          <line x1={660} y1={152} x2={660} y2={174} stroke={CORAL} strokeWidth="1.5" markerEnd="url(#arrow-coral)" />
          <Box x={555} y={176} w={210} h={40} lines={["maximum safe", "pump speed"]} color={CORAL} />

          {/* converge to SOR */}
          <line x1={250} y1={216} x2={250} y2={240} stroke={BLUE} strokeWidth="1.5" />
          <line x1={660} y1={216} x2={660} y2={240} stroke={CORAL} strokeWidth="1.5" />
          <line x1={250} y1={240} x2={660} y2={240} stroke={NEUTRAL} strokeWidth="1.5" />
          <line x1={455} y1={240} x2={455} y2={262} stroke={NEUTRAL} strokeWidth="1.5" markerEnd="url(#arrow-neutral)" />
          <Box x={345} y={264} w={220} h={44} lines={["steam-oil ratio (SOR)"]} color={INK} />
        </svg>

        <p className="mt-4 text-[12px] text-muted-ink">
          <span style={{ color: BLUE }}>Blue</span> is the oil-rate branch.{" "}
          <span style={{ color: CORAL }}>Coral</span> is the pump-safety branch.
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
          <div className="border-l-2 border-link pl-3">
            <p className="mb-1 text-[11px] font-medium text-link">
              Oil-rate branch
            </p>
            <Node color="border-link">
              mobility → productivity → inflow → oil rate
            </Node>
          </div>
          <div className="border-l-2 border-signature-coral pl-3">
            <p className="mb-1 text-[11px] font-medium text-signature-coral">
              Pump-safety branch
            </p>
            <Node color="border-signature-coral">
              rod damping → maximum safe pump speed
            </Node>
          </div>
        </div>
        <Arrow />
        <Node color="border-ink">steam-oil ratio (SOR)</Node>
      </div>

      <div className="mt-12 max-w-2xl space-y-5 text-[14px] text-ink">
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
