/**
 * scripts/download-flags.ts
 *
 * Downloads 2560px-wide PNG flags from flagcdn.com for every country
 * used on the globe landing page, replacing the existing placeholder files.
 *
 * Source: https://flagcdn.com/w2560/{code}.png  (free, no key required)
 *
 * Run with:
 *   npm run download:flags
 */

import * as fs   from "fs";
import * as path from "path";
import * as https from "https";

// All 21 codes used in PANEL_SEEDS (Globe.tsx) + 3 extras in /public/flags/
const CODES = [
  "ca", "no", "de", "jp", "kr", "gb",
  "us", "ir", "au", "fr", "ma",
  "eg", "sa", "nz", "sn", "mx",
  "co", "pt", "br", "ar", "za",
  "es", "nl", "pa",
];

const OUT_DIR = path.join(__dirname, "../public/flags");

function download(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);

    const req = https.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        resolve(download(res.headers.location, dest));
        return;
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      res.pipe(file);
      file.on("finish", () => file.close(() => resolve()));
    });

    req.on("error", (err) => {
      file.close();
      fs.unlink(dest, () => {});
      reject(err);
    });

    req.setTimeout(20_000, () => {
      req.destroy(new Error(`Timeout: ${url}`));
    });
  });
}

async function main() {
  console.log(`🏳  Downloading ${CODES.length} flags at 2560px width…\n`);

  for (const code of CODES) {
    const url  = `https://flagcdn.com/w2560/${code}.png`;
    const dest = path.join(OUT_DIR, `${code}.png`);

    process.stdout.write(`  ${code.toUpperCase()}  ${url}… `);
    try {
      await download(url, dest);
      const kb = (fs.statSync(dest).size / 1024).toFixed(0);
      console.log(`✅  ${kb} KB`);
    } catch (err) {
      console.log(`❌  ${(err as Error).message}`);
    }
  }

  console.log("\n✅  Done — flags saved to public/flags/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
