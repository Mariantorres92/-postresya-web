import { NextResponse } from "next/server";
import { productos } from "../../lib/data";

// GET: devuelve la lista completa de postres del catálogo.
export async function GET() {
  return NextResponse.json(productos);
}