const fs = require("fs");
const s = fs.readFileSync(process.env.TEMP + "\\opencode\\ui4.xml", "utf8");
const re = /text="([^"]*)"[^>]*bounds="([^"]*)"/g;
let m;
while ((m = re.exec(s))) {
  if (m[1].trim()) console.log(JSON.stringify(m[1]), m[2]);
}