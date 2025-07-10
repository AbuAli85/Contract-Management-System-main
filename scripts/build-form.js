require("dotenv").config({ path: require("path").resolve(__dirname, "..", ".env.local") })

const fs = require("fs")
const path = require("path")

const { NEXT_PUBLIC_MAKE_WEBHOOK_URL } = process.env

if (!NEXT_PUBLIC_MAKE_WEBHOOK_URL) {
  console.error("NEXT_PUBLIC_MAKE_WEBHOOK_URL is not defined")
  process.exit(1)
}

const templatePath = path.join(__dirname, "..", "index.html")
const outputPath = path.join(__dirname, "..", "public", "index.html")

let content = fs.readFileSync(templatePath, "utf8")
content = content.replace(/__MAKE_WEBHOOK_URL__/g, NEXT_PUBLIC_MAKE_WEBHOOK_URL)
fs.writeFileSync(outputPath, content)
console.log(`Wrote ${outputPath}`)
