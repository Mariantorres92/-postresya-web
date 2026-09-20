// Capa de DATOS: aquí viven los datos "semilla" de la aplicación.
// En la Etapa 3 esto se reemplazará por una base de datos real (Firestore).

export let productos = [
  {
    id: 1,
    nombre: "Pastel de Chocolate",
    descripcion: "Bizcocho húmedo de chocolate con ganache",
    precioBase: 25,
    categoria: "Pasteles",
    imagen: "🍫",
  },
  {
    id: 2,
    nombre: "Pastel Tres Leches",
    descripcion: "Clásico pastel tres leches con canela",
    precioBase: 22,
    categoria: "Pasteles",
    imagen: "🍰",
  },
  {
    id: 3,
    nombre: "Cupcakes Vainilla",
    descripcion: "Caja de 6 cupcakes de vainilla decorados",
    precioBase: 12,
    categoria: "Cupcakes",
    imagen: "🧁",
  },
  {
    id: 4,
    nombre: "Cheesecake de Fresa",
    descripcion: "Cheesecake horneado con cobertura de fresa",
    precioBase: 28,
    categoria: "Cheesecakes",
    imagen: "🍓",
  },
];

export let usuarios = [
  {
    id: 1,
    nombre: "Admin PostresYa",
    email: "admin@postresya.com",
    password: "admin123",
    rol: "admin",
  },
];

export let pedidos = [];

// Contadores simples para generar ids nuevos
export let contadorUsuarios = 2;
export let contadorPedidos = 1;

export function nuevoIdUsuario() {
  return contadorUsuarios++;
}

export function nuevoIdPedido() {
  return contadorPedidos++;
}