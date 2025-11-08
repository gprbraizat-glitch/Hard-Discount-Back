import { Router } from "express";
import {
  registrarEntrega,
  listarEntregas,
  actualizarEntrega, 
} from "../controllers/entregas.controller.js";
import { verificarToken } from "../middlewares/auth.middleware.js"; 
const router = Router();
// Registrar nueva entrega (protegido)
router.post("/", verificarToken, registrarEntrega);
// Listar entregas (protegido)
router.get("/", verificarToken, listarEntregas);
// Actualizar entrega (protegido)
router.put("/:id", verificarToken, actualizarEntrega);
export default router;