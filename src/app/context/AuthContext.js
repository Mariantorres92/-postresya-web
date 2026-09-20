"use client";
// Capa de LÓGICA: maneja quién ha iniciado sesión y su rol (admin o cliente).
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const guardado = localStorage.getItem("postresya_usuario");
    if (guardado) {
      setUsuario(JSON.parse(guardado));
    }
    setCargando(false);
  }, []);

  function iniciarSesion(datosUsuario) {
    setUsuario(datosUsuario);
    localStorage.setItem("postresya_usuario", JSON.stringify(datosUsuario));
  }

  function cerrarSesion() {
    setUsuario(null);
    localStorage.removeItem("postresya_usuario");
  }

  return (
    <AuthContext.Provider value={{ usuario, iniciarSesion, cerrarSesion, cargando }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}