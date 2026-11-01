/**
 * Validación del formulario de contacto (lógica pura, sin DOM).
 */

export const LIMITES = Object.freeze({
  nombre: { min: 2, max: 80 },
  asunto: { min: 3, max: 120 },
  mensaje: { min: 20, max: 2000 },
});

// Pragmático: usuario@dominio.tld, sin espacios, TLD de 2+ letras.
const RE_EMAIL = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;
// Letras (incluye tildes y ñ), espacios, apóstrofo, punto y guion.
const RE_NOMBRE = /^[\p{L}][\p{L}\s'.-]*$/u;

/** Recorta y colapsa espacios internos. */
export const limpiar = (v) => String(v ?? '').trim().replace(/[ \t]+/g, ' ');

export function validarEmail(email) {
  const e = limpiar(email);
  return e.length <= 254 && RE_EMAIL.test(e) && !e.includes('..');
}

/**
 * Valida los datos del formulario.
 * @param {{nombre?:string,email?:string,asunto?:string,mensaje?:string,website?:string}} datos
 *        `website` es un campo trampa (honeypot) que debe llegar vacío.
 * @returns {{ valido: boolean, errores: Record<string,string>, datos: Record<string,string> }}
 */
export function validarContacto(datos = {}) {
  const d = {
    nombre: limpiar(datos.nombre),
    email: limpiar(datos.email).toLowerCase(),
    asunto: limpiar(datos.asunto),
    mensaje: String(datos.mensaje ?? '').trim(),
  };
  const errores = {};
  const { nombre, asunto, mensaje } = LIMITES;

  if (!d.nombre) errores.nombre = 'Ingresa tu nombre.';
  else if (d.nombre.length < nombre.min) errores.nombre = `El nombre debe tener al menos ${nombre.min} caracteres.`;
  else if (d.nombre.length > nombre.max) errores.nombre = `El nombre no debe superar ${nombre.max} caracteres.`;
  else if (!RE_NOMBRE.test(d.nombre)) errores.nombre = 'El nombre solo puede contener letras y espacios.';

  if (!d.email) errores.email = 'Ingresa tu correo electrónico.';
  else if (!validarEmail(d.email)) errores.email = 'Ingresa un correo válido, por ejemplo nombre@empresa.com.';

  if (d.asunto && d.asunto.length < asunto.min) errores.asunto = `El asunto debe tener al menos ${asunto.min} caracteres.`;
  else if (d.asunto.length > asunto.max) errores.asunto = `El asunto no debe superar ${asunto.max} caracteres.`;

  if (!d.mensaje) errores.mensaje = 'Escribe un mensaje.';
  else if (d.mensaje.length < mensaje.min) errores.mensaje = `El mensaje debe tener al menos ${mensaje.min} caracteres (llevas ${d.mensaje.length}).`;
  else if (d.mensaje.length > mensaje.max) errores.mensaje = `El mensaje no debe superar ${mensaje.max} caracteres.`;

  if (limpiar(datos.website)) errores.website = 'Envío bloqueado.';

  return { valido: Object.keys(errores).length === 0, errores, datos: d };
}

/**
 * Construye un enlace mailto: seguro (sin inyección de cabeceras).
 * @param {string} destino correo del dueño del portafolio
 * @param {{nombre:string,email:string,asunto?:string,mensaje:string}} datos ya validados
 */
export function construirMailto(destino, datos) {
  if (!validarEmail(destino)) throw new TypeError('Correo de destino inválido');
  const sinSaltos = (s) => String(s).replace(/[\r\n]+/g, ' ');
  const asunto = sinSaltos(datos.asunto || `Contacto desde el portafolio — ${datos.nombre}`);
  const cuerpo = `${datos.mensaje}\n\n—\n${sinSaltos(datos.nombre)}\n${sinSaltos(datos.email)}`;
  return `mailto:${destino}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
}
