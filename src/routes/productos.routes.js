import { Router } from "express";
import { list, create, update, remove, getProductoById } from "../controllers/productos.controller.js";

const router = Router();

router.get("/", list);           // listar productos
router.post("/", create);        // crear producto
router.put("/:id", update);      // actualizar producto
router.delete("/:id", remove);   // eliminar producto
router.get("/:id", getProductoById); // obtener producto por ID
export default router;