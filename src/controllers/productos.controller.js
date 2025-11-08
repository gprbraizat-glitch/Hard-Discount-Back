import { getConnection, sql } from "../config/db.js";

// Listar todos los productos
export const list = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query("SELECT * FROM Productos WHERE activo = 1");
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ msg: "Error en la base de datos", error: error.message });
  }
};
// Crear un nuevo producto
export const create = async (req, res) => {
  const { nombre, descripcion, precio, stock } = req.body;
  try {
    const pool = await getConnection();
    await pool.request()
      .input("nombre", sql.VarChar, nombre)
      .input("descripcion", sql.VarChar, descripcion ?? "")
      .input("precio", sql.Decimal(10, 2), precio)
      .input("stock", sql.Int, stock)
      .query(`INSERT INTO Productos (nombre, descripcion, precio, stock, activo)
              VALUES (@nombre, @descripcion, @precio, @stock, 1)`);
    res.status(201).json({ msg: "Producto creado correctamente" });
  } catch (error) {
    res.status(500).json({ msg: "Error al crear producto", error: error.message });
  }
};
// Actualizar producto
export const update = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, stock, activo } = req.body;
  try {
    const pool = await getConnection();
    await pool.request()
      .input("id", sql.Int, id)
      .input("nombre", sql.VarChar, nombre)
      .input("descripcion", sql.VarChar, descripcion ?? "")
      .input("precio", sql.Decimal(10, 2), precio)
      .input("stock", sql.Int, stock)
      .input("activo", sql.Bit, activo ?? 1)
      .query(`UPDATE Productos
              SET nombre=@nombre, descripcion=@descripcion, precio=@precio, stock=@stock, activo=@activo
              WHERE id=@id`);
    res.json({ msg: "Producto actualizado correctamente" });
  } catch (error) {
    res.status(500).json({ msg: "Error al actualizar producto", error: error.message });
  }
};
// Eliminar (baja lógica)
export const remove = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await getConnection();
    await pool.request()
      .input("id", sql.Int, id)
      .query("UPDATE Productos SET activo = 0 WHERE id=@id");
    res.json({ msg: "Producto eliminado (baja lógica)" });
  } catch (error) {
    res.status(500).json({ msg: "Error al eliminar producto", error: error.message });
  }
};
// Obtener producto por ID
export const getProductoById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query("SELECT * FROM Productos WHERE id = @id AND activo = 1");

    if (result.recordset.length === 0) {
      return res.status(404).json({ msg: "Producto no encontrado" });
    }
    res.json(result.recordset[0]); // devuelve el producto encontrado
  } catch (error) {
    console.error("Error al obtener producto:", error);
    res.status(500).json({ msg: "Error al obtener producto", error: error.message });
  }
};
