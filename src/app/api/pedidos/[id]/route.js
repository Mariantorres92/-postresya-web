import { NextResponse } from "next/server";
import { pedidos } from "../../../lib/data";

// PATCH: actualiza el estado de un pedido (solo la administradora lo usa).
export async function PATCH(request, { params }) {
  const { id } = await params;
  const { estado } = await request.json();

  const pedido = pedidos.find((p) => p.id === Number(id));
  if (!pedido) {
    return NextResponse.json(
      { error: "Pedido no encontrado" },
      { status: 404 }
    );
  }

  pedido.estado = estado;
  return NextResponse.json(pedido);
}