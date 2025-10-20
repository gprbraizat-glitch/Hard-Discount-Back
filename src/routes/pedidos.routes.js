import { Router } from "express";
import {crearPedido,listarPedidos,listarItemsPorPedido,actualizarPedido,eliminarPedido} from "../controllers/pedidos.controller.js";
import { verificarToken } from "../middlewares/auth.middleware.js";

const router = Router();
// Listar todos los pedidos (solo usuarios autenticados)
router.get("/", verificarToken, listarPedidos);
// Crear pedido (solo usuarios autenticados)
router.post("/", verificarToken, crearPedido);
// Actualizar pedido (estado / usuarioId)
router.put("/:id", verificarToken, actualizarPedido);
// Eliminar pedido (solo admins, si luego quieres limitarlo por rol)
router.delete("/:id", verificarToken, eliminarPedido);
// Listar productos asociados a un pedido
router.get("/:id/items", verificarToken, listarItemsPorPedido);
export default router;