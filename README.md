# Portfolio — Killian Cottrelle

Site portfolio (React + Vite) présentant VoxelEngine et OrbitSim,
avec données synchronisées depuis l'API GitHub. Déployé sur GitHub Pages.

## Déploiement (une seule fois)

1. Crée un dépôt **public** nommé exactement `Krio18.github.io`
2. Pousse ce projet dessus :
   ```bash
   git init
   git add .
   git commit -m "Portfolio initial"
   git branch -M main
   git remote add origin https://github.com/Krio18/Krio18.github.io.git
   git push -u origin main
   ```
3. Sur GitHub : **Settings → Pages → Source : "GitHub Actions"**
4. Attends ~1 minute que l'action tourne → le site est en ligne sur
   **https://krio18.github.io**

Ensuite, chaque `git push` redéploie automatiquement.

## Développement local

```bash
npm install
npm run dev      # http://localhost:5173
```

## Modifier le contenu

Tout le contenu est dans `src/Portfolio.jsx` :
- `PROFILE` : nom, email, liens, CV
- `PROJECTS` : pitch, décisions techniques, phases de roadmap, fallback GitHub
- Les stats GitHub (stars, commits, langages) se mettent à jour toutes seules
  à chaque visite via l'API publique.
