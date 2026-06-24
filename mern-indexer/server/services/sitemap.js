/**
 * Generates an XML sitemap from a list of URLs and pings Bing to re-crawl it.
 * Sitemaps are capped at 50,000 URLs/file per the sitemap protocol spec
 * (https://www.sitemaps.org/protocol.html) — shard into multiple files at scale.
 *
 * Note: Google retired its public sitemap ping endpoint for general use;
 * Bing's ping endpoint is the free, working option used here.
 */
import axios from "axios";

const BING_PING_ENDPOINT = "https://www.bing.com/ping";

export function generateSitemapXml(urls) {
  const now = new Date().toISOString();
  const entries = urls
    .map((u) => `  <url><loc>${u}</loc><lastmod>${now}</lastmod></url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;
}

export async function pingSitemap(sitemapUrl) {
  try {
    const res = await axios.get(BING_PING_ENDPOINT, {
      params: { sitemap: sitemapUrl },
      timeout: 15000,
      validateStatus: () => true,
    });
    return { success: res.status === 200, statusCode: res.status };
  } catch (err) {
    return { success: false, statusCode: null, error: err.message };
  }
}
