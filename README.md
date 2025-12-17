# Météo interactive

Ce projet est une petite application météo locale (OpenWeatherMap) avec :

- Recherche de ville avec autocomplétion
- Prévisions horaires et vue 5 jours
- Graphiques SVG simples (sparkline + prévisions)
- Basculer unités °C / °F
- Historique des dernières recherches (localStorage)
- Animations visuelles (pluie, soleil, nuages)
- Mode clair / sombre
- Responsive 100%

Installation / usage

1. Ouvrir `index.html` dans un navigateur récent.
2. Renseigner votre clé API OpenWeather (déjà définie dans `script.js`) ou remplacer `API_KEY`.

Remarques techniques

- L'app utilise l'API `geo/1.0/direct` et `data/2.5/forecast` d'OpenWeatherMap.
- L'historique utilise `localStorage` (max 8 entrées).
- Les images d'icônes proviennent du CDN OpenWeather.

Prochaine étape recommandée

- Extraire la clé API côté serveur pour éviter l'exposition côté client.
- Ajouter tests unitaires et intégration visuelle.
- Améliorer les animations (canvas / particles) pour plus de réalisme.

---

Fichiers modifiés:
- `index.html` (UI: toggles, history, forecast)
- `script.js` (nouveaux comportements et corrections)
- `style.css` (styles pour responsive, animations, UI)
