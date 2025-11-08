import jwt from "jsonwebtoken";

export const verificarToken = (req, res, next) => {
  try {
    // Obtener el header Authorization
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(403).json({ msg: "Token no proporcionado " });
    }
    // Asegurarse de que comience con 'Bearer '
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(400).json({ msg: "Formato de token inválido " });
    }
    // Extraer el token puro
    const token = authHeader.replace("Bearer ", "");
    // Verificar y decodificar el token
    const decoded = jwt.verify(token, "mi_secreto_jwt");
    // Agregar los datos al request (importante: incluir rol e id)
    req.user = {
      id: decoded.id,
      rol: decoded.rol,  
      nombre: decoded.nombre, 
      email: decoded.email,   
    };
    // Continuar al siguiente middleware o controlador
    next();
  } catch (error) {
    console.error("Error en verificarToken:", error.message);
    res.status(401).json({ msg: "Token inválido o expirado " });
  }
};