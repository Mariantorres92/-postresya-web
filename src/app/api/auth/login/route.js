import { NextResponse } from "next/server";
import { usuarios } from "../../../lib/data";

// Capa de API (backend): recibe el correo y contraseña, valida y responde.
export async function POST(request) {
  const { email, password } = await request.json();

  const usuario = usuarios.find(
    (u) => u.email === email && u.password === password
  );

  if (!usuario) {
    return NextResponse.json(
      { error: "Correo o contraseña incorrectos" },
      { status: 401 }
    );
  }

  const { password: _, ...usuarioSinPassword } = usuario;
  return NextResponse.json(usuarioSinPassword);
}