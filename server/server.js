const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");

const PORT = process.env.PORT || 3000;
const www = path.join(__dirname, "public");
const appHtml = path.join(__dirname, "..", "index.html");

function localIPs() {
  const nets = os.networkInterfaces();
  const out = [];
  for (const name of Object.keys(nets)) {
    for (const n of nets[name] || []) {
      if (n.family === "IPv4" && !n.internal) out.push(n.address);
    }
  }
  return out;
}

function send(res, code, body, type) {
  res.writeHead(code, {
    "Content-Type": type || "text/html; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const url = (req.url || "/").split("?")[0];
  if (url === "/api/health") {
    return send(res, 200, JSON.stringify({ ok: true, version: "1.6.2" }), "application/json");
  }
  if (url === "/" || url === "/status") {
    const ips = localIPs();
    const links = ips.map((ip) => `http://${ip}:${PORT}/app`).join("\n");
    const html = fs.readFileSync(path.join(www, "status.html"), "utf8")
      .replace(/\{\{PORT\}\}/g, String(PORT))
      .replace(/\{\{LINKS\}\}/g, links || `http://127.0.0.1:${PORT}/app`)
      .replace(/\{\{IPS\}\}/g, ips.map((ip) => `<li dir="ltr"><a href="http://${ip}:${PORT}/app">http://${ip}:${PORT}/app</a></li>`).join("") || "<li>localhost</li>");
    return send(res, 200, html);
  }
  if (url === "/app" || url === "/app/") {
    const file = fs.existsSync(appHtml) ? appHtml : path.join(www, "index.html");
    if (fs.existsSync(file)) return send(res, 200, fs.readFileSync(file));
    return send(res, 404, "app not found");
  }
  const safe = path.normalize(url).replace(/^(\.\.[/\\])+/, "");
  const fp = path.join(www, safe);
  if (fp.startsWith(www) && fs.existsSync(fp) && fs.statSync(fp).isFile()) {
    const ext = path.extname(fp).toLowerCase();
    const types = { ".html": "text/html; charset=utf-8", ".js": "application/javascript", ".css": "text/css", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml" };
    return send(res, 200, fs.readFileSync(fp), types[ext] || "application/octet-stream");
  }
  send(res, 404, "not found");
});

server.listen(PORT, "0.0.0.0", () => {
  const ips = localIPs();
  console.log("Boshra School Server 1.6.2");
  console.log("Local:  http://127.0.0.1:" + PORT + "/");
  ips.forEach((ip) => console.log("LAN:    http://" + ip + ":" + PORT + "/"));
  console.log("App:    /app   Status: /");
  try {
    const { exec } = require("child_process");
    const openUrl = "http://127.0.0.1:" + PORT + "/";
    if (process.platform === "win32") exec('start "" "' + openUrl + '"');
    else if (process.platform === "darwin") exec('open "' + openUrl + '"');
  } catch (e) {}
});
