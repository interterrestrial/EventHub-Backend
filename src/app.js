import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";

const app = express();

// Define allowed origins for CORS
const allowedOrigins = [
  process.env.CORS_ORIGIN_LOCAL || "http://localhost:3000", 
  process.env.CORS_ORIGIN_PROD || "https://event-hub-frontend-six.vercel.app/" 
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true // Allow cookies and credentials
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Server is working" });
});

app.use("/api/auth", authRoutes);

export default app;