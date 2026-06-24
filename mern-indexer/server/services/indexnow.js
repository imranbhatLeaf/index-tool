/**
 * IndexNow protocol client.
 *
 * IndexNow is a free, open protocol (Bing, Yandex, Seznam.cz, etc.) that lets
 * site owners instantly notify search engines of new/updated URLs — no
 * billing account, no quota fees.
 *
 * Spec: https://www.indexnow.org/documentation
 *
 * Requirement: host a verification key file at
 * https://<your-domain>/<key>.txt containing just the key string.
 * For demo/testing on domains you don't own, the request still succeeds at
 * the protocol level but the engine may not act on unverified domains —
 * call this out in a demo.
 *
 * MOCK MODE: when no real domain is available (e.g. a placement demo),
 * set INDEXNOW_MOCK=true in .env. This skips the real network call and
 * simulates a realistic response (~90% success) so the full pipeline
 * (queue -> submit -> status update -> dashboard) can be demoed honestly,
 * without claiming a real submission happened against an unverified domain.
 */
import axios from "axios";

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const MOCK_MODE = process.env.INDEXNOW_MOCK === "true";

export async function submitUrlsIndexNow(urls, host, key) {
  if (MOCK_MODE) {
    // Simulate network latency + a realistic success rate for demo purposes.
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));
    const success = Math.random() < 0.9;
    return {
      success,
      statusCode: success ? 200 : 422,
      body: success
        ? "[MOCK] Accepted — simulated, no domain verification performed"
        : "[MOCK] Simulated rejection — unverified domain in real usage",
    };
  }

  try {
    const res = await axios.post(
      INDEXNOW_ENDPOINT,
      { host, key, urlList: urls },
      { timeout: 15000, validateStatus: () => true }
    );
    return {
      success: res.status === 200 || res.status === 202,
      statusCode: res.status,
      body: typeof res.data === "string" ? res.data.slice(0, 300) : res.data,
    };
  } catch (err) {
    return { success: false, statusCode: null, body: err.message };
  }
}
