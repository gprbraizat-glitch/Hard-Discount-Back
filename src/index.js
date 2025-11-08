import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { getConnection } from "./config/db.js";

const PORT = process.env.PORT || 4000;
async function startServer() {
  try {
    await getConnection();
    console.log(" Conectado a SQL Server (o listo para conectar)");
  } catch (err) {
    console.warn(" No se pudo conectar a SQL Server todavía:", err.message);
  }
  app.listen(PORT, () => {
    console.log(` Servidor corriendo en http://localhost:${PORT}`);
    console.log(" Backend HardDiscount corriendo correctamente");
  });
}
startServer();