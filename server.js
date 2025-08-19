// server.js

require("dotenv").config();                 // load .env first

const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Safety check: show whether the API key is present ---
if (!process.env.OPENAI_API_KEY) {
  console.warn("⚠️  OPENAI_API_KEY is missing. Add it to your .env file.");
}

// --- OpenAI client ---
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// --- Root route so the browser shows something ---
app.get("/", (req, res) => {
  res.send("🚀 AI Chore App Backend is running! Use POST /api/ask-ai");
});

// --- Health check (handy for debugging) ---
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    hasAPIKey: Boolean(process.env.OPENAI_API_KEY),
    port: PORT,
  });
});

// --- Main endpoint ---
app.post("/api/ask-ai", async (req, res) => {
  const { chores } = req.body;
  console.log("📥 /api/ask-ai received chores:", chores);

  if (!chores || typeof chores !== "string" || chores.trim() === "") {
    return res.status(400).json({ error: "Chores input is required." });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",   // fast + cost-effective; change if you want
      messages: [
        {
          role: "system",
          content:
            "You are an assistant that helps users organize and solve their daily chores efficiently. Provide practical advice, prioritization, grouping, and time management tips.",
        },
        { role: "user", content: `Here are my chores: ${chores}` },
      ],
    });

    const reply = completion.choices?.[0]?.message?.content ?? "(no reply)";
    console.log("🤖 AI reply:", reply);
    res.json({ reply });
  } catch (err) {
    console.error("🔥 OpenAI error:", err);
    res.status(500).json({
      error:
        "Something went wrong while contacting OpenAI. Check server logs for details.",
    });
  }
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
