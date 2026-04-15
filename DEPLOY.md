# Deploy to Cloudflare Pages

## Quick deploy (drag-and-drop)

1. Go to https://dash.cloudflare.com/
2. Select **Workers & Pages** → **Create application** → **Pages** → **Upload assets**
3. Project name: `image-compressor` (or whatever you like)
4. Drag and drop `image-compressor-cloudflare.zip` onto the upload area
5. Click **Deploy site**
6. Your app will be live at `https://image-compressor.pages.dev` in ~30 seconds

## Custom domain (optional)

After deployment:
1. Go to your project → **Custom domains** → **Set up a custom domain**
2. Add your domain (you must own it and have it on Cloudflare or add a CNAME elsewhere)

## Re-deploy after code changes

1. Run `npm run build` locally
2. Re-create the zip: run the zip script again
3. Upload the new zip through the same Cloudflare Pages interface

## About this build

- Fully static — no server, no API keys
- All image processing happens in the user's browser
- No data is uploaded or tracked
- Works offline after first load
