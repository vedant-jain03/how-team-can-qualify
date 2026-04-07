/**
 * scripts/find-series-id.mjs
 *
 * One-time helper — run this once to find the IPL 2026 series ID,
 * then paste it into update-standings.mjs
 *
 * Usage:
 *   CRIC_API_KEY=yourkey node scripts/find-series-id.mjs
 */

const API_KEY = process.env.CRIC_API_KEY;
if (!API_KEY) {
  console.error("❌  Set CRIC_API_KEY env var first");
  process.exit(1);
}

const res = await fetch(
  `https://api.cricapi.com/v1/series?apikey=${API_KEY}&offset=0&search=Indian+Premier+League+2026`
);
const json = await res.json();

if (json.status !== "success") {
  console.error("API error:", json);
  process.exit(1);
}

console.log("\n🏏  Matching series:\n");
for (const s of json.data) {
  console.log(`  Name:       ${s.name}`);
  console.log(`  ID:         ${s.id}`);
  console.log(`  Start date: ${s.startDate}`);
  console.log(`  End date:   ${s.endDate}`);
  console.log("  ---");
}

console.log("\n👆  Copy the ID for IPL 2026 and paste it into:");
console.log("    scripts/update-standings.mjs → const IPL_SERIES_ID = \"...\"\n");
