# Image Compressor

A privacy-friendly, browser-based image compression tool. Upload images via drag-and-drop, compress them client-side, and download individually or as a ZIP. No server, no uploads — everything runs in your browser.

## Features

- Drag-and-drop upload (up to 100 images per batch)
- Supports JPEG, PNG, WebP, BMP, GIF, TIFF, SVG, HEIC/HEIF
- Visually lossless compression (TinyPNG-level quality)
- Optional WebP conversion
- Optional resize to max dimension (360 / 720 / 1024 / 2048 / 4096 px)
- Strips all metadata (EXIF, GPS, AI markers)
- Injects realistic smartphone camera EXIF data (iPhone / Samsung profiles)
- Download individual images or all as a ZIP
- Progress tracking per image with retry on failure

## Tech stack

- Vite + React + TypeScript
- Tailwind CSS v4
- `browser-image-compression` for raster formats
- `svgo` for SVG optimization
- `gifsicle-wasm-browser` for GIF compression
- `libheif-js` for HEIC/HEIF decoding
- `piexifjs` for EXIF injection
- `jszip` + `file-saver` for ZIP downloads

## Development

```bash
npm install
npm run dev      # start dev server at http://localhost:5173
npm run build    # build for production (output: dist/)
```

## Deploy to Cloudflare Pages

1. Run `npm run build`
2. Connect this repo to Cloudflare Pages, or upload `dist/` directly via the Cloudflare dashboard
3. Build command: `npm run build`
4. Build output directory: `dist`

## Privacy

All image processing happens entirely in your browser. Nothing is uploaded, logged, or tracked. The app is a pure static site.
