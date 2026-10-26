# Button Portal

Een wachtwoord-beveiligd knoppenportaal met admin-panel en een Windows 12 video-bureaublad op `/video`.

**Lokale database:** alle accounts en knoppen staan in `data/config.json`. Geen externe database of Vercel nodig.

## Functies

- **Login & dashboard** — bezoekers loggen in met een wachtwoord en zien hun knoppen
- **Gast-modus** — optionele gast-toegang zonder wachtwoord
- **Admin-panel** (`/admin`) — Bjorn kan accounts toevoegen en knoppen beheren in de browser
- **Video-systeem** (`/video`) — Windows 12-achtig bureaublad met terminal en apps
- **Beveiligde vlogs** — video's achter een code

## Design

Swiss International thema (zie `DESIGN.md`): Space Grotesk + Inter, rood accent `#E30613`, plat, geen afronding.

## Snel starten (Docker)

```bash
# Optioneel: .env met SESSION_SECRET
cp .env.example .env

docker compose up --build -d
```

Open `http://localhost:3000`

| Commando | Beschrijving |
|----------|-------------|
| `docker compose up --build -d` | Bouwen en starten |
| `docker compose logs -f` | Logs bekijken |
| `docker compose down` | Stoppen |

Data blijft in `./data` (accounts/knoppen). Video's in `./vid`.

## Deploy op Coolify

1. **Nieuwe resource** → Git-repo → **Build pack: Dockerfile**
2. **Ports Exposes:** `3000` (moet overeenkomen met `PORT` in de container)
3. **Environment variables** (minimaal):
   ```env
   SESSION_SECRET=lange-willekeurige-string
   NODE_ENV=production
   ```
   Optioneel: `VERCEL_TOKEN`, `VERCEL_TEAM_ID`, `ADMIN_VISITOR_ID=bjorn`
4. **Persistent storage** (aanbevolen):
   | Pad in container | Doel |
   |------------------|------|
   | `/app/data` | `config.json` (accounts/knoppen) |
   | `/app/vid` | Vlog-video's |
   | `/app/Bjorn-Jacht.mp4` | Bjornjacht-video (bestand uploaden/mounten) |
5. Domein + **HTTPS** in Coolify inschakelen — login-cookies worden dan automatisch `Secure` (trust proxy).
6. Health check: `/api/health` (staat ook in de Dockerfile `HEALTHCHECK`).

Bij een lege `/app/data`-volume wordt bij eerste start `config.seed.json` uit de image naar `data/config.json` gekopieerd.

## Snel starten (zonder Docker)

```bash
npm install
cp .env.example .env
# Vul SESSION_SECRET in
npm start
```

| Commando | Beschrijving |
|----------|-------------|
| `npm start` | Server starten |
| `npm run dev` | Server met auto-reload |
| `npm run editor` | Optioneel: terminal-editor voor config |

## Inloggen

1. Gebruikersnaam (bijv. `bjorn`)
2. Daarna wachtwoord

Bjorn gaat na login direct naar `/admin`. Andere accounts naar `/dashboard`.

## Admin (Bjorn)

1. Log in met gebruikersnaam **bjorn** + wachtwoord
2. Of vanuit dashboard: knop **Admin**
3. Voeg bezoekers toe en pas knoppen aan
4. Onder **Website-pagina's** kun je paden van deze site openen
5. Onder **Vercel-projecten** kun je projecten van Vercel laden en als knoppen importeren

Wijzigingen worden opgeslagen in `data/config.json`.

Admin-id: `bjorn` (of `ADMIN_VISITOR_ID` in `.env`).

### Vercel-koppeling (optioneel)

1. Maak een token: [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Zet in `.env`:
   ```env
   VERCEL_TOKEN=vcp_xxxxxxxx
   # optioneel bij een team:
   VERCEL_TEAM_ID=team_xxxxxxxx
   ```
3. Herstart de server
4. In Admin → selecteer een bezoeker → **Vernieuwen** bij Vercel → selecteer projecten → **Geselecteerde toevoegen** of **Alles toevoegen**

## Pagina's

| Route | Beschrijving |
|-------|-------------|
| `/` | Login |
| `/dashboard` | Knoppen-dashboard |
| `/admin` | Admin-panel (alleen Bjorn) |
| `/video`, `/vid` | Windows 12 video-bureaublad |
| `/bjornjacht` | Directe fullscreen video |
| `/finoviapps` | App privacy policies |

## Configuratie

### `.env`

```env
SESSION_SECRET=jouw-geheime-string
PORT=3000
ADMIN_VISITOR_ID=bjorn
```

### `data/config.json`

Lokale database voor bezoekers en knoppen:

```json
{
  "visitors": [
    {
      "id": "bjorn",
      "name": "Bjorn",
      "passwordHash": "$2a$10$...",
      "mode": "custom",
      "buttons": [
        { "label": "Google", "url": "https://google.com" }
      ]
    }
  ]
}
```

## Vlogs

```
vid/
  mijnvlog/
    code.txt
    video.mp4
```

Terminal op `/video`: `access` → username → password.

## Projectstructuur

```
├── app.js              Express routes
├── server.js           Lokale server
├── data/config.json    Lokale database (accounts + knoppen)
├── DESIGN.md           Design tokens
├── lib/                Backend modules
├── public/             Frontend
└── vid/                Vlog-video's
```
