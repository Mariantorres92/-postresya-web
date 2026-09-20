import { NextResponse } from "next/server";
import { usuarios, nuevoIdUsuario } from "../../../../lib/data";

// Registra un nuevo cliente (los administradores no se registran aquí).
export async function POST(request) {
  const { nombre, email, password } = await request.json();

  if (!nombre || !email || !password) {
    return NextResponse.json(
      { error: "Todos los campos son obligatorios" },
      { status: 400 }
    );
  }

  const existe = usuarios.find((u) => u.email === email);
  if (existe) {
    return NextResponse.json(
      { error: "Ya existe una cuenta con ese correo" },
      { status: 409 }
    );
  }

  const nuevoUsuario = {
    id: nuevoIdUsuario(),
    nombre,
    email,
    password,
    rol: "cliente",
  };

  usuarios.push(nuevoUsuario);

  const { password: _, ...usuarioSinPassword } = nuevoUsuario;
  return NextResponse.json(usuarioSinPassword, { status: 201 });
}