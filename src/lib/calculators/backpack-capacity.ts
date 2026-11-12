export type PackingStyle = "minimalist" | "balanced" | "extra-space";

export interface PackedItem {
  name: string;
  quantity: number;
  volumeLiters: number;
}

export interface CapacityInput {
  tripDays?: number;
  usageMode?: "trip" | "everyday";
  packingStyle: PackingStyle;
  items: readonly PackedItem[];
  capacityMargin?: number;
}

export interface CapacityEstimate {
  estimatedPackedVolumeLiters: number;
  durationBufferLiters: number;
  capacityMargin: number;
  recommendedUsableCapacityLiters: number;
  suggestedCapacityRangeLiters: { min: number; max: number };
  confidence: "estimate";
  assumptions: string[];
}

const styleMargins: Record<PackingStyle, number> = {
  minimalist: 0.15,
  balanced: 0.25,
  "extra-space": 0.4,
};

export function estimateBackpackCapacity(input: CapacityInput): CapacityEstimate {
  const usageMode = input.usageMode ?? "trip";
  if (usageMode === "trip" && (!Number.isFinite(input.tripDays) || input.tripDays! < 1)) {
    throw new RangeError("Trip duration must be at least one day.");
  }

  const itemVolume = input.items.reduce((total, item) => {
    if (!Number.isInteger(item.quantity) || item.quantity < 0) {
      throw new RangeError(`Quantity for ${item.name} must be a non-negative integer.`);
    }
    if (!Number.isFinite(item.volumeLiters) || item.volumeLiters < 0) {
      throw new RangeError(`Volume for ${item.name} must be a non-negative number.`);
    }
    return total + item.quantity * item.volumeLiters;
  }, 0);

  const margin = input.capacityMargin ?? styleMargins[input.packingStyle];
  if (!Number.isFinite(margin) || margin < 0 || margin > 1) {
    throw new RangeError("Capacity margin must be between 0 and 1.");
  }

  const durationBuffer = usageMode === "trip" ? input.tripDays! * 0.5 : 0;
  const targetCapacity = (itemVolume + durationBuffer) * (1 + margin);
  const rangeMin = Math.max(5, Math.ceil(targetCapacity / 5) * 5);

  return {
    estimatedPackedVolumeLiters: roundToTenth(itemVolume),
    durationBufferLiters: roundToTenth(durationBuffer),
    capacityMargin: margin,
    recommendedUsableCapacityLiters: roundToTenth(targetCapacity),
    suggestedCapacityRangeLiters: { min: rangeMin, max: rangeMin + 5 },
    confidence: "estimate",
    assumptions: [
      "Item volumes are approximate packed volumes, not manufacturer measurements.",
      usageMode === "trip"
        ? "A 0.5 L per day buffer covers small unlisted essentials."
        : "Everyday use has no trip-duration buffer; selected items define the estimate.",
      "Usable internal capacity varies with backpack shape, padding, and compartments.",
    ],
  };
}

function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10;
}