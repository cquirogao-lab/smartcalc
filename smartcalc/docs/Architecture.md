# SmartCalc Prime
## Arquitectura del Proyecto

Versión: 2.1.0

---

# Objetivo

Diseñar una plataforma modular, escalable y fácil de mantener, permitiendo agregar nuevas calculadoras y funcionalidades sin modificar la estructura principal del proyecto.

---

# Arquitectura General

SmartCalc Prime se organiza mediante módulos independientes.

Cada calculadora debe ser desarrollada de forma autónoma para facilitar el mantenimiento y permitir futuras migraciones a otros frameworks como React o Vue.

La estructura principal del proyecto es:

```
smartcalc/

assets/
calculators/
components/
docs/
pages/
seo/

index.html
styles.css
app.js
```

---

# Responsabilidad de cada carpeta

## assets

Contiene todos los recursos gráficos y técnicos.

- css
- js
- fonts
- icons
- images

---

## calculators

Contendrá cada calculadora como un módulo independiente.

Ejemplo:

```
calculators/

cientifica/
imc/
iva/
interes/
```

---

## components

Componentes reutilizables.

Ejemplos:

- Header
- Footer
- Cards
- Botones
- Modales

---

## pages

Páginas independientes.

Ejemplos:

- Contacto
- Acerca de
- Política de privacidad

---

## seo

Archivos relacionados con SEO.

Ejemplos:

- sitemap.xml
- robots.txt
- schema
- metadata

---

## docs

Documentación completa del proyecto.

Nunca contendrá código de producción.

---

# Filosofía

Una modificación en una calculadora no debe afectar a las demás.

Cada módulo debe poder evolucionar de manera independiente.

La prioridad será siempre:

- claridad
- rendimiento
- escalabilidad
- mantenibilidad