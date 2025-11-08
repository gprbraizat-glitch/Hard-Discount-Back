import { getConnection, sql } from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// REGISTRO DE USUARIO
export const register = async (req, res) => {
  const { nombre, correo, password, rol } = req.body;
  try {
    const pool = await getConnection();
    // Verificar si el correo ya existe
    const existe = await pool
      .request()
      .input("correo", sql.VarChar, correo)
      .query("SELECT * FROM Usuarios WHERE correo = @correo");
    if (existe.recordset.length > 0) {
      return res.status(400).json({ msg: "El correo ya está registrado " });
    }
    // Encriptar contraseña con bcrypt
    const hashed = await bcrypt.hash(password, 10);
    // Guardar usuario (rol por defecto: cliente)
    await pool
      .request()
      .input("nombre", sql.VarChar, nombre)
      .input("correo", sql.VarChar, correo)
      .input("password", sql.VarChar, hashed)
      .input("rol", sql.VarChar, rol ?? "cliente")
      .query(`
        INSERT INTO Usuarios (nombre, correo, password, rol)
        VALUES (@nombre, @correo, @password, @rol)
      `);
    res.status(201).json({ msg: "Usuario registrado correctamente " });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({ msg: "Error en el registro", error: error.message });
  }
};
// LOGIN DE USUARIO
export const login = async (req, res) => {
  const { correo, password } = req.body;
  try {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input("correo", sql.VarChar, correo)
      .query("SELECT * FROM Usuarios WHERE correo = @correo");
    // Validar existencia
    if (result.recordset.length === 0) {
      return res.status(400).json({ msg: "Correo no encontrado " });
    }
    const user = result.recordset[0];
    const dbPassword = (user.password || "").trim(); 
    let valid = false;
    // Detectar si la contraseña guardada es hash (bcrypt) o texto plano
    if (dbPassword.startsWith("$2a$") || dbPassword.startsWith("$2b$")) {
      valid = await bcrypt.compare(password, dbPassword);
    } else {
      valid = password.trim() === dbPassword;
    }
    if (!valid) {
      return res.status(401).json({ msg: "Contraseña incorrecta " });
    }
    // Generar token JWT con rol, id y nombre
    const token = jwt.sign(
      {
        id: user.id,
        rol: user.rol,
        nombre: user.nombre,
        correo: user.correo,
      },
      "mi_secreto_jwt",
      { expiresIn: "2h" }
    );
    // Respuesta exitosa
    res.json({
      msg: "Login exitoso ",
      token,
      usuario: {
        id: user.id,
        nombre: user.nombre,
        rol: user.rol,
      },
    });
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    res.status(500).json({ msg: "Error al iniciar sesión", error: error.message });
  }
};
// VERIFICAR TOKEN
export const verificarSesion = async (req, res) => {
  const token = req.headers["authorization"];
  if (!token) {
    return res.status(403).json({ msg: "Token requerido" });
  }
  try {
    const decoded = jwt.verify(token.replace("Bearer ", ""), "mi_secreto_jwt");
    res.json({ msg: "Token válido ", usuario: decoded });
  } catch (error) {
    res.status(401).json({ msg: "Token inválido o expirado " });
  }
};