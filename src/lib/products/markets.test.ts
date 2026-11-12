import { describe, expect, it } from "vitest";
import { countryFromAcceptLanguage, marketCurrencies, resolveCountry } from "./markets";

describe("resolveCountry", () => {
  it("uses the visitor's explicit choice first", () => {
    expect(resolveCountry(new Headers({ "x-vercel-ip-country": "DE" }), "fr")).toEqual({ country: "FR", source: "selected" });
  });

  it("falls back to the IP country header, then the browser language, then Italy", () => {
    expect(resolveCountry(new Headers({ "x-vercel-ip-country": "DE" }))).toEqual({ country: "DE", source: "ip" });
    expect(resolveCountry(new Headers({ "cf-ipcountry": "GB" }))).toEqual({ country: "GB", source: "ip" });
    expect(resolveCountry(new Headers({ "accept-language": "es-ES,es;q=0.9" }))).toEqual({ country: "ES", source: "language" });
    expect(resolveCountry(new Headers())).toEqual({ country: "IT", source: "default" });
  });

  it("ignores unsupported or unknown countries", () => {
    expect(resolveCountry(new Headers({ "cf-ipcountry": "XX", "accept-language": "it-IT" }), "ZZ")).toEqual({ country: "IT", source: "language" });
  });
});

describe("markets", () => {
  it("maps countries to their shop currency", () => {
    expect(marketCurrencies.IT).toBe("EUR");
    expect(marketCurrencies.GB).toBe("GBP");
    expect(marketCurrencies.CH).toBe("CHF");
    expect(countryFromAcceptLanguage("en,en-US;q=0.8")).toBe("US");
  });
});
