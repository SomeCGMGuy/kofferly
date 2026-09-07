# Kofferly

Kofferly ist eine kleine, offlinefähige PWA für Reiseplanung, Packliste und gespeicherte Wettervorhersagen.

## Inhalt

- `index.html` – App-Oberfläche
- `app.css` – mobiles App-Layout
- `app.js` – Packliste, lokale Speicherung, Wetter und Navigation
- `manifest.webmanifest` – PWA-Metadaten
- `sw.js` – Offline-App-Shell
- `icons/` – App-Icons

## Start

Für die reine Packliste kann `index.html` direkt geöffnet werden. Für eine **installierbare PWA** muss Kofferly über `https://` oder `localhost` ausgeliefert werden, weil Browser Service Worker nicht über `file://` registrieren.

Einfachste Variante: die Dateien in ein GitHub-Repository legen und GitHub Pages aktivieren. Danach die Seite in Chrome auf Android öffnen und „Zum Startbildschirm hinzufügen“ bzw. „App installieren“ wählen.

## Wetter

Kofferly verwendet die kostenlosen Open-Meteo-Endpunkte für Ortssuche und Vorhersage. Es ist kein API-Key hinterlegt. Beim Aktualisieren wird Internet benötigt. Die zuletzt erfolgreiche Vorhersage wird lokal gespeichert und kann danach offline angezeigt werden.

## Datenschutz

Es gibt kein Benutzerkonto, keine Werbung und keine Analyse-Tracker. Packlistenstatus, Reisedaten und Wetter-Cache liegen im `localStorage` des Browsers.

## Branding – Forest Green

Diese Ausgabe verwendet das festgelegte Kofferly-Branding: Forest Green (`#0F5132`), weißes K-Monogramm mit Gepäckgriff und warmem Sun-Akzent (`#F4C95D`). Das PWA-Icon-Set enthält Standard- und Maskable-Icons sowie ein Apple-Touch-Icon. Der App-Header verwendet dasselbe Markenicon wie der Homescreen.
