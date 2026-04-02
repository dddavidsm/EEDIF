# EEDIF - InspecApp

Aplicacion web para inspeccion tecnica de edificios (SOCOTEC), desarrollada con React + TypeScript + Vite.

## Stack

- React 19
- TypeScript
- Vite 7
- Zustand
- Tailwind CSS 4
- Dexie (IndexedDB)
- Konva (croquis y marcado)
- jsPDF / XLSX / ZIP (exportaciones)
- PWA (vite-plugin-pwa)

## Requisitos

- Node.js 20+ recomendado
- npm 10+

## Desarrollo local

```bash
npm install
npm run dev
```

Servidor local por defecto:

```text
http://localhost:5173
```

## Build de produccion

```bash
npm run build
```

Salida de build:

```text
dist/
```

## Preview local de produccion

```bash
npm run preview
```

## Despliegue en Vercel

### Opcion A: desde dashboard (recomendada)

1. Importa el repositorio `dddavidsm/EEDIF` en Vercel.
2. Configura:
   - Framework Preset: `Vite`
   - Root Directory: `.`
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Deploy.

### Opcion B: con Vercel CLI

```bash
npm i -g vercel
vercel
vercel --prod
```

## Notas de CI/CD

- El proyecto esta en la raiz del repo (no en subcarpeta).
- La carpeta `.vite` se ignora en git.
- Si Vercel falla por cache, usar `Redeploy without cache`.

## Scripts disponibles

- `npm run dev` -> desarrollo
- `npm run build` -> build produccion
- `npm run preview` -> preview build
- `npm run lint` -> lint
