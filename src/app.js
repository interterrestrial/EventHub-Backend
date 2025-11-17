import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import "dotenv/config";

const app = express();

// Define allowed origins for CORS
const allowedOrigins = [
  process.env.CORS_ORIGIN_LOCAL || "http://localhost:3000", 
  process.env.CORS_ORIGIN_PROD || "https://event-hub-frontend-six.vercel.app/" 
];


app.use(express.json());

app.use(cors());

app.get("/", (req, res) => {
  res.json({ message: "Server is working" });
});

app.use("/api/auth", authRoutes);

app.listen(8080,()=>{
  console.log("Server started on port 8080");
})