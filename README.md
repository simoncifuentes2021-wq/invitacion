# Invitacion Digital

Proyecto estatico listo para desarrollo local y despliegue en Vercel.

## 1. Instalar dependencias

```bash
npm install
```

## 2. Ejecutar en desarrollo

```bash
npm run dev
```

Abre `http://localhost:3000`.

## 3. Hacer build

```bash
npm run build
```

El resultado se genera en `dist/`.

## 4. Levantar en produccion local

```bash
npm run start
```

Abre `http://localhost:4173`.

## 5. Desplegar

### Vercel

```bash
npm run build
```

Luego despliega el proyecto en Vercel. La configuracion ya usa:

- `buildCommand`: `npm run build`
- `outputDirectory`: `dist`

Si usas la CLI:

```bash
vercel
```

## 6. Personalizacion por invitado

La invitacion ahora acepta enlaces unicos por invitado:

```text
https://tu-dominio.vercel.app/?id=familia-perez
```

Los datos se editan en `data/invitados.json`.

Cada invitado puede tener:

- `id`: identificador unico para el link
- `tituloPortada`: texto pequeno de la portada
- `nombrePortada`: nombre que aparece en la portada
- `saludoHero`: saludo personalizado
- `mensajeHero`: mensaje principal
- `cantidadPases`: cupos reservados
- `whatsappNombre`: nombre que se envia al confirmar por WhatsApp

Ejemplo:

```json
{
  "id": "tia-elena",
  "tituloPortada": "Invitacion especial",
  "nombrePortada": "Tia Elena",
  "saludoHero": "Tia Elena, esta invitacion ha sido preparada especialmente para ti.",
  "mensajeHero": "Nos encantaria compartir contigo este dia tan importante para nosotros.",
  "cantidadPases": 1,
  "whatsappNombre": "Tia Elena"
}
```
