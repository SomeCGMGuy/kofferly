# Kofferly – Offline-first PWA

Kofferly ist eine reine HTML/CSS/JavaScript-PWA ohne Build-Schritt.

## Enthalten

- Offline-first PWA mit Service Worker
- IndexedDB für Reisen, Packlisten, Einstellungen, Reisezielbilder und Wetter-Cache
- Reisezielbild passend zum Ziel über Wikimedia Commons
- Speicherung des Zielbilds als komprimierter Blob in IndexedDB
- „Anderes Bild“-Funktion
- Wetter über Open-Meteo, anschließend offline verfügbar
- Packlisten mit Kategorien und wichtigen Einträgen
- Erinnerungslogik abhängig vom Abreisedatum
- Löschbestätigung für Reisen und Packlisteneinträge
- responsives Kofferly-Design in Forest Green

## Starten

PWA-Funktionen benötigen HTTP(S). Nicht direkt `index.html` per `file://` öffnen.

### Python

```bash
cd kofferly-pwa
python -m http.server 8080
```

Dann `http://localhost:8080` öffnen.

### Node

```bash
npx serve .
```

## Android installieren

In Chrome die Seite öffnen und „App installieren“ / „Zum Startbildschirm hinzufügen“ wählen.

## Offline-Verhalten

Nach dem ersten Laden wird die App-Shell durch den Service Worker gecacht.
Reisen und Packlisten sind lokal in IndexedDB.
Reisezielbilder werden online geladen, auf ca. 1600 px Breite reduziert und als JPEG-Blob in IndexedDB gespeichert.
Wetter wird online über Open-Meteo geladen und lokal gespeichert.

Es gibt absichtlich keinen Push-Server. Erinnerungen werden beim Öffnen der App anhand des Abreisedatums berechnet.

## Bildquelle

Wikimedia Commons. Lizenz-, Autor- und Quelleninformationen werden zusammen mit dem lokalen Bilddatensatz gespeichert.
