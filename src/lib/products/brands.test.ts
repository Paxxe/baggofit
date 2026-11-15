import { describe, expect, it } from "vitest";
import { detectBrand } from "./brands";

describe("detectBrand", () => {
  it.each([
    ["FERRINO FINISTERRE 40 ZAINO DA TREKKING 40 LITRI", "Free Time Store", "Ferrino"],
    ["Osprey Atmos AG 65 Zaino", "DF Sport Specialist", "Osprey"],
    ["Zaino Fjallraven Kanken Classic", "Concept Palermo", "Fjällräven"],
    ["Modo by Roncato Trolley Bagaglio a Mano 4 Ruote", "La Valigeria Next", "Roncato"],
    ["Everyday Backpack 20L", "Peak Design", "Peak Design"],
    ["Chatelet Air 2.0 Cabin", "DELSEY PARIS FRANCE", "Delsey"],
    ["The North Face Borealis Backpack", "INTERSPORT ITALIA", "The North Face"],
    ["Trolley cabina Samsonite by American Tourister", "Shop", "Samsonite"],
    ["Away The Carry-On", "Away", "Away"],
  ])("%s (%s) → %s", (title, seller, brand) => expect(detectBrand(title, seller)).toBe(brand));

  it("ignores ordinary words used as brand names unless they start the title", () => {
    expect(detectBrand("Zaino da viaggio per sette giorni away from home", "Ilgrandebazar.it")).toBeUndefined();
    expect(detectBrand("Seven Zaino Scuola Fantasy", "Giordanoshop")).toBe("Seven");
    expect(detectBrand("Zaino Seven Freethink", "Giordanoshop")).toBeUndefined();
  });

  it("returns nothing for unknown makers and retailer names", () => {
    expect(detectBrand("Zaino da Trekking 40L Nero e Grigio 91109", "BricoBravo")).toBeUndefined();
  });
});

describe("isEstablishedBrand", () => {
  it("separates known makers from marketplace labels", async () => {
    const { isEstablishedBrand } = await import("./brands");
    expect(isEstablishedBrand("Osprey")).toBe(true);
    expect(isEstablishedBrand("OcioDual")).toBe(false);
    expect(isEstablishedBrand(undefined)).toBe(false);
  });
});
