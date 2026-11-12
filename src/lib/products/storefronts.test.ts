import { describe, expect, it } from "vitest";
import { directStorefronts } from "./storefronts";

const storesFor = (country: string, kind: "backpack" | "cabin-trolley" | "checked-suitcase") =>
  directStorefronts.filter((store) => store.kinds.includes(kind) && store.countries.includes(country)).map((store) => store.brand);

describe("direct storefronts by market", () => {
  it("only searches home-market stores for visitors from that country", () => {
    expect(storesFor("IT", "backpack")).toEqual(expect.arrayContaining(["Eastpak", "NOMATIC"]));
    expect(storesFor("IT", "backpack")).not.toContain("Tortuga");
    expect(storesFor("US", "cabin-trolley")).toEqual(expect.arrayContaining(["Away", "Paravel", "Tortuga"]));
    expect(storesFor("GB", "checked-suitcase")).toEqual([]);
  });

  it("uses https origins without a trailing slash", () => {
    for (const store of directStorefronts) expect(store.url).toMatch(/^https:\/\/[^/]+$/);
  });
});
