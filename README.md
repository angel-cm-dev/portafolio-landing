# portafolio-landing

Plantilla de landing/portafolio personal one-page, profesional y sin dependencias: HTML, CSS y JavaScript vanilla.

![HTML5](https://img.shields.io/badge/HTML5-CSS3-E34F26?logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?logo=javascript&logoColor=black)
![Licencia MIT](https://img.shields.io/badge/licencia-MIT-blue.svg)
[![CI](https://github.com/angel-cm-dev/portafolio-landing/actions/workflows/ci.yml/badge.svg)](https://github.com/angel-cm-dev/portafolio-landing/actions/workflows/ci.yml)

## Características

- Secciones: **hero**, **servicios**, **proyectos**, **stack** y **contacto**, con navegación fija y menú móvil accesible.
- **Proyectos desde `data/projects.json`**: tarjetas generadas dinámicamente, filtros por tecnología y destacados primero; las URLs se sanean (solo `http/https`).
- **Formulario de contacto validado** (nombre, correo, asunto opcional, mensaje con contador), mensajes de error accesibles (`aria-invalid`, `aria-live`), honeypot anti-spam y envío mediante **`mailto:`** (sin backend).
- **SEO**: meta description, canonical, Open Graph, Twitter Card y datos estructurados JSON-LD (`Person`).
- **Modo oscuro** automático según el sistema y con interruptor persistente.
- **Animaciones sutiles** al hacer scroll con `IntersectionObserver`, desactivadas con `prefers-reduced-motion`.
- Responsive, enlace "saltar al contenido", foco visible y contraste adecuado.

## Requisitos

- Un navegador moderno.
- Node.js 20+ para las pruebas (o Python 3 para servir los archivos).

## Instalación y uso

```bash
git clone https://github.com/angel-cm-dev/portafolio-landing.git
cd portafolio-landing

npx serve .
# o
python -m http.server 5175
```

Abre `http://localhost:3000` (serve) o `http://localhost:5175` (Python). Se requiere un servidor estático porque los proyectos se cargan con `fetch`.

### Personalización

1. **Datos personales y SEO**: edita textos, `<title>`, metas Open Graph y JSON-LD en `index.html`.
2. **Correo de destino**: cambia `data-destino="contacto@tudominio.pe"` en el `<form id="form-contacto">`.
3. **Proyectos**: edita `data/projects.json`.
4. **Colores**: variables CSS en `:root` de `css/styles.css`.
5. **Imagen social**: `assets/og-image.svg` sirve de base; para máxima compatibilidad con redes sociales, expórtala a PNG de 1200×630 y actualiza `og:image`.

## Ejemplo de uso

Formato de `data/projects.json`:

```json
[
  {
    "titulo": "API de facturación",
    "descripcion": "API REST en .NET 8 con JWT y OpenAPI.",
    "tags": [".NET", "C#", "API"],
    "repo": "https://github.com/angel-cm-dev/mi-api",
    "demo": "https://demo.midominio.pe",
    "destacado": true
  }
]
```

La validación es reutilizable fuera del DOM:

```js
import { validarContacto, construirMailto } from './js/validacion.js';

const { valido, errores, datos } = validarContacto({
  nombre: 'Ana Pérez',
  email: 'ana@empresa.pe',
  mensaje: 'Hola, quisiera cotizar una automatización con n8n.',
});

if (valido) location.href = construirMailto('contacto@tudominio.pe', datos);
else console.log(errores); // { campo: 'mensaje de error' }
```

## Estructura del proyecto

```
portafolio-landing/
├── index.html
├── css/styles.css
├── js/
│   ├── app.js            # Interfaz: tema, menú, animaciones, proyectos y formulario
│   ├── validacion.js     # Validación del formulario y mailto (lógica pura)
│   └── proyectos.js      # Normalización y filtrado de proyectos (lógica pura)
├── data/projects.json
├── assets/               # favicon y imagen Open Graph
├── test/validacion.test.js
└── .github/workflows/ci.yml
```

## Pruebas

```bash
npm test
```

20 pruebas con `node:test`: correos válidos/inválidos, límites de cada campo, nombres con tildes y ñ, honeypot, construcción segura del `mailto:` (sin inyección de cabeceras), saneamiento de URLs y validez de `data/projects.json`.

## Roadmap

- [ ] Envío real opcional mediante webhook de n8n o Formspree.
- [ ] Versión en inglés con selector de idioma.
- [ ] Despliegue automático a GitHub Pages desde GitHub Actions.

## Licencia y autor

Distribuido bajo licencia [MIT](LICENSE).

Desarrollado por **Angel Castañeda Meza** — Ingeniero de Sistemas, Lima, Perú.
GitHub: [@angel-cm-dev](https://github.com/angel-cm-dev)
