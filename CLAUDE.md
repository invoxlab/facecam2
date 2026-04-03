# TelePrompt — Instructions Claude Code

## Contexte
PWA React de téléprompteur mobile. Permet de lire un script face caméra, de s'enregistrer, et de télécharger la vidéo propre (sans texte incrusté).

## Stack
- React 18 + TypeScript + Vite 5
- Tailwind CSS
- Zustand (état global)
- idb (IndexedDB)
- vite-plugin-pwa
- React Router v6

## Conventions
- Composants fonctionnels uniquement (pas de classes)
- Hooks custom dans src/hooks/
- Types dans src/types/
- Un composant par fichier
- Nommage : PascalCase pour les composants, camelCase pour les hooks/utils
- CSS : Tailwind uniquement, pas de CSS modules
- Interface en français

## Commandes
- `npm run dev` — serveur de développement (port 5173)
- `npm run build` — build production
- `npm run preview` — preview du build

## APIs navigateur critiques
- getUserMedia : caméra + micro
- MediaRecorder : enregistrement vidéo
- IndexedDB (via idb) : persistance projets
- requestAnimationFrame : défilement texte (TOUJOURS utiliser transform, JAMAIS scrollTop)

## Pièges à éviter
- Safari iOS : pas de requestFullscreen, utiliser 100dvh + meta viewport
- MediaRecorder : le mime type varie selon le navigateur, toujours détecter
- Mode miroir : appliquer le miroir CSS sur le <video> d'affichage UNIQUEMENT, pas sur le stream enregistré
- Blob URL : TOUJOURS appeler URL.revokeObjectURL() au cleanup
- Wake Lock API : l'écran doit rester allumé pendant le prompteur
