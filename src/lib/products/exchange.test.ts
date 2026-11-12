import { describe, expect, it } from "vitest";
import { convert, localizePrices, parseEcbRates } from "./exchange";

const xml = `<Cube><Cube time='2026-11-11'><Cube currency='USD' rate='1.1127'/><Cube currency='GBP' rate='0.83618'/></Cube></Cube>`;

describe("exchange", () => {
  it("parses ECB rates and converts through EUR", () => {
    const rates = parseEcbRates(xml);
    expect(rates).toEqual({ EUR: 1, USD: 1.1127, GBP: 0.83618 });
    expect(convert(205, "USD", "EUR", rates)).toBeCloseTo(184.24, 2);
    expect(convert(100, "GBP", "USD", rates)).toBeCloseTo(133.07, 2);
    expect(convert(10, "XYZ", "EUR", rates)).toBeNull();
  });

  it("converts foreign prices and keeps the original", () => {
    const rates = parseEcbRates(xml);
    const [usd, eur] = localizePrices([{ id: "a", title: "Allpa", price: 205, currency: "USD" }, { id: "b", title: "Other", price: 90, currency: "EUR" }], "EUR", rates);
    expect(usd).toMatchObject({ price: 184.24, currency: "EUR", originalPrice: 205, originalCurrency: "USD" });
    expect(eur).toEqual({ id: "b", title: "Other", price: 90, currency: "EUR" });
  });
});
