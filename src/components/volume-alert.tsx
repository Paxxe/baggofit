import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { VolumeStatus } from "@/lib/calculators/airline-compatibility";

const fmt = (value: number, locale: "en" | "it") => value.toLocaleString(locale === "it" ? "it-IT" : "en-GB", { maximumFractionDigits: 0 });

/**
 * Live warning when the packing list needs more room than the selected airline allowance holds.
 * The allowance volume is an approximation from its verified outer size (see maxVolumeLiters).
 */
export function VolumeAlert({
  locale,
  status,
  neededLiters,
  limitLiters,
  airline,
  allowance,
  size,
  compact = false,
}: {
  locale: "en" | "it";
  status: VolumeStatus;
  neededLiters: number;
  limitLiters: number;
  airline: string;
  allowance: string;
  size: string;
  compact?: boolean;
}) {
  // One decimal for the need, so "19.6 of ~20 L" never reads as "20 of 20".
  const needed = neededLiters.toLocaleString(locale === "it" ? "it-IT" : "en-GB", { maximumFractionDigits: 1 });
  const limit = fmt(limitLiters, locale);
  const it = locale === "it";
  const text =
    status === "over"
      ? it
        ? `Troppo per ${airline}: ${allowance.toLowerCase()} (${size}) contiene circa ${limit} L, la tua lista ne richiede ${needed} L. Togli qualcosa o scegli un bagaglio più grande.`
        : `Too much for ${airline}: the ${allowance.toLowerCase()} (${size}) holds about ${limit} L, your list needs ${needed} L. Remove something or pick a bigger allowance.`
      : status === "near"
        ? it
          ? `Quasi al limite: ${needed} L su circa ${limit} L consentiti da ${airline} (${size}).`
          : `Close to the limit: ${needed} L of about ${limit} L allowed by ${airline} (${size}).`
        : it
          ? `Rientra nel limite ${airline}: ${needed} L su circa ${limit} L (${size}).`
          : `Within the ${airline} limit: ${needed} L of about ${limit} L (${size}).`;
  const short =
    status === "over"
      ? it ? `Oltre il limite ${airline}: ${needed} / ~${limit} L` : `Over the ${airline} limit: ${needed} / ~${limit} L`
      : status === "near"
        ? it ? `Quasi al limite: ${needed} / ~${limit} L` : `Near the limit: ${needed} / ~${limit} L`
        : it ? `Nel limite ${airline}: ${needed} / ~${limit} L` : `Within ${airline} limit: ${needed} / ~${limit} L`;
  return (
    <div className={`volume-alert is-${status} ${compact ? "is-compact" : ""}`} role={status === "over" ? "alert" : "status"}>
      {status === "ok" ? <CheckCircle2 size={compact ? 15 : 18} /> : <AlertTriangle size={compact ? 15 : 18} />}
      <p>{compact ? short : text}</p>
    </div>
  );
}
