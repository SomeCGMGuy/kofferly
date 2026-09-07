# Changelog

## 0.3.3 – 2026-09-07

### Design
- Header-Wordmark auf `Kofferly.` mit Punkt umgestellt.

### Packliste
- Neue Live-Suche direkt oberhalb der Kategorien.
- Suche berücksichtigt Aufgabenname, Begründung und Kategorie und blendet nicht passende Kategorien aus.
- Trefferanzahl und leerer Suchzustand ergänzt.
- Neuer dauerhaft erreichbarer `+ Aufgabe`-Button oberhalb der Bottom-Navigation.
- Aufgaben lassen sich damit ohne Scrollen bis zum Listenende hinzufügen.
- Schnellerfassung nutzt das bestehende Push-Navigationsmuster und übernimmt vorhandene Kategorien sowie die `wichtig`-Markierung.
- Die bestehende Packlogik und Mengen-/Wetterberechnung bleiben unverändert.

### PWA
- Service-Worker-Cache auf `kofferly-shell-v7` angehoben.
- Neue Packlisten-Werkzeuge werden offline mit gecacht.

## 0.3.2 – 2026-09-07

### Behoben
- Lange Packlisteneinträge umbrechen sauber und ragen nicht mehr in Mengen- oder `wichtig`-Badges hinein.
- Auf sehr schmalen Displays rücken Mengen-/Statusbadges unter den Text, statt ihn zusammenzudrücken.

### Neu
- Lokales vollständiges Backup als Kofferly-JSON in den Einstellungen.
- Backup enthält Reisen, Packlisten, Einstellungen, Wetter-Cache und gespeicherte Reisezielbilder.
- Reisezielbilder werden binär sicher im Backup eingebettet und beim Restore wieder als Blob hergestellt.
- Restore validiert das Dateiformat vor dem Import und verlangt eine Bestätigung, bevor lokale Daten ersetzt werden.
- Nach erfolgreichem Restore wird Kofferly neu geladen und arbeitet mit dem wiederhergestellten Datenbestand weiter.

### PWA
- Service-Worker-Cache auf `kofferly-shell-v6` angehoben.
- Backup-/Restore-Modul wird offline mit gecacht.

## 0.3.1 – 2026-09-07

### UX
- Alle Dialoge verwenden jetzt ein gemeinsames Push-Navigationsmuster: neue Oberfläche fährt von rechts ein, die bestehende Ansicht weicht leicht nach links aus.
- Schließen, Abbrechen, ESC/Zurück und Backdrop-Tap laufen über die gleiche Rückwärtsanimation.
- Dialoge erscheinen als vollwertige App-Screens statt als schwebende Browser-Modals.
- Overlays deutlich zurückgenommen; die darunterliegende App bleibt als räumlicher Kontext sichtbar.
- Auffälligen Browser-Tap-Highlight auf Buttons und Navigation entfernt.
- Dezentes App-artiges Touch-Feedback mit kurzer Skalierung/Opacity statt großflächiger Overlay-Effekte.
- Fokusdarstellung für Tastaturbedienung bleibt über `:focus-visible` erhalten.
- `prefers-reduced-motion` wird berücksichtigt.

### PWA
- Service-Worker-Cache auf `kofferly-shell-v5` angehoben.
- Neue Push-Navigationslogik wird offline mit gecacht.

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
