# Odysseus Pages Repo

This folder is a standalone GitHub Pages-ready repo for the Odysseus website.

It intentionally includes only the website source and the web-ready assets.
It does not depend on the LaTeX paper sources or the raw `mario-video/` folder.

## Commands

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal.
Do not open `index.html` directly in the browser; it is only the React mount file.

## Build

```bash
npm run build
npm run preview
```

The Vite config uses a relative `base`, so this repo can be deployed to GitHub Pages
without needing changes to asset paths.

## What To Push

If you want a clean GitHub repo for the website only, push the contents of this folder:

```bash
cd odysseus-pages
git init
git add .
git commit -m "Initial Odysseus website"
```

Then connect it to your GitHub Pages repository and push.

## GitHub Pages

This folder now includes a workflow at `.github/workflows/deploy.yml`.

After pushing this folder to GitHub:

1. Open the repository on GitHub.
2. Go to `Settings -> Pages`.
3. Set `Source` to `GitHub Actions`.
4. Push to `main` or run the workflow manually from the `Actions` tab.

The workflow will install dependencies, build the site, and deploy `dist/` to GitHub Pages.
