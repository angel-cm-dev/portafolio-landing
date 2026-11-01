/**
 * Utilidades puras para los proyectos cargados desde data/projects.json.
 */

/** Acepta solo URLs http(s); cualquier otra (javascript:, data:…) se descarta. */
export function urlSegura(url) {
  try {
    const u = new URL(String(url));
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : null;
  } catch {
    return null;
  }
}

/** Valida y normaliza la lista de proyectos; descarta entradas inválidas. */
export function normalizarProyectos(datos) {
  if (!Array.isArray(datos)) return [];
  return datos
    .filter((p) => p && typeof p.titulo === 'string' && p.titulo.trim() && typeof p.descripcion === 'string')
    .map((p) => ({
      titulo: p.titulo.trim(),
      descripcion: p.descripcion.trim(),
      tags: Array.isArray(p.tags) ? [...new Set(p.tags.filter((t) => typeof t === 'string' && t.trim()).map((t) => t.trim()))] : [],
      repo: urlSegura(p.repo),
      demo: urlSegura(p.demo),
      destacado: Boolean(p.destacado),
    }))
    .sort((a, b) => Number(b.destacado) - Number(a.destacado));
}

/** Lista de tags única y ordenada alfabéticamente. */
export function tagsUnicos(proyectos) {
  return [...new Set(proyectos.flatMap((p) => p.tags))].sort((a, b) => a.localeCompare(b, 'es'));
}

/** Filtra por tag ('todos' devuelve la lista completa). */
export function filtrarPorTag(proyectos, tag) {
  if (!tag || tag === 'todos') return proyectos;
  return proyectos.filter((p) => p.tags.includes(tag));
}
