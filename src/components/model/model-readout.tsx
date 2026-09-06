import type { ModelResult } from "@/lib/model/twin";

function stat(label: string, value: string, note?: string) {
  return { label, value, note };
}

// The scalar outputs of one model run. SOR leads; the rest support it.
export function ModelReadout({ result }: { result: ModelResult }) {
  const supporting = [
    stat("Cooling constant τ", `${result.coolingConstant.toFixed(0)} days`),
    stat("Heated-zone radius", `${result.heatedZoneRadius.toFixed(1)} m`),
    stat(
      "Float limit binds",
      result.floatBindsDay === null
        ? "not this cycle"
        : `day ${result.floatBindsDay}`,
    ),
    stat("Cycle oil (Np)", `${Math.round(result.cycleOil).toLocaleString("en-US")} bbl`),
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <div className="rounded-md border border-ink bg-canvas p-4 ring-1 ring-ink lg:col-span-1">
        <p className="text-[12px] text-muted-ink">Steam–oil ratio</p>
        <p className="mt-1 text-[28px] leading-none font-medium text-ink tabular-nums">
          {Number.isFinite(result.sor) ? result.sor.toFixed(1) : "—"}
        </p>
        <p className="mt-2 text-[11px] text-muted-ink">
          estimate · reported band 3.0–5.2
        </p>
      </div>

      {supporting.map((item) => (
        <div
          key={item.label}
          className="rounded-md border border-hairline bg-canvas p-4"
        >
          <p className="text-[12px] text-muted-ink">{item.label}</p>
          <p className="mt-1 text-[18px] leading-tight font-medium text-ink tabular-nums">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
