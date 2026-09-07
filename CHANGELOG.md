# Changelog

## 0.3.0 – 2026-09-07

### Design
- Header auf die Mockup-Hierarchie zurückgeführt: links nur noch `Kofferly`, rechts Benachrichtigungen und neue Reise.
- Reisezielbild bleibt der emotionale Hero-Bereich.
- Neue markante Countdown-/Statuskarte direkt unter dem Hero mit Flugzeugmotiv, offenen Punkten und direktem Sprung zur Packliste.
- Erledigte Reisen wechseln in einen ruhigen `Alles bereit`-Zustand.
- Bestehende detaillierte Dashboard-Funktionen bleiben erhalten und folgen unterhalb des emotionalen Einstiegs.

### Neu
- Lokale In-App-Benachrichtigungszentrale mit Glocke und Ungelesen-Zähler.
- Hinweise für bevorstehende Abreise, offene Packpunkte und veraltete/fehlende Wetterdaten.
- Gelesen/Ungelesen wird lokal in IndexedDB gespeichert, ohne Server oder Push-Dienst.
- Eigene v0.3.0-Präsentationsschicht ergänzt, ohne Wetter- und Packlogik umzubauen.

### PWA
- Service-Worker-Cache auf `kofferly-shell-v4` angehoben.
- Neue v0.3.0-JS-/CSS-Dateien werden offline vorgehalten.
- Maskable-Icon-Trennung aus dem vorherigen Fix bleibt erhalten.

## 0.2.0 – 2026-09-07

### Behoben
- Wetteraktualisierung robuster gemacht.
- Open-Meteo-Fehler werden jetzt sichtbar in der Wetterkarte ausgegeben.
- Optionaler separater Wetterort für Regionen/Länder ergänzt.
- Region-Fallbacks u. a. für Südtirol/Tirol ergänzt.
- Service-Worker-Cache auf v2 angehoben, damit alte JS-Dateien nicht hängen bleiben.

### Neu
- Mengenbasierte Packempfehlung abhängig von Reisedauer.
- Kleidung mit Reserveberechnung (z. B. Unterwäsche/Socken).
- Medikamenten-Eintrag als Reisedauer + 2 Tagesdosen Reserve.
- Zieltyp-Heuristiken für Berge, Tropen und Strand.
- Wetterabhängige Ergänzungen wie Regenjacke, Fleece oder Badebekleidung.
- Wetteraktualisierung passt die generierten Empfehlungen an, ohne eigene Einträge zu löschen.
- Bestehende v0.1-Standardlisten werden beim Öffnen auf das neue Empfehlungssystem migriert.
- Packempfehlungs-Zusammenfassung auf Dashboard und Packlisten-Seite.
- Mockups und Designreferenz künftig direkt im Projekt-ZIP unter `docs/`.
