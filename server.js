const express = require("express")
const { loadTools } = require("./registry")

const app = express()
const tools = loadTools()

app.use(express.json())

app.get("/tools", (req, res) => {
  const output = {}

  for (const name in tools) {
    output[name] = {
      description: tools[name].description,
      input: tools[name].input
    }
  }

  res.json(output)
})

app.post("/run", async (req, res) => {
  const { tool, input } = req.body

  const t = tools[tool]

  if (!t) {
    return res.status(404).json({ error: "Tool not found" })
  }

  try {
    const result = await t.run(input || {})
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.listen(8787, () => {
  console.log("TLBT server running at http://localhost:8787")
})