import http from "http";

function req(label, options, body) {
  return new Promise((resolve) => {
    const r = http.request(options, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => resolve({ label, status: res.statusCode, body: d }));
    });
    r.on("error", (e) => resolve({ label, status: "ERR", body: e.message }));
    if (body) r.write(body);
    r.end();
  });
}

const loginBody = JSON.stringify({ username: "admin", password: "cfa@admin2024" });
const wrongBody = JSON.stringify({ username: "admin", password: "wrong" });

const tests = await Promise.all([
  req("GET  /api/members",                   { host: "localhost", port: 3000, path: "/api/members?page=1&limit=2" }),
  req("GET  /api/members/lookup (no match)", { host: "localhost", port: 3000, path: "/api/members/lookup?membershipNo=INVALID" }),
  req("GET  /api/stats (public)",            { host: "localhost", port: 3000, path: "/api/stats" }),
  req("GET  /api/admin/members (no auth)",   { host: "localhost", port: 3000, path: "/api/admin/members" }),
  req("GET  /api/admin/stats (no auth)",     { host: "localhost", port: 3000, path: "/api/admin/stats" }),
  req("POST /api/admin/login (wrong pass)",  { host: "localhost", port: 3000, path: "/api/admin/login", method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(wrongBody) } }, wrongBody),
  req("POST /api/admin/login (correct)",     { host: "localhost", port: 3000, path: "/api/admin/login", method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(loginBody) } }, loginBody),
]);

console.log("\n========== API TEST RESULTS ==========\n");
tests.forEach((t) => {
  const icon =
    t.status === 200 ? "✅" :
    t.status === 401 ? "🔒" :
    t.status === 404 ? "🔍" :
    t.status === 400 ? "⚠️ " :
    "❌";
  const preview = t.body.length > 150 ? t.body.slice(0, 150) + "..." : t.body;
  console.log(`${icon} [${t.status}] ${t.label}`);
  console.log(`       ${preview}\n`);
});
