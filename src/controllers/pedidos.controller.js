import { getConnection, sql } from "../config/db.js";

// Crear pedido
export const crearPedido = async (req, res) => {
  try {
    console.log("Crear pedido — Body recibido:", req.body);
    console.log(" Usuario desde token:", req.user);

    const usuarioId = req.user?.id; // <- viene del token JWT
    const { productos } = req.body;

    if (!usuarioId) {
      console.error(" No se encontró usuarioId");
      return res.status(400).json({ msg: "Usuario no autenticado" });
    }

    if (!productos || productos.length === 0) {
      console.error("No se enviaron productos");
      return res.status(400).json({ msg: "No hay productos en el pedido" });
    }

    const pool = await getConnection();

    // Insertar pedido principal
    const pedidoResult = await pool
      .request()
      .input("usuarioId", sql.Int, usuarioId)
      .query(`
        INSERT INTO Pedidos (usuarioId, estado, fechaPedido)
        OUTPUT INSERTED.id
        VALUES (@usuarioId, 'creado', GETDATE())
      `);

    const pedidoId = pedidoResult.recordset[0].id;
    console.log("Pedido creado con ID:", pedidoId);

    // Insertar los productos del pedido
    for (const item of productos) {
      console.log("Insertando item:", item);
      await pool
        .request()
        .input("pedidoId", sql.Int, pedidoId)
        .input("productoId", sql.Int, item.id)
        .input("cantidad", sql.Int, item.cantidad)
        .input("precioUnitario", sql.Decimal(10, 2), item.precio)
        .query(`
          INSERT INTO PedidoItems (pedidoId, productoId, cantidad, precioUnitario)
          VALUES (@pedidoId, @productoId, @cantidad, @precioUnitario)
        `);
    }

    res.json({ msg: "Pedido creado correctamente ", pedidoId });
  } catch (error) {
    console.error("Error al crear pedido:", error);
    res.status(500).json({ msg: "Error al crear pedido", error: error.message });
  }
};
// Listar pedidos (filtra según el rol del usuario)
export const listarPedidos = async (req, res) => {
  try {
    const pool = await getConnection();
    // Usuario autenticado y su rol
    const usuarioId = req.user?.id;
    const rol = req.user?.rol; // Asegúrate de incluir 'rol' en el token JWT
    let query = `
      SELECT p.id, u.nombre AS usuario, p.estado, p.fechaPedido
      FROM Pedidos p
      INNER JOIN Usuarios u ON p.usuarioId = u.id
    `;
    // Si es cliente, solo ve sus pedidos
    if (rol === "cliente") {
      query += ` WHERE p.usuarioId = ${usuarioId}`;
    }
    query += ` ORDER BY p.fechaPedido DESC`;
    const result = await pool.request().query(query);
    res.json(result.recordset);
  } catch (error) {
    console.error("Error al listar pedidos:", error);
    res.status(500).json({ msg: "Error al listar pedidos", error: error.message });
  }
};
// Actualizar pedido (y ajustar stock si se marca como entregado)
export const actualizarPedido = async (req, res) => {
  const { id } = req.params;
  const { usuarioId, estado } = req.body;
  try {
    const pool = await getConnection();
    // Obtener el estado actual del pedido
    const pedidoActual = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`SELECT estado FROM Pedidos WHERE id = @id`);
    if (pedidoActual.recordset.length === 0) {
      return res.status(404).json({ msg: "Pedido no encontrado" });
    }
    const estadoAnterior = pedidoActual.recordset[0].estado;
    // Actualizar los campos (usuarioId y/o estado)
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .input("usuarioId", sql.Int, usuarioId)
      .input("estado", sql.NVarChar, estado)
      .query(`
        UPDATE Pedidos
        SET usuarioId = ISNULL(@usuarioId, usuarioId),
            estado = ISNULL(@estado, estado)
        WHERE id = @id
      `);
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ msg: "Pedido no encontrado" });
    }
    // Si cambia a "Entregado" y antes no lo era, actualizar el stock
    if (estado === "Entregado" && estadoAnterior !== "Entregado") {
      console.log("Pedido entregado — actualizando stock...");
      const detalles = await pool
        .request()
        .input("id", sql.Int, id)
        .query(`
          SELECT productoId, cantidad 
          FROM PedidoItems 
          WHERE pedidoId = @id
        `);
      for (const item of detalles.recordset) {
        console.log(`Restando ${item.cantidad} del producto ${item.productoId}`);
        await pool
          .request()
          .input("productoId", sql.Int, item.productoId)
          .input("cantidad", sql.Int, item.cantidad)
          .query(`
            UPDATE Productos
            SET stock = stock - @cantidad
            WHERE id = @productoId
          `);
      }
      console.log("Stock actualizado correctamente.");
    }
    res.json({ msg: "Pedido actualizado correctamente " });
  } catch (error) {
    console.error("Error al actualizar pedido:", error);
    res.status(500).json({ msg: "Error al actualizar pedido", error: error.message });
  }
};
// Eliminar pedido
export const eliminarPedido = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await getConnection();
    await pool
      .request()
      .input("id", sql.Int, id)
      .query("DELETE FROM Pedidos WHERE id = @id");
    res.json({ msg: "Pedido eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ msg: "Error al eliminar pedido", error: error.message });
  }
};
// Listar items por pedido
export const listarItemsPorPedido = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        SELECT 
          pi.id AS itemId,
          pr.nombre AS producto,
          pi.cantidad,
          pi.precioUnitario,
          (pi.cantidad * pi.precioUnitario) AS subtotal
        FROM PedidoItems pi
        INNER JOIN Productos pr ON pi.productoId = pr.id
        WHERE pi.pedidoId = @id
        ORDER BY pi.id
      `);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener los productos del pedido", error: error.message });
  }
};