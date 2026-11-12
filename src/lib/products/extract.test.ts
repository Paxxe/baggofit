import { describe, expect, it } from "vitest";
import { capacityFromText, dimensionsFromSpecs, extractDimensionsCm, extractLaptop, litersIn, looksLikeBackpack } from "./extract";

describe("litersIn / capacityFromText", () => {
  it("reads single values, ranges, compounds and variant labels", () => {
    expect(litersIn("City Pack Pro 2 20L")).toEqual([20]);
    expect(litersIn("Expandable 28-35 L travel pack")).toEqual([28, 35]);
    expect(litersIn("Kompakt abgerundeter 23-Liter-Begleiter")).toEqual([23]);
    expect(litersIn("30 liters / 1830 cu. in.")).toEqual([30]);
    expect(litersIn("Zaino 22,5 litri")).toEqual([22.5]);
  });

  it("never reads part of a number: 100 L is not 10 L", () => {
    expect(litersIn("Rucksack Range Pack MKII 100 L")).toEqual([100]);
    expect(litersIn("Valigia grande 110 litri")).toEqual([110]);
    expect(litersIn("Rucksack 10L")).toEqual([10]);
    expect(litersIn("Model 2100 L-shaped zip")).toEqual([]);
  });

  it("ignores volumes that can't be a bag", () => {
    expect(litersIn("Kapai 1.5L Hip Pack")).toEqual([]);
    expect(litersIn("Storage box 250L")).toEqual([]);
  });

  it("prefers an explicit capacity sentence and refuses ambiguous text", () => {
    expect(capacityFromText("30L internal storage accommodates day trips")).toBe(30);
    expect(capacityFromText("Holds a 1L bottle. Capacity: 24 L. Expands from 20L.")).toBe(24);
    expect(capacityFromText("Available in 20L and 28L")).toBeUndefined();
  });
});

describe("extractLaptop", () => {
  it("finds the largest stated laptop size", () => {
    expect(extractLaptop('Padded sleeve fits up to a 16" laptop and a 13" tablet')).toEqual({ laptop: true, laptopInches: 16 });
    expect(extractLaptop("Large laptop compartment fits up to 17-inch screens")).toEqual({ laptop: true, laptopInches: 17 });
    expect(extractLaptop("Two-point access laptop compartment fits up to 16 inch MacBook Pro")).toEqual({ laptop: true, laptopInches: 16 });
  });

  it("flags a sleeve without a size, and no laptop when not mentioned", () => {
    expect(extractLaptop("Side-access laptop pocket")).toEqual({ laptop: true });
    expect(extractLaptop("A roomy daypack with a bottle pocket")).toEqual({ laptop: false });
  });
});

describe("dimensions", () => {
  it("parses labelled centimetres and converts inches, tallest first", () => {
    expect(extractDimensionsCm("Overall Dimensions: 51 cm (H) x 32 cm (W) x 20 cm (D)")).toEqual({ height: 51, width: 32, depth: 20 });
    expect(extractDimensionsCm("Dimensions: 30 x 48 x 18 cm")).toEqual({ height: 48, width: 30, depth: 18 });
    expect(extractDimensionsCm('Size: 19" x 12" x 7"')).toEqual({ height: 48.3, width: 30.5, depth: 17.8 });
  });

  it("uses outer measurements and skips internal or laptop ones", () => {
    expect(
      dimensionsFromSpecs([
        "Laptop Compartment: 44 cm (H) x 27 cm (W) x 3 cm (D)",
        "Internal Dimensions: 45 cm (H) x 30 cm (W) x 18 cm (D)",
        "Overall Dimensions: 51 cm (H) x 32 cm (W) x 20 cm (D)",
      ]),
    ).toEqual({ height: 51, width: 32, depth: 20 });
    expect(extractDimensionsCm("Bottle 7 x 7 x 20 cm")).toBeUndefined();
  });
});

describe("looksLikeBackpack", () => {
  it("accepts backpacks, even when only the description says so", () => {
    expect(looksLikeBackpack("Traverse Backpack (30L)")).toBe(true);
    expect(looksLikeBackpack("Travel / Hybrid 30L", "Travel / Hybrid 30L Backpack - Designed for weekend adventures")).toBe(true);
  });

  it("rejects accessories, bundles and other bag types", () => {
    expect(looksLikeBackpack("Packing Cube Small")).toBe(false);
    expect(looksLikeBackpack("Pro 40L + All Cubes Bundle")).toBe(false);
    expect(looksLikeBackpack("Kapai 1.5L Hip Pack")).toBe(false);
    expect(looksLikeBackpack("Aria Tote 20L", "Converts into a backpack")).toBe(false);
  });
});

describe("looksLikeLuggage", () => {
  it("accepts trolleys and suitcases, including compound words", async () => {
    const { looksLikeLuggage } = await import("./extract");
    expect(looksLikeLuggage("Samsonite Lite-Shock - 4-Rollen-Kabinentrolley S 55 cm")).toBe(true);
    expect(looksLikeLuggage("Cabin Trolley Small")).toBe(true);
    expect(looksLikeLuggage("Medium 26\" Soft Shell Checked Suitcase")).toBe(true);
  });

  it("rejects carry-on backpacks, sets and accessories", async () => {
    const { looksLikeLuggage } = await import("./extract");
    expect(looksLikeLuggage("The Packt Voyager — 40L Carry-On", "A travel backpack that opens like a suitcase")).toBe(false);
    expect(looksLikeLuggage("Luggage Set 3 pieces")).toBe(false);
    expect(looksLikeLuggage("Suitcase cover M")).toBe(false);
  });
});

describe("backpacks in other languages and without stated liters", () => {
  it("recognises non-English backpack names", () => {
    expect(looksLikeBackpack("Eastpak Sac à dos Day Pak'r Black")).toBe(true);
    expect(looksLikeBackpack("Mochila urbana 20L")).toBe(true);
  });

  it("estimates backpack capacity from the outer size", async () => {
    const { capacityFromDimensions } = await import("./extract");
    expect(capacityFromDimensions({ height: 48, width: 33.5, depth: 21 }, "backpack")).toBe(32);
    expect(capacityFromDimensions({ height: 55, width: 40, depth: 20 })).toBe(35);
  });
});

describe("labelled dimensions", () => {
  it("reads Altezza/Larghezza/Profondità and other languages", async () => {
    const { extractDimensionsCm } = await import("./extract");
    expect(extractDimensionsCm("Tasche interne Altezza: 44 cm, Larghezza: 29,5 cm, Profondità: 22 cm Custodia imbottita")).toEqual({ height: 44, width: 29.5, depth: 22 });
    expect(extractDimensionsCm("Height: 40 cm, Width: 30 cm, Depth: 18 cm")).toEqual({ height: 40, width: 30, depth: 18 });
    expect(extractDimensionsCm("Höhe 48 cm Breite 32 cm Tiefe 20 cm")).toEqual({ height: 48, width: 32, depth: 20 });
    expect(extractDimensionsCm("Altezza: 44 cm, Larghezza: 29,5 cm")).toBeUndefined();
  });
});
