import { validarContacto, construirMailto, LIMITES } from './validacion.js';
import { normalizarProyectos, tagsUnicos, filtrarPorTag } from './proyectos.js';

const $ = (s, ctx = document) => ctx.querySelector(s);
const el = (tag, props = {}, ...hijos) => {
  const n = Object.assign(document.createElement(tag), props);
  n.append(...hijos);
  return n;
};
const movimientoReducido = matchMedia('(prefers-reduced-motion: reduce)');

/* ----------------------------------------------------------------- Tema */
$('#btn-tema').addEventListener('click', () => {
  const actual = document.documentElement.dataset.theme
    ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const nuevo = actual === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = nuevo;
  try { localStorage.setItem('portafolio:tema', nuevo); } catch { /* sin almacenamiento */ }
});

/* ------------------------------------------------------------ Menú móvil */
const menuBtn = $('.menu-btn');
const menu = $('#menu');
const cerrarMenu = () => { menu.classList.remove('abierto'); menuBtn.setAttribute('aria-expanded', 'false'); };
menuBtn.addEventListener('click', () => {
  const abierto = menu.classList.toggle('abierto');
  menuBtn.setAttribute('aria-expanded', String(abierto));
  menuBtn.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
});
menu.addEventListener('click', (e) => { if (e.target.closest('a')) cerrarMenu(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarMenu(); });

/* -------------------------------------------------- Animaciones reveal */
let observer = null;
function observarReveal(raiz = document) {
  const elementos = raiz.querySelectorAll('.reveal:not(.visible)');
  if (movimientoReducido.matches || !('IntersectionObserver' in window)) {
    elementos.forEach((e) => e.classList.add('visible'));
    return;
  }
  observer ??= new IntersectionObserver((entradas) => {
    for (const entrada of entradas) {
      if (entrada.isIntersecting) {
        entrada.target.classList.add('visible');
        observer.unobserve(entrada.target);
      }
    }
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  elementos.forEach((e) => observer.observe(e));
}

/* ------------------------------------------------------------- Proyectos */
let proyectos = [];
let tagActivo = 'todos';

function tarjetaProyecto(p) {
  const enlaces = el('div', { className: 'enlaces' });
  if (p.repo) enlaces.append(el('a', { href: p.repo, target: '_blank', rel: 'noopener', textContent: 'Código →' }));
  if (p.demo) enlaces.append(el('a', { href: p.demo, target: '_blank', rel: 'noopener', textContent: 'Demo →' }));
  return el('article', { className: 'tarjeta reveal' },
    ...(p.destacado ? [el('span', { className: 'destacado', textContent: 'Destacado' })] : []),
    el('h3', { textContent: p.titulo }),
    el('p', { textContent: p.descripcion }),
    el('ul', { className: 'tags', ariaLabel: 'Tecnologías' }, ...p.tags.map((t) => el('li', { textContent: t }))),
    enlaces,
  );
}

function renderProyectos() {
  const lista = $('#lista-proyectos');
  const visibles = filtrarPorTag(proyectos, tagActivo);
  lista.replaceChildren(...visibles.map(tarjetaProyecto));
  if (!visibles.length) lista.append(el('p', { className: 'cargando', textContent: 'No hay proyectos con esa tecnología.' }));
  document.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.tag === tagActivo)));
  observarReveal(lista);
}

function renderFiltros() {
  const chip = (tag, texto) => {
    const boton = el('button', {
      className: 'chip', type: 'button', textContent: texto,
      onclick: () => { tagActivo = tag; renderProyectos(); },
    });
    boton.dataset.tag = tag;
    return boton;
  };
  $('#filtros').replaceChildren(chip('todos', 'Todos'), ...tagsUnicos(proyectos).map((t) => chip(t, t)));
}

async function cargarProyectos() {
  try {
    const res = await fetch('data/projects.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    proyectos = normalizarProyectos(await res.json());
    renderFiltros();
    renderProyectos();
  } catch {
    $('#lista-proyectos').replaceChildren(
      el('p', { className: 'cargando', textContent: 'No se pudieron cargar los proyectos. Abre el sitio con un servidor estático (npx serve .).' }),
    );
  }
}

/* ------------------------------------------------------------ Formulario */
const form = $('#form-contacto');
const estado = $('#estado-form');
const contador = $('#contador');
const CAMPOS = ['nombre', 'email', 'asunto', 'mensaje'];

function leerFormulario() {
  return Object.fromEntries(new FormData(form));
}

function mostrarErrores(errores, soloCampo) {
  for (const campo of CAMPOS) {
    if (soloCampo && campo !== soloCampo) continue;
    const input = form.elements[campo];
    const msg = errores[campo] ?? '';
    $(`#error-${campo}`).textContent = msg;
    if (msg) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }
}

// Valida al salir de un campo (y en vivo si ya tenía error) sin ser intrusivo.
form.addEventListener('focusout', (e) => {
  const campo = e.target.name;
  if (!CAMPOS.includes(campo) || !e.target.value) return;
  mostrarErrores(validarContacto(leerFormulario()).errores, campo);
});
form.addEventListener('input', (e) => {
  if (e.target.name === 'mensaje') contador.textContent = `${e.target.value.trim().length} / ${LIMITES.mensaje.max}`;
  if (e.target.getAttribute('aria-invalid') === 'true') mostrarErrores(validarContacto(leerFormulario()).errores, e.target.name);
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const { valido, errores, datos } = validarContacto(leerFormulario());
  mostrarErrores(errores);
  estado.className = 'estado';
  if (errores.website) {
    estado.textContent = '';
    return;
  }
  if (!valido) {
    estado.classList.add('mal');
    estado.textContent = 'Revisa los campos marcados.';
    form.elements[CAMPOS.find((c) => errores[c])]?.focus();
    return;
  }
  // Sin backend: se abre el cliente de correo del visitante con el mensaje listo.
  window.location.href = construirMailto(form.dataset.destino, datos);
  estado.classList.add('ok');
  estado.textContent = '¡Listo! Se abrió tu aplicación de correo con el mensaje preparado.';
  form.reset();
  contador.textContent = `0 / ${LIMITES.mensaje.max}`;
});

/* ------------------------------------------------------------------ Init */
$('#anio').textContent = String(new Date().getFullYear());
observarReveal();
cargarProyectos();
