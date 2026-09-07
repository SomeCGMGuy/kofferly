# Kofferly – Offline-first PWA

Version **0.2.0**

Kofferly ist eine reine HTML/CSS/JavaScript-PWA ohne Build-Schritt.

## Enthalten

- Offline-first PWA mit Service Worker
- IndexedDB für Reisen, Packlisten, Einstellungen, Reisezielbilder und Wetter-Cache
- Reisezielbild passend zum Ziel über Wikimedia Commons
- Speicherung des Zielbilds als komprimierter Blob in IndexedDB
- „Anderes Bild“-Funktion
- Wetter über Open-Meteo, anschließend offline verfügbar
- optionaler separater Wetterort für Regionen wie „Südtirol“
- mengenbasierte Packempfehlung aus Reisedauer, Zieltyp und Wetter
- kurze Begründungen für automatisch empfohlene Mengen
- Erinnerungslogik abhängig vom Abreisedatum
- Löschbestätigung für Reisen und Packlisteneinträge
- responsives Kofferly-Design in Forest Green
- Design-Mockups im Projekt unter `docs/mockups/`

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

## Wetter

Kofferly verwendet Open-Meteo. Bei einem konkreten Reiseziel wie „Meran“ oder „Dorf Tirol“ kann das Reiseziel direkt als Wetterort verwendet werden. Bei Regionen oder Ländern kann im Reise-Dialog bzw. auf der Wetterkarte ein eigener Wetterort angegeben werden.

Open-Meteo liefert aktuell bis zu 16 Tage Vorhersage. Liegt die Reise weiter in der Zukunft, zeigt Kofferly das verständlich an; die Aktualisierung kann später erneut ausgeführt werden.

Die heruntergeladenen Wetterdaten werden lokal gespeichert und bleiben danach offline sichtbar.

## Packempfehlung

Beim Anlegen einer Reise erzeugt Kofferly eine lokale Empfehlung mit Mengen. Beispiel: Bei acht Reisetagen werden Unterwäsche und Socken mit einem Reserveteil berechnet. Persönlich benötigte Medikamente werden als Reisedauer plus zwei Tagesdosen Reserve angezeigt.

Sobald Wetterdaten für den Reisezeitraum vorhanden sind, können zusätzliche Empfehlungen einfließen, z. B. Regenjacke, Fleece, Badebekleidung oder Sonnenschutz. Eigene Einträge bleiben bei einer Aktualisierung erhalten.

## Offline-Verhalten

Nach dem ersten Laden wird die App-Shell durch den Service Worker gecacht. Reisen und Packlisten liegen lokal in IndexedDB. Reisezielbilder werden online geladen, auf ca. 1600 px Breite reduziert und als JPEG-Blob in IndexedDB gespeichert.

Es gibt absichtlich keinen Push-Server. Erinnerungen werden beim Öffnen der App anhand des Abreisedatums berechnet.

## Designreferenz

Die visuelle Soll-Vorgabe liegt in:

- `docs/DESIGN_REFERENCE.md`
- `docs/mockups/kofferly-design-reference-v1.png`

## Datenquellen

- Wetter: Open-Meteo
- Reisezielbilder: Wikimedia Commons
