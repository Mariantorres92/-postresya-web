"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "./components/Navbar";
import Link from "next/link";
import { useAuth } from "./context/AuthContext";

export default function Home() {
  const { usuario } = useAuth();
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    axios
      .get("/api/productos")
      .then((res) => setProductos(res.data))
      .finally(() => setCargando(false));
  }, []);

  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-pink-600 mb-2">
          Nuestro catálogo 🍰
        </h1>
        <p className="text-gray-600 mb-8">
          Postres personalizados, hechos con amor. Elige tu favorito y arma tu
          pedido.
        </p>

        {cargando && <p>Cargando productos...</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {productos.map((producto) => (
            <div
              key={producto.id}
              className="bg-white rounded-xl shadow-md p-5 flex flex-col items-center text-center hover:shadow-lg transition"
            >
              <div className="text-6xl mb-3">{producto.imagen}</div>
              <h2 className="text-lg font-semibold">{producto.nombre}</h2>
              <p className="text-sm text-gray-500 mb-2">
                {producto.descripcion}
              </p>
              <p className="text-pink-600 font-bold mb-4">
                Desde ${producto.precioBase.toFixed(2)}
              </p>
              {usuario && usuario.rol === "cliente" ? (
                <Link
                  href={`/pedido?producto=${producto.id}`}
                  className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700"
                >
                  Pedir
                </Link>
              ) : !usuario ? (
                <Link
                  href="/login"
                  className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700"
                >
                  Inicia sesión para pedir
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
