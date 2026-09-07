# Changelog

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
