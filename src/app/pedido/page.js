"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

function FormularioPedido() {
  const { usuario, cargando: cargandoAuth } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const productoIdInicial = searchParams.get("producto");

  const [productos, setProductos] = useState([]);
  const [productoId, setProductoId] = useState(productoIdInicial || "");
  const [tamano, setTamano] = useState("pequeno");
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [notas, setNotas] = useState("");
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    axios.get("/api/productos").then((res) => setProductos(res.data));
  }, []);

  useEffect(() => {
    if (!cargandoAuth && !usuario) {
      router.push("/login");
    }
  }, [usuario, cargandoAuth, router]);

  const producto = productos.find((p) => p.id === Number(productoId));
  const multiplicador = tamano === "grande" ? 1.6 : tamano === "mediano" ? 1.3 : 1;
  const precioEstimado = producto
    ? (producto.precioBase * multiplicador).toFixed(2)
    : "0.00";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setExito("");
    setCargando(true);
    try {
      await axios.post("/api/pedidos", {
        clienteId: usuario.id,
        clienteNombre: usuario.nombre,
        productoId: Number(productoId),
        tamano,
        fechaEntrega,
        notas,
      });
      setExito("¡Pedido creado con éxito!");
      setTimeout(() => router.push("/mis-pedidos"), 1200);
    } catch (err) {
      setError(err.response?.data?.error || "Error al crear el pedido");
    } finally {
      setCargando(false);
    }
  }

  if (cargandoAuth || !usuario) return null;

  return (
    <>
      <Navbar />
      <div className="max-w-lg mx-auto mt-10 p-6 bg-white rounded-xl shadow-md">
        <h1 className="text-2xl font-bold text-pink-600 mb-6">
          Arma tu pedido 🎂
        </h1>

        {error && (
          <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">{error}</p>
        )}
        {exito && (
          <p className="bg-green-100 text-green-700 p-3 rounded-lg mb-4">
            {exito}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Postre</label>
            <select
              value={productoId}
              onChange={(e) => setProductoId(e.target.value)}
              required
              className="border rounded-lg px-4 py-2 w-full"
            >
              <option value="">Selecciona un postre</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.imagen} {p.nombre} (${p.precioBase.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Tamaño</label>
            <select
              value={tamano}
              onChange={(e) => setTamano(e.target.value)}
              className="border rounded-lg px-4 py-2 w-full"
            >
              <option value="pequeno">Pequeño (precio base)</option>
              <option value="mediano">Mediano (+30%)</option>
              <option value="grande">Grande (+60%)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">
              Fecha de entrega
            </label>
            <input
              type="date"
              value={fechaEntrega}
              onChange={(e) => setFechaEntrega(e.target.value)}
              required
              className="border rounded-lg px-4 py-2 w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Mínimo 2 días de anticipación
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">
              Notas (opcional)
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="border rounded-lg px-4 py-2 w-full"
              rows={3}
              placeholder="Ej. dedicatoria, alergias, colores..."
            />
          </div>

          <div className="bg-pink-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">Precio estimado</p>
            <p className="text-3xl font-bold text-pink-600">
              ${precioEstimado}
            </p>
          </div>

          <button
            type="submit"
            disabled={cargando || !productoId}
            className="bg-pink-600 text-white py-2 rounded-lg font-semibold hover:bg-pink-700 disabled:opacity-50"
          >
            {cargando ? "Enviando..." : "Confirmar pedido"}
          </button>
        </form>
      </div>
    </>
  );
}

export default function PedidoPage() {
  return (
    <Suspense fallback={null}>
      <FormularioPedido />
    </Suspense>
  );
}