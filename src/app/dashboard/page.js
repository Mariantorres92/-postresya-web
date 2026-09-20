"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

const nombresEstado = {
  recibido: "Recibido",
  en_preparacion: "En preparación",
  listo: "Listo",
  entregado: "Entregado",
};

export default function DashboardPage() {
  const { usuario, cargando: cargandoAuth } = useAuth();
  const router = useRouter();
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    if (!cargandoAuth && (!usuario || usuario.rol !== "admin")) {
      router.push("/login");
    }
  }, [usuario, cargandoAuth, router]);

  useEffect(() => {
    if (usuario?.rol === "admin") {
      cargarPedidos();
      const intervalo = setInterval(cargarPedidos, 5000);
      return () => clearInterval(intervalo);
    }
  }, [usuario]);

  function cargarPedidos() {
    axios.get("/api/pedidos").then((res) => setPedidos(res.data));
  }

  async function cambiarEstado(id, nuevoEstado) {
    await axios.patch(`/api/pedidos/${id}`, { estado: nuevoEstado });
    cargarPedidos();
  }

  async function eliminarPedido(id) {
    const confirmar = window.confirm("¿Seguro que quieres eliminar este pedido?");
    if (!confirmar) return;
    await axios.delete(`/api/pedidos/${id}`);
    cargarPedidos();
  }

  if (cargandoAuth || !usuario || usuario.rol !== "admin") return null;

  const totalPedidos = pedidos.length;
  const totalIngresos = pedidos.reduce((sum, p) => sum + p.precioFinal, 0);
  const datosGrafica = Object.keys(nombresEstado).map((clave) => ({
    estado: nombresEstado[clave],
    cantidad: pedidos.filter((p) => p.estado === clave).length,
  }));

  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto mt-8 p-6">
        <h1 className="text-2xl font-bold text-pink-600 mb-6">
          Dashboard 📊
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-5 text-center">
            <p className="text-gray-500 text-sm">Total de pedidos</p>
            <p className="text-3xl font-bold text-pink-600">{totalPedidos}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 text-center">
            <p className="text-gray-500 text-sm">Ingresos estimados</p>
            <p className="text-3xl font-bold text-pink-600">
              ${totalIngresos.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 text-center">
            <p className="text-gray-500 text-sm">Pendientes de entregar</p>
            <p className="text-3xl font-bold text-pink-600">
              {pedidos.filter((p) => p.estado !== "entregado").length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-5 mb-8">
          <h2 className="font-semibold mb-4">Pedidos por estado</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={datosGrafica}>
              <XAxis dataKey="estado" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="cantidad" fill="#db2777" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-md p-5">
          <h2 className="font-semibold mb-4">Todos los pedidos</h2>
          <div className="flex flex-col gap-3">
            {pedidos.length === 0 && (
              <p className="text-gray-500">Todavía no hay pedidos.</p>
            )}
            {pedidos.map((pedido) => (
              <div
                key={pedido.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-2"
              >
                <div>
                  <p className="font-semibold">
                    {pedido.productoNombre} — {pedido.clienteNombre}
                  </p>
                  <p className="text-sm text-gray-500">
                    Tamaño: {pedido.tamano} · Entrega: {pedido.fechaEntrega} ·
                    ${pedido.precioFinal.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={pedido.estado}
                    onChange={(e) => cambiarEstado(pedido.id, e.target.value)}
                    className="border rounded-lg px-3 py-1"
                  >
                    {Object.entries(nombresEstado).map(([clave, texto]) => (
                      <option key={clave} value={clave}>
                        {texto}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => eliminarPedido(pedido.id)}
                    className="text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-lg px-3 py-1"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}