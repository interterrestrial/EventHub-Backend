import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";

const app = express();

const allowed = [
  process.env.CORS_ORIGIN_LOCAL,
  process.env.CORS_ORIGIN_PROD
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowed.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Server is working" });
});

app.use("/api/auth", authRoutes);

export default app;
