#!/usr/bin/env node
/**
 * Audit official brand stores for product recommendations.
 *
 * For each candidate brand/domain it checks:
 *   1. Shopify store with the Storefront Catalog MCP (`/api/ucp/mcp` exposes `search_catalog`)
 *   2. Whether the brand's own store already appears in Shopify's Global Catalog
 *   3. Which currency the store answers in for an Italian buyer (EUR = sells to Europe)
 *
 * Stores that pass 1 but not 2 are candidates for src/lib/products/storefronts.ts.
 * The "in global" check matches seller domains, so a brand selling under another domain or name
 * (e.g. Bric's → "Bric's Milano") can show up as DIRECT ONLY: confirm with a search before adding it.
 * Usage: node scripts/audit-storefronts.mjs [candidates.json]
 * Polite by design: one request at a time, with a pause between calls.
 */
import { readFileSync, writeFileSync } from "node:fs";

const PROFILE = process.env.SHOPIFY_UCP_AGENT_PROFILE || "https://shopify.dev/ucp/agent-profiles/examples/2026-08-25/valid-with-capabilities.json";
const GLOBAL = "https://catalog.shopify.com/api/ucp/mcp";
const PAUSE_MS = 1200;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const file = process.argv[2] ?? new URL("./storefront-candidates.json", import.meta.url);
const candidates = JSON.parse(readFileSync(file, "utf8"));

async function rpc(endpoint, method, params) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const payload = await response.json();
  if (payload.error) throw new Error(payload.error.message ?? "rpc error");
  const result = payload.result ?? {};
  if (result.structuredContent) return result.structuredContent;
  const text = result.content?.find((item) => item.type === "text")?.text;
  return text ? JSON.parse(text) : result;
}

const search = (endpoint, query) =>
  rpc(endpoint, "tools/call", {
    name: "search_catalog",
    arguments: { meta: { "ucp-agent": { profile: PROFILE } }, catalog: { query, context: { address_country: "IT", currency: "EUR", language: "it" }, pagination: { limit: 50 } } },
  });

const rows = [];
for (const { brand, domains } of candidates) {
  const row = { brand, domain: null, shopifyMcp: false, inGlobal: false, currency: null, sample: null, note: "" };
  for (const domain of domains) {
    try {
      const tools = await rpc(`https://${domain}/api/ucp/mcp`, "tools/list", {});
      if (tools.tools?.some((tool) => tool.name === "search_catalog")) {
        row.domain = domain;
        row.shopifyMcp = true;
        await sleep(PAUSE_MS);
        const found = await search(`https://${domain}/api/ucp/mcp`, "backpack");
        const product = found.products?.[0];
        row.currency = product?.price_range?.min?.currency ?? product?.variants?.[0]?.price?.currency ?? null;
        row.sample = product?.title ?? null;
        break;
      }
    } catch (error) {
      row.note = `${domain}: ${error.message}`;
    }
    await sleep(PAUSE_MS);
  }
  if (row.shopifyMcp) {
    try {
      await sleep(PAUSE_MS);
      const global = await search(GLOBAL, `${brand} backpack`);
      const sellers = (global.products ?? []).map((product) => product.variants?.[0]?.seller ?? {});
      const hosts = new Set(sellers.map((seller) => (seller.url ?? "").replace(/^https?:\/\//, "").replace(/\/$/, "")));
      const root = row.domain.replace(/^(www|eu|it)\./, "");
      // Same domain, or a seller named after the brand (e.g. "Away: Built for modern travel", "Bric's Milano").
      const brandWord = brand.toLowerCase().replace(/[^a-z0-9]/g, "");
      row.inGlobal = [...hosts].some((host) => host.endsWith(root)) || sellers.some((seller) => (seller.name ?? "").toLowerCase().replace(/[^a-z0-9]/g, "").startsWith(brandWord));
    } catch (error) {
      row.note = `global: ${error.message}`;
    }
  }
  rows.push(row);
  const status = !row.shopifyMcp ? "—  not Shopify / no MCP" : row.inGlobal ? "✓  in global catalog" : "★  DIRECT ONLY";
  console.log(`${status.padEnd(26)} ${brand.padEnd(20)} ${(row.domain ?? domains[0]).padEnd(26)} ${row.currency ?? ""} ${row.note}`);
  await sleep(PAUSE_MS);
}

writeFileSync(new URL("./storefront-audit.json", import.meta.url), JSON.stringify({ checkedAt: new Date().toISOString(), rows }, null, 2));
console.log(`\nDirect-only candidates: ${rows.filter((row) => row.shopifyMcp && !row.inGlobal).map((row) => `${row.brand} (${row.domain}, ${row.currency})`).join(", ") || "none"}`);
