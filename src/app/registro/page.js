"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

export default function RegistroPage() {
  const router = useRouter();
  const { iniciarSesion } = useAuth();
  const [form, setForm] = useState({ nombre: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const res = await axios.post("/api/auth/login/register", form);
      iniciarSesion(res.data);
      router.push("/pedido");
    } catch (err) {
      setError(err.response?.data?.error || "Error al registrarse");
    } finally {
      setCargando(false);
    }
  }

  return (
    <>
      <Navbar />
      <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-xl shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-pink-600">Crear cuenta</h1>

        {error && (
          <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            name="nombre"
            placeholder="Nombre completo"
            value={form.nombre}
            onChange={handleChange}
            required
            className="border rounded-lg px-4 py-2"
          />
          <input
            type="email"
            name="email"
            placeholder="Correo electrónico"
            value={form.email}
            onChange={handleChange}
            required
            className="border rounded-lg px-4 py-2"
          />
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={handleChange}
            required
            minLength={6}
            className="border rounded-lg px-4 py-2"
          />
          <button
            type="submit"
            disabled={cargando}
            className="bg-pink-600 text-white py-2 rounded-lg font-semibold hover:bg-pink-700 disabled:opacity-50"
          >
            {cargando ? "Creando cuenta..." : "Registrarme"}
          </button>
        </form>

        <p className="mt-4 text-sm text-center">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-pink-600 font-semibold">
            Inicia sesión
          </Link>
        </p>
      </div>
    </>
  );
}