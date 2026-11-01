import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validarContacto, validarEmail, construirMailto, limpiar, LIMITES } from '../js/validacion.js';
import { normalizarProyectos, tagsUnicos, filtrarPorTag, urlSegura } from '../js/proyectos.js';

const valido = {
  nombre: 'María José Ñañez',
  email: 'maria@empresa.com.pe',
  asunto: 'Cotización de API',
  mensaje: 'Hola, quisiera cotizar una API REST para mi negocio.',
  website: '',
};

describe('limpiar y validarEmail', () => {
  test('limpiar recorta y colapsa espacios', () => {
    assert.equal(limpiar('  Ana   Pérez  '), 'Ana Pérez');
    assert.equal(limpiar(undefined), '');
  });
  test('correos válidos', () => {
    for (const e of ['a@b.co', 'nombre.apellido@empresa.com.pe', 'user+tag@gmail.com', 'x_y@sub.dominio.org']) {
      assert.equal(validarEmail(e), true, e);
    }
  });
  test('correos inválidos', () => {
    for (const e of ['', 'sin-arroba', 'a@b', 'a@b.c', 'a b@c.com', 'a@@b.com', 'a..b@c.com', '@dominio.com', 'a@-dominio.com', `${'a'.repeat(250)}@b.com`]) {
      assert.equal(validarEmail(e), false, e);
    }
  });
});

describe('validarContacto', () => {
  test('acepta un formulario correcto y normaliza datos', () => {
    const r = validarContacto({ ...valido, email: '  MARIA@Empresa.com.pe ' });
    assert.equal(r.valido, true);
    assert.deepEqual(r.errores, {});
    assert.equal(r.datos.email, 'maria@empresa.com.pe');
  });

  test('todos los campos obligatorios vacíos', () => {
    const r = validarContacto({});
    assert.equal(r.valido, false);
    assert.deepEqual(Object.keys(r.errores).sort(), ['email', 'mensaje', 'nombre']);
  });

  test('el asunto es opcional', () => {
    assert.equal(validarContacto({ ...valido, asunto: '' }).valido, true);
  });

  test('nombre: longitud y caracteres', () => {
    assert.match(validarContacto({ ...valido, nombre: 'A' }).errores.nombre, /al menos 2/);
    assert.match(validarContacto({ ...valido, nombre: 'A'.repeat(LIMITES.nombre.max + 1) }).errores.nombre, /superar/);
    assert.match(validarContacto({ ...valido, nombre: 'Robot 3000' }).errores.nombre, /solo puede contener letras/);
    assert.match(validarContacto({ ...valido, nombre: '<script>' }).errores.nombre, /letras/);
    assert.equal(validarContacto({ ...valido, nombre: "D'Angelo O'Connor-Ruiz" }).valido, true);
  });

  test('email inválido', () => {
    assert.match(validarContacto({ ...valido, email: 'maria@' }).errores.email, /correo válido/);
  });

  test('asunto demasiado corto o largo', () => {
    assert.ok(validarContacto({ ...valido, asunto: 'Hi' }).errores.asunto);
    assert.ok(validarContacto({ ...valido, asunto: 'x'.repeat(121) }).errores.asunto);
  });

  test('mensaje: mínimo y máximo, informa la longitud actual', () => {
    const corto = validarContacto({ ...valido, mensaje: 'Hola' });
    assert.match(corto.errores.mensaje, /llevas 4/);
    assert.ok(validarContacto({ ...valido, mensaje: 'x'.repeat(2001) }).errores.mensaje);
    assert.equal(validarContacto({ ...valido, mensaje: 'x'.repeat(20) }).valido, true);
  });

  test('mensaje con solo espacios cuenta como vacío', () => {
    assert.equal(validarContacto({ ...valido, mensaje: '     \n   ' }).errores.mensaje, 'Escribe un mensaje.');
  });

  test('honeypot relleno bloquea el envío', () => {
    const r = validarContacto({ ...valido, website: 'http://spam.example' });
    assert.equal(r.valido, false);
    assert.ok(r.errores.website);
  });
});

describe('construirMailto', () => {
  test('codifica asunto y cuerpo', () => {
    const url = construirMailto('contacto@tudominio.pe', validarContacto(valido).datos);
    assert.ok(url.startsWith('mailto:contacto@tudominio.pe?subject='));
    const params = new URLSearchParams(url.split('?')[1]);
    assert.equal(params.get('subject'), 'Cotización de API');
    assert.match(params.get('body'), /quisiera cotizar/);
    assert.match(params.get('body'), /maria@empresa\.com\.pe/);
  });
  test('asunto por defecto si no se indica', () => {
    const url = construirMailto('a@b.pe', { ...valido, asunto: '' });
    const params = new URLSearchParams(url.split('?')[1]);
    assert.equal(params.get('subject'), `Contacto desde el portafolio — ${valido.nombre}`);
  });
  test('evita inyección de cabeceras con saltos de línea', () => {
    const url = construirMailto('a@b.pe', { ...valido, asunto: 'Hola\r\nBcc: victima@x.com' });
    assert.ok(!decodeURIComponent(url.split('subject=')[1].split('&')[0]).includes('\n'));
  });
  test('rechaza destino inválido', () => {
    assert.throws(() => construirMailto('no-es-correo', valido), TypeError);
  });
});

describe('proyectos', () => {
  test('urlSegura solo permite http(s)', () => {
    assert.equal(urlSegura('https://github.com/angel-cm-dev'), 'https://github.com/angel-cm-dev');
    assert.equal(urlSegura('javascript:alert(1)'), null);
    assert.equal(urlSegura('data:text/html,hola'), null);
    assert.equal(urlSegura(undefined), null);
  });
  test('normaliza, descarta inválidos y ordena destacados primero', () => {
    const lista = normalizarProyectos([
      { titulo: 'B', descripcion: 'd', tags: ['JS', 'JS', ' ', 3] },
      { titulo: 'A', descripcion: 'd', destacado: true, repo: 'javascript:alert(1)' },
      { titulo: '', descripcion: 'x' },
      null,
    ]);
    assert.deepEqual(lista.map((p) => p.titulo), ['A', 'B']);
    assert.equal(lista[0].repo, null);
    assert.deepEqual(lista[1].tags, ['JS']);
    assert.deepEqual(normalizarProyectos('no'), []);
  });
  test('tags únicos y filtro', () => {
    const lista = normalizarProyectos([
      { titulo: 'A', descripcion: '', tags: ['Node.js', 'Docker'] },
      { titulo: 'B', descripcion: '', tags: ['Docker', '.NET'] },
    ]);
    assert.deepEqual(tagsUnicos(lista), ['.NET', 'Docker', 'Node.js']);
    assert.deepEqual(filtrarPorTag(lista, 'Docker').map((p) => p.titulo), ['A', 'B']);
    assert.deepEqual(filtrarPorTag(lista, '.NET').map((p) => p.titulo), ['B']);
    assert.equal(filtrarPorTag(lista, 'todos').length, 2);
  });
  test('data/projects.json es válido', async () => {
    const datos = JSON.parse(await readFile(new URL('../data/projects.json', import.meta.url), 'utf8'));
    const lista = normalizarProyectos(datos);
    assert.equal(lista.length, datos.length);
    assert.ok(lista.every((p) => p.repo && p.tags.length));
  });
});
