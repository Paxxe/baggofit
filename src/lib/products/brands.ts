/**
 * The real brand of a product. The Shopify catalog only names the store (seller), which for retailers
 * is not the brand ("Free Time Store" sells Ferrino), so the brand is read from a list of known makers:
 * first the store name (official brand stores), then the product title.
 *
 * `anchored` brands are also ordinary words ("Away", "Seven", "Rains"): they only count at the start of
 * the title or as the store name.
 */
interface Brand {
  name: string;
  aliases?: string[];
  anchored?: boolean;
  /** Generic marketplace label: offered in the filter, but not ranked as an established brand. */
  marketplace?: boolean;
}

const BRANDS: Brand[] = [
  // Outdoor & trekking
  { name: "Osprey" }, { name: "Deuter" }, { name: "Ferrino" }, { name: "Gregory" }, { name: "Thule" },
  { name: "The North Face" }, { name: "Patagonia" }, { name: "Fjällräven", aliases: ["fjallraven", "fjall raven"] },
  { name: "Arc'teryx", aliases: ["arcteryx", "arc teryx"] }, { name: "Mammut" }, { name: "Ortovox" }, { name: "Salewa" },
  { name: "Lowe Alpine" }, { name: "Vaude" }, { name: "Jack Wolfskin" }, { name: "Millet" }, { name: "Black Diamond" },
  { name: "CamelBak" }, { name: "Mystery Ranch" }, { name: "Hyperlite Mountain Gear", aliases: ["hyperlite"] }, { name: "Kelty" },
  { name: "Exped" }, { name: "Highlander" }, { name: "Caribee" }, { name: "Montane" }, { name: "Haglöfs", aliases: ["haglofs"] },
  { name: "Rab", anchored: true }, { name: "Salomon" }, { name: "Columbia", anchored: true }, { name: "Karpos" }, { name: "Montura" },
  { name: "CAMP", aliases: ["c.a.m.p."], anchored: true }, { name: "Mountain Hardwear" }, { name: "Lafuma" }, { name: "Quechua" },
  { name: "Forclaz" }, { name: "Berghaus" }, { name: "Trespass" }, { name: "Alpkit" }, { name: "Mil-Tec", aliases: ["miltec", "mil tec"] },
  { name: "Ortlieb" }, { name: "Sea to Summit" }, { name: "Mountain Equipment" }, { name: "Marmot" }, { name: "Helly Hansen" },
  { name: "McKinley" }, { name: "Gossamer Gear" }, { name: "Alpaka", anchored: true }, { name: "Rework Gear" },
  { name: "Near Zero" }, { name: "Nordisk" }, { name: "Tatonka" }, { name: "Bach", anchored: true }, { name: "Fjord Nansen" },
  // Boards & sport
  { name: "Burton" }, { name: "Dakine" }, { name: "Oakley" }, { name: "Quiksilver" }, { name: "Element", anchored: true },
  { name: "Nike" }, { name: "Adidas" }, { name: "Puma", anchored: true }, { name: "Vans", anchored: true }, { name: "Under Armour" },
  // Everyday & travel backpacks
  { name: "Eastpak" }, { name: "JanSport" }, { name: "Herschel" }, { name: "Kipling" }, { name: "Invicta" }, { name: "Seven", anchored: true },
  { name: "Rains", anchored: true }, { name: "Sandqvist" }, { name: "Db", aliases: ["douchebags"], anchored: true }, { name: "Matador", anchored: true },
  { name: "Aer", anchored: true }, { name: "Topo Designs" }, { name: "Tropicfeel" }, { name: "Cotopaxi" }, { name: "Peak Design" },
  { name: "Bellroy" }, { name: "Nomatic" }, { name: "Tortuga", anchored: true }, { name: "Wandrd" }, { name: "Pacsafe" },
  { name: "Chrome Industries" }, { name: "Timbuk2" }, { name: "Mission Workshop" }, { name: "Tomtoc" }, { name: "Bagsmart" }, { name: "Ogio" },
  { name: "CabinZero", aliases: ["cabin zero"] }, { name: "Lefrik" }, { name: "Madlug" }, { name: "Mark Ryden" }, { name: "Swissgear", aliases: ["swiss gear"] },
  { name: "Stio", anchored: true }, { name: "Vuori", anchored: true },
  // Luggage
  { name: "Samsonite" }, { name: "American Tourister" }, { name: "Roncato", aliases: ["modo by roncato", "ciak roncato"] }, { name: "Travelite" },
  { name: "Titan", anchored: true }, { name: "Delsey" }, { name: "Heys", anchored: true }, { name: "Travelpro" }, { name: "Piquadro" },
  { name: "Bric's", aliases: ["brics"] }, { name: "Mandarina Duck" }, { name: "Carpisa" }, { name: "Gabs", anchored: true }, { name: "Alviero Martini" },
  { name: "Romeo Gigli" }, { name: "Coveri", aliases: ["enrico coveri"] }, { name: "Sparco" }, { name: "Victorinox" }, { name: "Wenger" },
  { name: "Tumi", anchored: true }, { name: "Rimowa" }, { name: "Briggs & Riley", aliases: ["briggs and riley"] }, { name: "Hauptstadtkoffer" },
  { name: "Stratic" }, { name: "Wittchen" }, { name: "Calpak" }, { name: "July", anchored: true }, { name: "Monos", anchored: true },
  { name: "Béis", aliases: ["beis"], anchored: true }, { name: "Level8" }, { name: "Horizn Studios" }, { name: "Away", anchored: true },
  { name: "Paravel" }, { name: "Calvin Klein" }, { name: "Tommy Hilfiger" }, { name: "Guess", anchored: true }, { name: "Ralph Lauren" },
  // Marketplace labels frequent in the catalog
  { name: "Kroser", marketplace: true }, { name: "Matein", marketplace: true }, { name: "OcioDual", marketplace: true }, { name: "Romswi", marketplace: true }, { name: "Flintronic", marketplace: true }, { name: "Spaher", marketplace: true }, { name: "Funmo", marketplace: true },
  { name: "Logoduck", marketplace: true }, { name: "Denri", marketplace: true }, { name: "Tolaccea", marketplace: true }, { name: "Lekesky", marketplace: true }, { name: "Qooloo", marketplace: true }, { name: "Bolsnik", marketplace: true }, { name: "Igolumon", marketplace: true },
  { name: "Skysper", marketplace: true }, { name: "Waterfly", marketplace: true }, { name: "Tigernu", marketplace: true }, { name: "Mardingtop", marketplace: true },
];

const established = new Set(BRANDS.filter((brand) => !brand.marketplace).map((brand) => brand.name));

/** A known maker (Osprey, Samsonite…), as opposed to a generic marketplace label. */
export function isEstablishedBrand(name: string | undefined) {
  return !!name && established.has(name);
}

/** Lowercase, no accents or trademark signs, plain apostrophes. */
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[®™©]/g, "")
    .replace(/[’`]/g, "'")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const matchers = BRANDS.map((brand) => {
  const aliases = [...new Set([brand.name, ...(brand.aliases ?? [])].map(normalize))].sort((a, b) => b.length - a.length);
  const body = aliases.map(escape).join("|");
  return {
    name: brand.name,
    anchored: !!brand.anchored,
    anywhere: new RegExp(`(?:^|[^a-z0-9])(${body})(?=$|[^a-z0-9])`),
    start: new RegExp(`^(${body})(?=$|[^a-z0-9])`),
  };
});

/** Brand named by the store itself (official brand store), e.g. "Peak Design", "DELSEY PARIS FRANCE". */
function brandFromSeller(seller: string) {
  // "EU.BAGSMART", "UK Osprey": a country prefix in front of the brand's own store name.
  const text = normalize(seller).replace(/^(?:eu|uk|us|de|it|fr|es|nl)[.\s-]+/, "");
  return matchers.find((matcher) => matcher.start.test(text))?.name;
}

/** Brand named in the title: the one mentioned first. Ambiguous names only count at the very start. */
function brandFromTitle(title: string) {
  const text = normalize(title).replace(/^[^a-z0-9]+/, "");
  let best: { name: string; index: number; length: number } | undefined;
  for (const matcher of matchers) {
    const match = matcher.anchored ? text.match(matcher.start) : text.match(matcher.anywhere);
    if (!match) continue;
    const index = (match.index ?? 0) + match[0].indexOf(match[1]);
    if (!best || index < best.index || (index === best.index && match[1].length > best.length)) best = { name: matcher.name, index, length: match[1].length };
  }
  return best?.name;
}

/** The product's brand, or undefined when it isn't a known one (it's then not offered as a filter). */
export function detectBrand(title: string, seller?: string): string | undefined {
  return (seller ? brandFromSeller(seller) : undefined) ?? brandFromTitle(title);
}
