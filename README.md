# Tarka Site — Ward 16 Heritage Adventure

The original Aarav canvas game is preserved at `public/game/original-game-backup.html`. The integrated adventure view runs a working copy at `public/game/adventure.html`; game discoveries open the corresponding researched story and update the shared six-item progress counter. The game's fictional world is clearly identified as separate from the real map.

## Run locally (Windows PowerShell)

```powershell
cd 'D:\tarka site'
npm install
Copy-Item .env.example .env
# Edit .env and add your OpenRouteService key
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

For a production build:

```powershell
npm run build
npm run preview
```

## Real map and walking directions

- Leaflet 1.9.4 displays OpenStreetMap tiles and exactly four destination markers.
- The four destination coordinates come from the Google Maps route link supplied with this project. The listed route order is Siddhi Ganesh → Mhepi Ajima → Balaju 22 Dhara → Nanak Math.
- Browser geolocation uses `watchPosition` during navigation. If access is unavailable, click the map to choose a manual starting point.
- OpenRouteService `foot-walking` directions are requested for the chosen start and destination. Distance, duration and step instructions come from the route response. Off-route GPS updates trigger recalculation.
- Set `VITE_ORS_API_KEY` in `.env`. Create a key at [openrouteservice.org](https://openrouteservice.org/dev/#/signup); restart Vite after changing `.env`. For public deployment, proxy route requests through a server so the key is not exposed in browser code.
- Geolocation requires a secure context; localhost is supported during development. Map tiles and routing require an internet connection.

## Content and photographs

Six concise heritage entries are editable in `src/heritage.json`. Their descriptions match the supplied research PDF. The six photos embedded in that PDF are extracted into `public/images/` and used by both the discovery cards and destination previews. Replace them with higher-resolution field photographs whenever available. The two additional discoveries (Koncha Dyo and Pyatho Ajima / Sitalamai) share the nearest main destination and do not get their own GPS markers.

## Project structure

```text
tarka site/
├── index.html
├── package.json
├── .env.example
├── README.md
├── public/
│   ├── game/
│   │   ├── original-game-backup.html
│   │   └── adventure.html
│   └── images/                 # Six photos extracted from the supplied research PDF
└── src/
    ├── app.js                  # Modes, discoveries, Leaflet, GPS and routing
    ├── heritage.json           # Editable six-entry heritage content
    └── style.css               # Responsive visual system
```
