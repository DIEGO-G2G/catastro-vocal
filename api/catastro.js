// Vercel Serverless Function — proxy para API del Catastro
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") { res.status(204).end(); return; }

  const { path, ...params } = req.query;
  if (!path) { res.status(400).json({ error: "Falta path" }); return; }

  const ALLOWED = [
    "OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/json/Consulta_DNPPP",
    "OVCServWeb/OVCWcfLocalizacionRC/COVCLocalizacionRC.svc/json/Consulta_RCCOOR",
  ];
  if (!ALLOWED.some(a => path.startsWith(a))) {
    res.status(403).json({ error: "Endpoint no permitido" }); return;
  }

  const qs = new URLSearchParams(params).toString();
  const url = `https://ovc.catastro.meh.es/${path}${qs ? "?" + qs : ""}`;

  try {
    const r = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "Referer": "https://www1.sedecatastro.gob.es/",
        "Origin": "https://www1.sedecatastro.gob.es",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0 Safari/537.36",
      }
    });
    const data = await r.text();
    try {
      JSON.parse(data);
      res.setHeader("Content-Type", "application/json");
      res.status(200).send(data);
    } catch(_) {
      res.status(502).json({ error: "Catastro no devolvio JSON", muestra: data.slice(0,300) });
    }
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
