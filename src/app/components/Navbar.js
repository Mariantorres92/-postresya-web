"use client";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { usuario, cerrarSesion } = useAuth();

  return (
    <nav className="bg-pink-600 text-white px-6 py-4 flex items-center justify-between shadow-md">
      <Link href="/" className="text-xl font-bold">
        🍰 PostresYa
      </Link>

      <div className="flex items-center gap-4">
        {!usuario && (
          <>
            <Link href="/login" className="hover:underline">
              Iniciar sesión
            </Link>
            <Link
              href="/registro"
              className="bg-white text-pink-600 px-4 py-2 rounded-lg font-semibold hover:bg-pink-100"
            >
              Registrarse
            </Link>
          </>
        )}

        {usuario && usuario.rol === "cliente" && (
          <>
            <Link href="/pedido" className="hover:underline">
              Hacer pedido
            </Link>
            <Link href="/mis-pedidos" className="hover:underline">
              Mis pedidos
            </Link>
          </>
        )}

        {usuario && usuario.rol === "admin" && (
          <Link href="/dashboard" className="hover:underline">
            Dashboard
          </Link>
        )}

        {usuario && (
          <>
            <span className="text-sm opacity-90">Hola, {usuario.nombre}</span>
            <button
              onClick={cerrarSesion}
              className="bg-pink-800 px-4 py-2 rounded-lg hover:bg-pink-900"
            >
              Salir
            </button>
          </>
        )}
      </div>
    </nav>
  );
}