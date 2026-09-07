# Kofferly – Offline-first PWA

Version **0.3.0**

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
- In-App-Benachrichtigungen mit lokalem Gelesen/Ungelesen-Status
- Filter für Benachrichtigungen: Alle, Wichtig und Tipps
- „Noch etwas zu erledigen“-Karte mit Flugzeug und Abreise-Countdown nach Mockup-Referenz
- Detailansicht für offene Packkategorien
- Löschbestätigung für Reisen und Packlisteneinträge
- responsives Kofferly-Design in Forest Green
- separates maskable App-Icon mit Safe-Zone für Android-Launcher wie Xiaomi/HyperOS
- Design-Mockups im Projekt unter `docs/mockups/`

## Starten

Kofferly benötigt einen lokalen Webserver, weil Service Worker und ES-Module nicht zuverlässig über `file://` funktionieren.

Beispiel mit Python:

```bash
python -m http.server 8080
```

oder mit Node:

```bash
npx serve .
```

Danach im Browser öffnen und die PWA über „App installieren“ bzw. „Zum Startbildschirm hinzufügen“ installieren.

## Wetter

Kofferly verwendet Open-Meteo. Bei einem konkreten Reiseziel wie „Meran“ oder „Dorf Tirol“ kann das Reiseziel direkt als Wetterort verwendet werden. Bei Regionen oder Ländern kann im Reise-Dialog bzw. auf der Wetterkarte ein eigener Wetterort angegeben werden.

Open-Meteo liefert aktuell bis zu 16 Tage Vorhersage. Liegt die Reise weiter in der Zukunft, zeigt Kofferly das verständlich an; die Aktualisierung kann später erneut ausgeführt werden.

Die heruntergeladenen Wetterdaten werden lokal gespeichert und bleiben danach offline sichtbar.

## Packempfehlung

Beim Anlegen einer Reise erzeugt Kofferly eine lokale Empfehlung mit Mengen. Beispiel: Bei acht Reisetagen werden Unterwäsche und Socken mit einem Reserveteil berechnet. Persönlich benötigte Medikamente werden als Reisedauer plus zwei Tagesdosen Reserve angezeigt.

Sobald Wetterdaten für den Reisezeitraum vorhanden sind, können zusätzliche Empfehlungen einfließen, z. B. Regenjacke, Fleece, Badebekleidung oder Sonnenschutz. Eigene Einträge bleiben bei einer Aktualisierung erhalten.

## Benachrichtigungen

Die Glocke im Header sammelt lokale Hinweise zu Abreise, offenen Packpunkten, dem letzten Check und Reisetipps. Die Meldungen funktionieren ohne Server. Der Gelesen/Ungelesen-Status und die Auswahl der Benachrichtigungsarten werden in IndexedDB gespeichert.

Es handelt sich bewusst um **In-App-Benachrichtigungen**. Ohne Push-Server kann Android eine vollständig geschlossene PWA nicht zuverlässig zu einem bestimmten Zeitpunkt wecken.

## App-Icon auf Android

Normale Icons (`purpose: any`) und das maskierbare Icon (`purpose: maskable`) sind getrennt. Das maskierbare Motiv liegt deutlich innerhalb der Safe-Zone, damit Launcher mit aggressiver Rundung oder Zuschnitt – etwa auf manchen Xiaomi-/HyperOS-Geräten – das Koffer-Motiv nicht hineinzoomen oder abschneiden.

Nach einer Icon-Änderung kann es nötig sein, die bereits installierte PWA einmal zu entfernen und neu zu installieren, weil Android Launcher-Icons stark cacht.

## Offline-Verhalten

Nach dem ersten Laden wird die App-Shell durch den Service Worker gecacht. Reisen und Packlisten liegen lokal in IndexedDB. Reisezielbilder werden online geladen, auf ca. 1600 px Breite reduziert und als JPEG-Blob in IndexedDB gespeichert.

## Designreferenz

Die visuelle Soll-Vorgabe liegt in:

- `docs/DESIGN_REFERENCE.md`
- `docs/mockups/kofferly-design-reference-v1.png`

## Datenquellen

- Wetter: Open-Meteo
- Reisezielbilder: Wikimedia Commons
