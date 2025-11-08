import { getConnection, sql } from "../config/db.js";

// Registrar una nueva entrega
export const registrarEntrega = async (req, res) => {
  const { pedidoId, direccion, fechaProgramada } = req.body;
  try {
    const pool = await getConnection();
    await pool
      .request()
      .input("pedidoId", sql.Int, pedidoId)
      .input("direccion", sql.VarChar, direccion)
      .input("fechaProgramada", sql.DateTime, fechaProgramada)
      .query(`
        INSERT INTO Entregas (pedidoId, direccion, fechaProgramada, estado)
        VALUES (@pedidoId, @direccion, @fechaProgramada, 'Pendiente')
      `);
    res.status(201).json({ msg: "Entrega registrada correctamente " });
  } catch (error) {
    console.error("Error al registrar entrega:", error);
    res
      .status(500)
      .json({ msg: "Error al registrar entrega", error: error.message });
  }
};
// Listar todas las entregas (con cliente)
export const listarEntregas = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT 
        e.id, 
        e.pedidoId, 
        e.direccion, 
        e.fechaProgramada, 
        e.estado, 
        e.fechaEntrega,
        u.nombre AS cliente
      FROM Entregas e
      INNER JOIN Pedidos p ON e.pedidoId = p.id
      INNER JOIN Usuarios u ON p.usuarioId = u.id
      ORDER BY e.fechaProgramada DESC
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error("Error al listar entregas:", error);
    res
      .status(500)
      .json({ msg: "Error al listar entregas", error: error.message });
  }
};
// Actualizar el estado de una entrega (ej. marcar como Entregado)
export const actualizarEntrega = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  try {
    const pool = await getConnection();
    await pool
      .request()
      .input("id", sql.Int, id)
      .input("estado", sql.NVarChar, estado)
      .query(`
        UPDATE Entregas
        SET estado = @estado,
            fechaEntrega = CASE WHEN @estado = 'Entregado' THEN GETDATE() ELSE fechaEntrega END
        WHERE id = @id
      `);
    res.json({ msg: "Entrega actualizada correctamente " });
  } catch (error) {
    console.error("Error al actualizar entrega:", error);
    res
      .status(500)
      .json({ msg: "Error al actualizar entrega", error: error.message });
  }
};