const express = require("express")
const cors = require("cors")
const rateLimit = require("express-rate-limit")
const { Resvg } = require("@resvg/resvg-js")

const app = express()
app.disable("x-powered-by")
app.use(cors({ origin: "*", methods: ["GET"] }))
app.use(rateLimit({
  windowMs: 60 * 1000,
  limit: 40,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { status: false, message: "Terlalu banyak request. Coba lagi sebentar." }
}))

const PORT = Number(process.env.PORT || 3000)
const API_KEY = String(process.env.API_KEY || "").trim()
const APP_BASE_URL = String(process.env.APP_BASE_URL || "").replace(/\/$/, "")
const W = 1080
const H = 1920

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function cleanText(value, max) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max)
}

function wrapText(text, maxChars) {
  const words = text.split(/\s+/).filter(Boolean)
  if (!words.length) return ["..."]
  const lines = []
  let current = ""

  for (const word of words) {
    if (!current) {
      current = word
      continue
    }
    if ((current + " " + word).length <= maxChars) {
      current += " " + word
    } else {
      lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines.slice(0, 4)
}

function randomTime() {
  const values = ["2 detik", "3 detik", "5 detik", "8 detik", "12 detik", "18 detik", "27 detik", "39 detik"]
  return values[Math.floor(Math.random() * values.length)]
}

function mustHaveKey(req, res, next) {
  if (!API_KEY) return next()
  const given = String(req.query.apikey || req.get("x-api-key") || "")
  if (given !== API_KEY) {
    return res.status(401).json({
      status: false,
      message: "API key tidak valid. Kirim apikey di query atau header x-api-key."
    })
  }
  next()
}

function createIgnoteSvg({ name, text, time }) {
  const safeName = escapeXml(name)
  const safeTime = escapeXml(time)
  const lines = wrapText(text, 30).map(escapeXml)
  const maxLineLength = Math.max(...lines.map((line) => line.length), 1)
  const bubbleWidth = Math.max(250, Math.min(630, 88 * maxLineLength + 76))
  const bubbleHeight = 98 + Math.max(0, lines.length - 1) * 56
  const bubbleX = 386
  const bubbleY = 490
  const textX = bubbleX + 40
  const textY = bubbleY + 64
  const messageMarkup = lines.map((line, index) => {
    return `<text x="${textX}" y="${textY + index * 56}" fill="#f5f5f5" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="500">${line}</text>`
  }).join("")

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="#111111"/>
      <stop offset="100%" stop-color="#030303"/>
    </linearGradient>
    <linearGradient id="keyboard" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="#1c1c1e"/>
      <stop offset="100%" stop-color="#121214"/>
    </linearGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="20"/></filter>
  </defs>

  <rect width="1080" height="1920" fill="url(#bg)"/>
  <ellipse cx="830" cy="250" rx="380" ry="180" fill="#252525" opacity="0.30" filter="url(#blur)"/>
  <ellipse cx="240" cy="780" rx="300" ry="180" fill="#121212" opacity="0.60" filter="url(#blur)"/>

  <rect x="0" y="0" width="1080" height="186" fill="#090909"/>
  <path d="M86 97 L44 139 L86 181" fill="none" stroke="#f4f4f4" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="181" cy="139" r="48" fill="#292929"/>
  <circle cx="181" cy="139" r="40" fill="none" stroke="#4a4a4a" stroke-width="2"/>
  <text x="250" y="129" fill="#f7f7f7" font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="700">Notes</text>
  <text x="250" y="170" fill="#a7a7a7" font-family="Arial, Helvetica, sans-serif" font-size="28">active now</text>
  <circle cx="971" cy="135" r="9" fill="#f4f4f4"/>
  <circle cx="1004" cy="135" r="9" fill="#f4f4f4"/>
  <circle cx="1037" cy="135" r="9" fill="#f4f4f4"/>

  <circle cx="162" cy="448" r="66" fill="#2b2b2c"/>
  <circle cx="162" cy="448" r="58" fill="none" stroke="#585858" stroke-width="2"/>
  <circle cx="162" cy="432" r="17" fill="#606060"/>
  <path d="M118 493 C125 458 199 458 206 493" fill="#606060"/>
  <text x="252" y="428" fill="#f8f8f8" font-family="Arial, Helvetica, sans-serif" font-size="40" font-weight="700">${safeName}</text>
  <text x="252" y="471" fill="#a7a7a7" font-family="Arial, Helvetica, sans-serif" font-size="28">${safeTime}</text>

  <rect x="${bubbleX}" y="${bubbleY}" width="${bubbleWidth}" height="${bubbleHeight}" rx="50" fill="#2b2b2d"/>
  ${messageMarkup}
  <path d="M${bubbleX + bubbleWidth - 39} ${bubbleY + bubbleHeight - 10} C${bubbleX + bubbleWidth - 16} ${bubbleY + bubbleHeight + 5}, ${bubbleX + bubbleWidth + 5} ${bubbleY + bubbleHeight + 16}, ${bubbleX + bubbleWidth + 20} ${bubbleY + bubbleHeight + 18} C${bubbleX + bubbleWidth + 3} ${bubbleY + bubbleHeight - 4}, ${bubbleX + bubbleWidth - 13} ${bubbleY + bubbleHeight - 12}, ${bubbleX + bubbleWidth - 39} ${bubbleY + bubbleHeight - 10}" fill="#2b2b2d"/>

  <rect x="0" y="1430" width="1080" height="490" fill="url(#keyboard)"/>
  <rect x="45" y="1350" width="990" height="70" rx="35" fill="#242426"/>
  <circle cx="86" cy="1385" r="18" fill="none" stroke="#a9a9ab" stroke-width="3"/>
  <path d="M73 1385 L99 1385 M86 1372 L86 1398" stroke="#a9a9ab" stroke-width="3" stroke-linecap="round"/>
  <text x="128" y="1396" fill="#9c9ca0" font-family="Arial, Helvetica, sans-serif" font-size="30">Kirim pesan...</text>
  <circle cx="915" cy="1385" r="19" fill="none" stroke="#f3f3f4" stroke-width="3"/>
  <path d="M904 1388 C912 1401 929 1401 937 1388 C943 1377 935 1363 925 1369 C920 1372 918 1377 918 1378 C918 1377 916 1372 911 1369 C901 1363 893 1377 899 1388 Z" fill="#f3f3f4"/>
  <circle cx="978" cy="1385" r="20" fill="none" stroke="#f3f3f4" stroke-width="3"/>
  <path d="M969 1392 L988 1373 M969 1373 L988 1392" stroke="#f3f3f4" stroke-width="3" stroke-linecap="round"/>

  <g fill="#303033">
    <rect x="31" y="1490" width="88" height="86" rx="10"/><rect x="135" y="1490" width="88" height="86" rx="10"/><rect x="239" y="1490" width="88" height="86" rx="10"/><rect x="343" y="1490" width="88" height="86" rx="10"/><rect x="447" y="1490" width="88" height="86" rx="10"/><rect x="551" y="1490" width="88" height="86" rx="10"/><rect x="655" y="1490" width="88" height="86" rx="10"/><rect x="759" y="1490" width="88" height="86" rx="10"/><rect x="863" y="1490" width="88" height="86" rx="10"/><rect x="967" y="1490" width="82" height="86" rx="10"/>
    <rect x="83" y="1592" width="88" height="86" rx="10"/><rect x="187" y="1592" width="88" height="86" rx="10"/><rect x="291" y="1592" width="88" height="86" rx="10"/><rect x="395" y="1592" width="88" height="86" rx="10"/><rect x="499" y="1592" width="88" height="86" rx="10"/><rect x="603" y="1592" width="88" height="86" rx="10"/><rect x="707" y="1592" width="88" height="86" rx="10"/><rect x="811" y="1592" width="88" height="86" rx="10"/><rect x="915" y="1592" width="82" height="86" rx="10"/>
    <rect x="31" y="1694" width="143" height="86" rx="10"/><rect x="190" y="1694" width="88" height="86" rx="10"/><rect x="294" y="1694" width="88" height="86" rx="10"/><rect x="398" y="1694" width="88" height="86" rx="10"/><rect x="502" y="1694" width="88" height="86" rx="10"/><rect x="606" y="1694" width="88" height="86" rx="10"/><rect x="710" y="1694" width="88" height="86" rx="10"/><rect x="814" y="1694" width="235" height="86" rx="10"/>
  </g>
  <g fill="#f4f4f4" font-family="Arial, Helvetica, sans-serif" font-size="30" text-anchor="middle">
    <text x="75" y="1544">Q</text><text x="179" y="1544">W</text><text x="283" y="1544">E</text><text x="387" y="1544">R</text><text x="491" y="1544">T</text><text x="595" y="1544">Y</text><text x="699" y="1544">U</text><text x="803" y="1544">I</text><text x="907" y="1544">O</text><text x="1008" y="1544">P</text>
    <text x="127" y="1646">A</text><text x="231" y="1646">S</text><text x="335" y="1646">D</text><text x="439" y="1646">F</text><text x="543" y="1646">G</text><text x="647" y="1646">H</text><text x="751" y="1646">J</text><text x="855" y="1646">K</text><text x="956" y="1646">L</text>
    <text x="234" y="1748">Z</text><text x="338" y="1748">X</text><text x="442" y="1748">C</text><text x="546" y="1748">V</text><text x="650" y="1748">B</text><text x="754" y="1748">N</text><text x="931" y="1748">Kirim</text>
  </g>
  <rect x="398" y="1840" width="284" height="12" rx="6" fill="#f5f5f5" opacity="0.9"/>
</svg>`
}

function parseIgnote(req) {
  const name = cleanText(req.query.name, 32) || "Instagram user"
  const text = cleanText(req.query.text, 120) || "halo semuanya"
  const time = cleanText(req.query.time, 18) || randomTime()
  return { name, text, time }
}

function makeImageUrl(req, values) {
  const host = APP_BASE_URL || `${req.protocol}://${req.get("host")}`
  const params = new URLSearchParams({ name: values.name, text: values.text, time: values.time })
  return `${host}/api/ignote?${params.toString()}`
}

function renderImage(values) {
  const svg = createIgnoteSvg(values)
  const image = new Resvg(svg, {
    fitTo: { mode: "width", value: 1080 },
    background: "#000000"
  })
  return image.render().asPng()
}

app.get(["/", "/docs"], (req, res) => {
  const preview = `${req.baseUrl || ""}/api/ignote?name=Fauzann&text=Halo%20dari%20Arunika&time=8%20detik`
  const previewMarkup = API_KEY
    ? `<div class="card muted">Preview dikunci karena API_KEY aktif. Tes endpoint dengan API key kamu sendiri.</div>`
    : `<img class="preview" src="${preview}" alt="API preview">`
  res.type("html").send(`<!doctype html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>IGNOTE API Docs</title>
<style>
:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#07080a;color:#edf0f4;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace}main{max-width:1060px;margin:0 auto;padding:56px 22px 70px}.tag{color:#75f9b8;letter-spacing:.12em;font-size:12px}.hero{display:grid;grid-template-columns:1fr 260px;gap:24px;align-items:start}.card{background:#111318;border:1px solid #272b33;border-radius:16px;padding:22px}.title{font-size:35px;font-weight:800;margin:8px 0 12px}.muted{color:#a6acb6;line-height:1.65}.online{color:#75f9b8}.preview{width:100%;border-radius:12px;border:1px solid #30333a;background:#000}h2{margin-top:44px;font-size:19px}.endpoint{font-size:15px;background:#111318;border:1px solid #272b33;border-radius:12px;padding:18px;overflow:auto}.get{color:#73f5b2;font-weight:800}.param{display:grid;grid-template-columns:180px 1fr;gap:8px;padding:13px 0;border-bottom:1px solid #252830}.param:last-child{border-bottom:0}code{color:#f6c177;white-space:nowrap}.pill{display:inline-block;margin-right:6px;margin-top:8px;padding:5px 8px;border:1px solid #373c47;border-radius:999px;color:#cbd1dc;font-size:12px}@media(max-width:720px){.hero{grid-template-columns:1fr}.preview{max-width:260px}.param{grid-template-columns:1fr;gap:4px}.title{font-size:28px}}
</style></head><body><main>
<div class="tag">IGNOTE API · REST DOCUMENTATION</div>
<div class="hero"><section><h1 class="title">Fake Note Image Generator <span class="online">● ONLINE</span></h1><p class="muted">Buat gambar fake note vertikal dengan nama, teks, dan waktu dinamis. Endpoint langsung mengembalikan file PNG sehingga bisa dipakai bot sebagai image URL.</p><span class="pill">PNG</span><span class="pill">GET</span><span class="pill">1080×1920</span></section>${previewMarkup}</div>
<h2>Endpoint</h2><div class="endpoint"><span class="get">GET</span> /api/ignote?name=Fauzann&amp;text=Halo%20dari%20Arunika&amp;time=8%20detik</div>
<h2>Parameter</h2><section class="card"><div class="param"><code>name</code><span>Nama pengirim. Maksimal 32 karakter.</span></div><div class="param"><code>text</code><span>Isi note/pesan. Maksimal 120 karakter.</span></div><div class="param"><code>time</code><span>Waktu kecil di bawah nama. Opsional; bila kosong dibuat acak.</span></div><div class="param"><code>apikey</code><span>Wajib bila environment <code>API_KEY</code> diaktifkan.</span></div></section>
<h2>Contoh Bot URL</h2><div class="endpoint">https://DOMAIN-KAMU/api/ignote?name=Fauzann&amp;text=Halo%20semua&amp;time=8%20detik&amp;apikey=API_KEY_KAMU</div>
<h2>Response</h2><div class="endpoint">Content-Type: image/png</div>
</main></body></html>`)
})

app.get("/api/health", (req, res) => {
  res.json({ status: true, service: "ignote-api", version: "1.0.0", keyRequired: Boolean(API_KEY) })
})

app.get("/api/ignote", mustHaveKey, (req, res) => {
  try {
    const values = parseIgnote(req)
    const png = renderImage(values)
    res.set({
      "Content-Type": "image/png",
      "Content-Length": png.length,
      "Cache-Control": "public, max-age=300",
      "Content-Disposition": "inline; filename=ignote.png"
    })
    res.end(png)
  } catch (error) {
    console.error(error)
    res.status(500).json({ status: false, message: "Gagal membuat gambar ignote." })
  }
})

app.get("/api/ignote/json", mustHaveKey, (req, res) => {
  const values = parseIgnote(req)
  res.json({ status: true, creator: "IGNOTE API", result: { ...values, image: makeImageUrl(req, values) } })
})

app.use((req, res) => {
  res.status(404).json({ status: false, message: "Endpoint tidak ditemukan." })
})

if (require.main === module) {

  app.listen(PORT, "0.0.0.0", () => {

    console.log(`IGNOTE API aktif di port ${PORT}`)

  })

}

module.exports = app
