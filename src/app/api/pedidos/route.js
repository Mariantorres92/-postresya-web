import { NextResponse } from "next/server";
import { pedidos, productos, nuevoIdPedido } from "../../lib/data";

// GET: devuelve todos los pedidos (la administradora los ve todos,
// el cliente los filtra en la pantalla por su propio id).
export async function GET() {
  return NextResponse.json(pedidos);
}

// POST: crea un pedido nuevo con precio calculado dinámicamente.
export async function POST(request) {
  const { clienteId, clienteNombre, productoId, tamano, fechaEntrega, notas } =
    await request.json();

  const producto = productos.find((p) => p.id === productoId);
  if (!producto) {
    return NextResponse.json(
      { error: "Producto no encontrado" },
      { status: 404 }
    );
  }

  // Validación: la entrega debe pedirse con al menos 2 días de anticipación.
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fechaPedida = new Date(fechaEntrega);
  const diffDias = Math.ceil((fechaPedida - hoy) / (1000 * 60 * 60 * 24));

  if (diffDias < 2) {
    return NextResponse.json(
      { error: "La entrega debe pedirse con al menos 2 días de anticipación" },
      { status: 400 }
    );
  }

  // Precio dinámico: tamaño pequeño = precio base, mediano = +30%, grande = +60%
  const multiplicador = tamano === "grande" ? 1.6 : tamano === "mediano" ? 1.3 : 1;
  const precioFinal = Math.round(producto.precioBase * multiplicador * 100) / 100;

  const nuevoPedido = {
    id: nuevoIdPedido(),
    clienteId,
    clienteNombre,
    productoId,
    productoNombre: producto.nombre,
    tamano,
    precioFinal,
    fechaEntrega,
    notas: notas || "",
    estado: "recibido",
    fechaCreacion: new Date().toISOString(),
  };

  pedidos.push(nuevoPedido);
  return NextResponse.json(nuevoPedido, { status: 201 });
}