# Kofferly – Offline-first Reise-PWA

Version **0.8.15**

Kofferly ist eine mobile, offline-first Reise-PWA in HTML, CSS und JavaScript. Der aktuelle Repository-Stand enthält die Web-App; ein nativer Android-/Capacitor-Wrapper ist derzeit nicht Bestandteil dieses Repositories.

## Ziel

Kofferly unterstützt die Reisevorbereitung mit:

- Reisen und Reisedaten
- Packlisten mit Mengen und Begründungen
- wetterabhängigen Empfehlungen
- lokalen Erinnerungen und Statushinweisen
- offline verfügbaren Reisedaten und Wetter-Caches
- mobiler, Android-orientierter Bedienung

## Technischer Stand

- HTML / CSS / JavaScript ohne Build-Schritt
- IndexedDB für Reisen, Packlisten, Einstellungen, Reisezielbilder und Wetter-Cache
- Service Worker für die App-Shell
- Wetter über Open-Meteo
- Reisezielbilder über Wikimedia Commons
- lokale Datenhaltung ohne verpflichtenden Backend-Dienst

## Verbindliche Projektdokumentation

Für Änderungen am Projekt gelten diese Dateien als Referenz:

- `README.md` – Projektüberblick und technischer Rahmen
- `UI-GUIDELINES.md` – verbindliche UI-/UX-Regeln
- `AGENTS.md` – verbindliche Arbeitsregeln für Coding-Agenten
- `docs/DESIGN_REFERENCE.md` – visuelle Designreferenz
- `docs/mockups/` – freigegebene bzw. referenzierte UI-Mockups

Bei visuellen Änderungen sind `UI-GUIDELINES.md`, `docs/DESIGN_REFERENCE.md` und die passenden Mockups vor der Umsetzung zu prüfen.

## Starten

PWA-Funktionen benötigen HTTP(S). Nicht direkt `index.html` per `file://` öffnen.

### Python

```bash
python -m http.server 8080
```

Danach `http://localhost:8080` öffnen.

### Node

```bash
npx serve .
```

## Android / App-Verhalten

Die Oberfläche ist mobile-first und soll sich auf Android möglichst app-nativ verhalten.

Wichtig:

- Safe Areas berücksichtigen
- Browser-artige Scroll-/Overscroll-Effekte soweit möglich vermeiden
- Android-Zurück-Verhalten logisch behandeln
- Dialoge und Overlays sperren den Hintergrund-Scroll
- Tastatur und Fokus dürfen wichtige Aktionen nicht verdecken

Ein nativer Android-WebView-Wrapper ist aktuell nicht Teil dieses Repositories. WebView-spezifische Einstellungen wie `OVER_SCROLL_NEVER` können daher erst dort verbindlich gesetzt werden, sobald der Android-Wrapper eingecheckt ist.

## Wetter

Kofferly verwendet Open-Meteo. Bei einem konkreten Reiseziel kann dieses direkt als Wetterort verwendet werden; bei Regionen oder Ländern kann ein separater Wetterort hinterlegt werden.

Heruntergeladene Wetterdaten werden lokal gespeichert und bleiben anschließend offline sichtbar.

Wetterbasierte Neuberechnungen dürfen eigene Nutzerdaten und explizite Löschentscheidungen nicht überschreiben.

## Packempfehlung

Die Packliste kann Mengen und kurze Begründungen aus Reisedauer, Zieltyp und Wetter ableiten.

Grundregeln:

- eigene Einträge bleiben erhalten
- explizit gelöschte automatische Vorschläge dürfen nicht ungefragt wieder erscheinen
- Nutzerentscheidungen haben Vorrang vor automatischer Empfehlung
- laufende Reisen sollen nicht weiter wie noch vorzubereitende Reisen behandelt werden

## Reise- und Dashboard-Logik

Vorbereitende Statuskarten sind auf bevorstehende Reisen begrenzt.

- relevante Zukunftsreisen: typischerweise 1–7 Tage vor Abreise
- am Abreisetag darf die vorbereitende Pack-/Aufgabenlogik noch sichtbar sein
- während einer laufenden Reise soll keine prominente „Noch etwas zu erledigen“-/„Alles bereit“-Logik mehr erscheinen

Details siehe `UI-GUIDELINES.md`.

## Offline-Verhalten

Nach dem ersten Laden wird die App-Shell über den Service Worker gecacht. Reisen, Packlisten, Einstellungen und weitere lokale Daten liegen in IndexedDB.

Es gibt absichtlich keinen verpflichtenden Push- oder Backend-Dienst. Lokale Hinweise werden aus dem vorhandenen Datenbestand berechnet.

## Design

Die verbindliche Designsprache ist in folgenden Dateien dokumentiert:

- `UI-GUIDELINES.md`
- `docs/DESIGN_REFERENCE.md`
- `docs/mockups/`

Kernmerkmale:

- Forest Green als Primärfarbe
- warme Creme-/Off-White-Flächen
- große, weiche Kartenradien
- ruhige Schatten
- prominentes Reisezielbild
- klare mobile Hierarchie
- möglichst native Android-Interaktion

## Versionierung

Die kanonische Version steht in `VERSION`.

Produktive Codeänderungen sollen die Version erhöhen, sofern nicht ausdrücklich anders vereinbart. Reine Dokumentationsänderungen benötigen keinen Versionsbump.

## Datenquellen

- Wetter: Open-Meteo
- Reisezielbilder: Wikimedia Commons
