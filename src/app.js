import express from "express";
import cors from "cors";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes.js";
import productosRoutes from "./routes/productos.routes.js";
import pedidosRoutes from "./routes/pedidos.routes.js";
import entregasRoutes from "./routes/entregas.routes.js";

const app = express();
// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/productos", productosRoutes);
app.use("/api/pedidos", pedidosRoutes);
app.use("/api/entregas", entregasRoutes);
// Ruta de prueba
app.get("/api/health", (req, res) => res.json({ ok: true }));
export default app;