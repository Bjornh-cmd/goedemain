https://asia.canon/en/support/0200395215?utm_source=copilot.com# Button Portal

Een wachtwoord-beveiligd knoppenportaal met admin-panel en een **Windows 12 Web Edition** video-bureaublad op `/video`.

## Functies

- **Login & dashboard** — bezoekers loggen in met een wachtwoord en zien hun persoonlijke knoppen
- **Gast-modus** — optionele gast-toegang zonder wachtwoord
- **Admin-panel** (`/admin`) — bezoekers en knoppen beheren
- **Video-systeem** (`/video`) — Windows 12-achtig bureaublad met terminal, browser en apps
- **Beveiligde vlogs** — video's achter een code, lokaal of via externe link

## Snel starten

```bash
# Dependencies installeren
npm install

# .env aanmaken
cp .env.example .env
# Vul SESSION_SECRET in

# Server starten
npm start
```

Open `http://localhost:3000`

| Commando | Beschrijving |
|----------|-------------|
| `npm start` | Server starten (lokale config) |
| `npm run dev` | Server met auto-reload (nodemon) |
| `npm run editor` | Bezoekers/knoppen bewerken via terminal |
| `npm run db:seed` | Database vullen (optioneel, poort 5505) |

## Pagina's

| Route | Beschrijving |
|-------|-------------|
| `/` | Login-pagina |
| `/dashboard` | Knoppen-dashboard |
| `/admin` | Admin-panel |
| `/video`, `/vid`, `/videos` | Windows 12 video-bureaublad |
| `/vlog` | Redirect naar `/video` |

## Windows 12 Video Desktop (`/video`)

Geïnspireerd door [Windows 12 Web Edition](https://lttthedev.github.io/desktop.html).

### Bureaublad-apps

- **Terminal** — command-line met 35+ commando's
- **Google Chrome** — browser via ingebouwde proxy
- **Kladblok** — teksteditor
- **Rekenmachine** — werkende calculator
- **Verkenner** — virtueel bestandssysteem
- **Instellingen** — systeemopties
- **Over Windows** — versie-informatie

### Terminal-commando's

Typ `help` in de terminal voor het volledige overzicht.

| Categorie | Commando's |
|-----------|-----------|
| **Systeem** | `help`, `man`, `clear`, `exit`, `ver`, `hostname`, `whoami`, `date`, `time`, `uptime`, `echo`, `color`, `history`, `reboot`, `shutdown`, `neofetch` |
| **Netwerk** | `ping`, `ipconfig`, `curl` |
| **Bestanden** | `pwd`, `cd`, `ls`, `cat`, `tree` |
| **Apps** | `access`, `browser`, `notepad`, `calc`, `settings`, `explorer`, `about`, `open`, `taskmgr` |
| **Leuk** | `fortune`, `cowsay`, `sudo`, `vim` |

### Video openen

```
access
username: vlog
password: [code uit code.txt]
```

## Vlogs configureren

Plaats vlogs in de map `vid/`:

```
vid/
  mijnvlog/
    code.txt      ← wachtwoord
    video.mp4     ← lokaal videobestand
```

Of met een externe link:

```
vid/
  mijnvlog/
    code.txt      ← wachtwoord
    link.txt      ← URL (één regel, bijv. YouTube-link)
```

## Configuratie

### `.env`

```env
SESSION_SECRET=jouw-geheime-string
PORT=3000
```

### `data/config.json`

Bezoekers en knoppen (lokale modus):

```json
{
  "visitors": [
    {
      "id": "bjorn",
      "name": "Bjorn",
      "password_hash": "$2a$10$...",
      "mode": "custom",
      "buttons": [
        { "label": "Google", "url": "https://google.com" }
      ]
    }
  ]
}
```

## Vercel deployen

1. Push naar GitHub
2. Importeer in [Vercel](https://vercel.com)
3. Zet `SESSION_SECRET` in Environment Variables
4. Deploy

`data/config.json` moet in de repo staan. Video-bestanden (`.mp4`) werken op Vercel beperkt — gebruik `link.txt` voor externe video's.

## Projectstructuur

```
├── app.js              Express routes
├── server.js           Lokale dev-server
├── api/index.js        Vercel entrypoint
├── data/config.json    Bezoekers & knoppen
├── lib/                Backend modules
├── public/
│   ├── video.html      Windows 12 desktop
│   ├── css/win12.css   Windows 12 styling
│   └── js/video.js     Desktop + terminal logica
├── vid/                Vlog-video's
└── vercel.json         Vercel config
```

## Licentie

Privé project — Button Portal.
