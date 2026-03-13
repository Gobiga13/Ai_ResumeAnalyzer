import express from "express";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("resumes.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS resumes (
    id TEXT PRIMARY KEY,
    filename TEXT,
    content TEXT,
    analysis TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  const storage = multer.memoryStorage();
  const upload = multer({ storage });

  // API Routes
  app.post("/api/upload", upload.single("resume"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const id = Math.random().toString(36).substring(7);
      const filename = req.file.originalname;
      const content = req.file.buffer.toString("utf-8"); // Assuming text/pdf-to-text for now

      db.prepare("INSERT INTO resumes (id, filename, content) VALUES (?, ?, ?)").run(id, filename, content);

      res.json({ id, filename });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to upload resume" });
    }
  });

  app.get("/api/resumes/:id", (req, res) => {
    const resume = db.prepare("SELECT * FROM resumes WHERE id = ?").get(req.params.id);
    if (!resume) return res.status(404).json({ error: "Resume not found" });
    res.json(resume);
  });

  app.post("/api/resumes/:id/analysis", (req, res) => {
    const { analysis } = req.body;
    db.prepare("UPDATE resumes SET analysis = ? WHERE id = ?").run(analysis, req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
