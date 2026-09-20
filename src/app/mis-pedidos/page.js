"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

const coloresEstado = {
  recibido: "bg-yellow-100 text-yellow-700",
  en_preparacion: "bg-blue-100 text-blue-700",
  listo: "bg-purple-100 text-purple-700",
  entregado: "bg-green-100 text-green-700",
};

const nombresEstado = {
  recibido: "Recibido",
  en_preparacion: "En preparación",
  listo: "Listo para entregar",
  entregado: "Entregado",
};

export default function MisPedidosPage() {
  const { usuario, cargando: cargandoAuth } = useAuth();
  const router = useRouter();
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!cargandoAuth && !usuario) {
      router.push("/login");
    }
  }, [usuario, cargandoAuth, router]);

  useEffect(() => {
    if (usuario) {
      cargarPedidos();
      // Actualización dinámica: refresca la lista cada 5 segundos
      const intervalo = setInterval(cargarPedidos, 5000);
      return () => clearInterval(intervalo);
    }
  }, [usuario]);

  function cargarPedidos() {
    axios.get("/api/pedidos").then((res) => {
      const propios = res.data.filter((p) => p.clienteId === usuario.id);
      setPedidos(propios);
      setCargando(false);
    });
  }

  if (cargandoAuth || !usuario) return null;

  return (
    <>
      <Navbar />
      <div className="max-w-3xl mx-auto mt-10 p-6">
        <h1 className="text-2xl font-bold text-pink-600 mb-6">
          Mis pedidos 📦
        </h1>

        {cargando && <p>Cargando...</p>}
        {!cargando && pedidos.length === 0 && (
          <p className="text-gray-500">Todavía no tienes pedidos.</p>
        )}

        <div className="flex flex-col gap-4">
          {pedidos.map((pedido) => (
            <div
              key={pedido.id}
              className="bg-white rounded-xl shadow-md p-5 flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">{pedido.productoNombre}</p>
                <p className="text-sm text-gray-500">
                  Tamaño: {pedido.tamano} · Entrega: {pedido.fechaEntrega}
                </p>
                <p className="text-pink-600 font-bold">
                  ${pedido.precioFinal.toFixed(2)}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  coloresEstado[pedido.estado]
                }`}
              >
                {nombresEstado[pedido.estado]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}