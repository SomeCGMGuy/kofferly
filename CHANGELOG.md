# Changelog

## 0.7.0 – 2026-09-08

### Onboarding
- Neuer vierstufiger First-Run-Onboarding-Screen im Kofferly-Design.
- Erklärt Reiseanlage, Reisenden- und Aktivitätsprofile, mehrere Wetterorte, intelligente Packliste, Erinnerungen, Offline-Nutzung, Backup und Updates.
- Seiten lassen sich per Button, Fortschrittspunkten oder horizontaler Wischgeste wechseln.
- Android-Zurück geht innerhalb des Onboardings zunächst eine Seite zurück und schließt es erst am Anfang.
- `Überspringen` und `Los geht’s` speichern lokal, dass die Einführung abgeschlossen wurde; sie erscheint danach nicht erneut automatisch.
- Unter Einstellungen kann die Einführung jederzeit über `Einführung > Ansehen` erneut geöffnet werden.
- Hauptnavigation und eventuell geöffnete App-Dialoge bleiben während des First-Run-Flows vollständig ausgeblendet.

### PWA
- `onboarding.css` und `js/onboarding.js` werden offline vorgehalten.
- Service-Worker-Cache auf `kofferly-shell-v30` angehoben.

## 0.6.0 – 2026-09-07

### Android UI
- Sichtbare Browser-Selects durch Android-artige Auswahlfelder mit eigenem Bottom-Sheet ersetzt; die nativen Selects bleiben unsichtbar als Formulardatenquelle erhalten.
- `Reisende`, Kategorien und dynamisch gerenderte Auswahlfelder verwenden damit dieselbe konsistente Auswahloberfläche auf Xiaomi, Samsung und Brave.
- `Aufgabe hinzufügen` ist nun ein Bottom-Sheet statt eines Vollbild-Push-Screens.
- Löschbestätigungen und der Installationshinweis verwenden kompakte Alert-Dialoge statt Fullscreen-Navigation.
- Aktivitätsprofile verwenden Android-artige Auswahlkarten mit eigenem Check-Zustand statt Browser-Checkbox-Look.
- Suchfelder, Switches, Datumsfelder und Snackbars optisch an eine Material-/Android-Komponentenhierarchie angeglichen.
- Header und Bottom-Navigation verwenden konsistente Inline-SVG-Icons statt Unicode-Navigationszeichen.
- Push-Navigation bleibt nur für längere Arbeitsabläufe wie `Neue Reise` und Profilbearbeitung aktiv.

### PWA
- Neue UI-Dateien `android-ui.css` und `js/android-ui.js` werden offline gecacht.
- Service-Worker-Cache auf `kofferly-shell-v27` angehoben.

## 0.5.0 – 2026-09-07

### Profile
- `Packprofil` in `Reisende` umbenannt; `Dame`, `Herr`, `Paar` und `Keine Angabe` bleiben getrennt von Interessen und Aktivitäten.
- Neue kombinierbare Aktivitätsprofile ergänzt: `Sport & Fitness`, `Foto & Video`, `Wandern` und `Strand & Baden`.
- `Foto & Video` ergänzt unter anderem Action-Cam, Selfiestick / Mini-Stativ, Speicherkarte und Ersatzakku / Ladezubehör.
- Aktivitätsprofile können beim Anlegen einer Reise über eine Live-Suche gefunden und mehrfach ausgewählt werden.
- Bereits ausgewählte Profile bleiben beim Suchen erhalten, auch wenn sie zeitweise ausgefiltert sind.
- Gewählte Aktivitätsprofile werden als Snapshot in der Reise gespeichert; spätere Profiländerungen verändern bestehende Reisen nicht rückwirkend.

### Profilverwaltung
- Neue durchsuchbare Profilverwaltung unter Einstellungen.
- Standardprofile lassen sich bearbeiten, kopieren und auf den Auslieferungszustand zurücksetzen.
- Eigene Profile lassen sich anlegen, bearbeiten, kopieren und löschen.
- Jeder Profileintrag unterstützt Kategorie, Gegenstand, Menge, Einheit und `wichtig`-Markierung.
- Suche berücksichtigt Profilname, Beschreibung, Kategorien und Packeinträge.

### Wetter & PWA
- Interne Profilmetadaten werden von der Wetterortsuche ignoriert.
- Service-Worker-Cache auf `kofferly-shell-v23` angehoben.

## 0.4.2 – 2026-09-07

### Packprofile
- Auswahlfeld `Packprofil für neue Reisen` so angepasst, dass `Herren` auf schmalen Displays nicht mehr abgeschnitten wird.
- Neues Profil `Paar` für zwei Reisende ergänzt.
- Beim Paar-Profil werden personenbezogene Mengen wie Ausweise, Krankenversicherungskarten, Kleidung, Zahnbürsten, Smartphones, Ladekabel und Trinkflaschen für zwei Personen berechnet.
- Das Paar-Profil berücksichtigt zusätzlich persönliche Hygieneartikel wie das Damen-Profil.
- Auch im Dialog `Neue Reise` steht `Paar` direkt zur Auswahl.

### PWA
- Service-Worker-Cache auf `kofferly-shell-v22` angehoben.

## 0.4.1 – 2026-09-07

### Einstellungen
- Doppelte Anzeige `Packprofil für neue Reisen` behoben.
- Asynchrone Initialisierung der Profilkarte gegen parallele MutationObserver-Aufrufe abgesichert.
- Falls durch einen alten Renderzustand bereits mehrere Profilkarten vorhanden sind, werden zusätzliche Duplikate automatisch entfernt.

### PWA
- Service-Worker-Cache auf `kofferly-shell-v21` angehoben.

## 0.4.0 – 2026-09-07

### Packliste
- `Auslandskrankenversicherung / Versicherungsnachweis` als wichtiger Standardpunkt ergänzt.
- Optionales Packprofil für neue Reisen ergänzt (`Keine Angabe`, `Damen`, `Herren`).
- Beim Damen-Profil werden automatisch `Menstruations- / Hygieneartikel` unter Hygiene ergänzt.
- Das Standardprofil für neue Reisen kann zusätzlich unter Einstellungen festgelegt werden.

### Wetter & Rundreisen
- Mehrere Wetterorte pro Reise unterstützt; Orte werden zeilenweise erfasst, z. B. Passau, Wien und Budapest bei einer Flusskreuzfahrt.
- Für jede Station wird eine eigene Open-Meteo-Vorhersage geladen und lokal gespeichert.
- Für die Packlogik werden die Wetterdaten entlang der Route konservativ zusammengeführt: höchste Regenwahrscheinlichkeit, niedrigste Temperatur und höchste Temperatur werden berücksichtigt.
- Dadurch kann z. B. eine Regenjacke empfohlen werden, sobald eine Station entsprechend nasses Wetter erwarten lässt.
- Auf der Übersicht werden bei Mehrort-Reisen die erkannten Stationen der Route angezeigt.
- Bestehende Reisen mit nur einem Wetterort bleiben kompatibel.

### PWA
- Neues Modul `travel-profile.js` wird offline mit gecacht.
- Service-Worker-Cache auf `kofferly-shell-v20` angehoben.

## 0.3.14 – 2026-09-07

### Updates
- PWA-Updatepfad für Brave/Chromium robuster gemacht.
- App-Dateien werden online nun immer zuerst aus dem Netzwerk geladen und dabei der Browser-HTTP-Cache umgangen.
- Erfolgreich geladene Dateien werden weiterhin im Kofferly-PWA-Cache gespeichert, damit die App offline funktioniert.
- Wird ein neuer Service Worker aktiviert, werden geöffnete Kofferly-Fenster einmal automatisch neu geladen, damit der neue Git-Stand direkt übernommen wird.
- Manuelles Löschen des Brave-Caches sollte damit künftig nicht mehr nötig sein.

### PWA
- Service-Worker-Cache auf `kofferly-shell-v18` angehoben.

## 0.3.13 – 2026-09-07

### PWA-Installation
- Beim Öffnen kann Kofferly nun automatisch fragen, ob die App auf dem Homescreen installiert werden soll.
- Der Hinweis erscheint nur, wenn der Browser Kofferly tatsächlich als installierbare PWA meldet und Kofferly noch nicht im Standalone-Modus läuft.
- `Jetzt installieren` öffnet den nativen PWA-Installationsdialog.
- `Später` bzw. Schließen blendet den Hinweis für sieben Tage aus, damit er nicht bei jedem Start erneut stört.
- Die Installationskarte in den Einstellungen bleibt unabhängig davon weiterhin verfügbar.
- Nach erfolgreicher Installation wird der Hinweis nicht mehr angezeigt.

### PWA
- Service-Worker-Cache auf `kofferly-shell-v17` angehoben.

## 0.3.12 – 2026-09-07

### Einstellungen
- Neue Karte `Kofferly installieren` ergänzt.
- Unterstützt der Browser den PWA-Installationsprompt, kann Kofferly direkt über `App installieren` auf dem Homescreen installiert werden.
- Läuft Kofferly bereits im Standalone-/PWA-Modus, zeigt die Karte stattdessen den Status `Installiert`.
- Ist kein programmatischer Installationsprompt verfügbar, verweist die Karte auf `App installieren` bzw. `Zum Startbildschirm hinzufügen` im Browsermenü.
- Nach erfolgreicher Installation aktualisiert sich der Installationsstatus automatisch.

### PWA
- Service-Worker-Cache auf `kofferly-shell-v16` angehoben.

## 0.3.11 – 2026-09-07

### Einstellungen
- Neue Anzeige `Installierte Version` ergänzt, damit der aktuell auf dem Gerät laufende Kofferly-Stand direkt sichtbar ist.
- Die Versionsnummer wird automatisch aus der `VERSION`-Datei gelesen und muss nicht separat in der UI gepflegt werden.
- `VERSION` wird nun auch im PWA-Shell-Cache vorgehalten, damit die Anzeige offline verfügbar bleibt.

### PWA
- Service-Worker-Cache auf `kofferly-shell-v15` angehoben.

## 0.3.10 – 2026-09-07

### Aktualisieren
- Pull-to-refresh per Wischgeste ist nur noch auf der Übersicht erlaubt.
- Auf Packliste, Reisen und Einstellungen wird das native Browser-/PWA-Overscroll-Refresh blockiert.
- Normales vertikales Scrollen bleibt auf allen Ansichten unverändert möglich.
- Der separate `Neu laden`-Button unter Einstellungen bleibt der Weg für einen vollständigen App-/Service-Worker-Reload nach neuen Git-Commits.

### PWA
- Service-Worker-Cache auf `kofferly-shell-v14` angehoben.

## 0.3.9 – 2026-09-07

### Aktualisieren
- Manueller Packlisten-Refresh entfernt; die Packliste wird nicht mehr über einen separaten Aktualisieren-Button neu berechnet.
- Manueller Reisezielbild-Refresh aus der Übersicht entfernt.
- Einziger inhaltlicher Refresh in der Übersicht bleibt `Wetter aktualisieren`; dabei werden Wetterdaten geladen und die wetterabhängige Packempfehlung intern angepasst.

### Einstellungen
- Neuer Button `Neu laden` für einen echten App-Reload ergänzt.
- Beim Neu laden werden nur Kofferlys PWA-Shell-Caches verworfen, der Service Worker explizit auf Updates geprüft und die Seite anschließend vollständig neu geladen.
- IndexedDB mit Reisen, Packlisten, Bildern, Wetterdaten und Einstellungen bleibt dabei erhalten.
- Offline wird kein Update-Reload gestartet, damit die App nicht ohne Shell-Cache neu laden muss.

### PWA
- Service-Worker-Cache auf `kofferly-shell-v13` angehoben.

## 0.3.8 – 2026-09-07

### Übersicht
- Countdown-/Statuskarte bleibt beim Wechsel von der Packliste zurück zur Übersicht ohne sichtbares Verschwinden stehen.
- Der zuletzt bekannte Reisezustand wird synchron im selben Render-Zyklus wieder eingesetzt, statt erst nach einem erneuten IndexedDB-Lesevorgang.
- Benachrichtigungen und Statusdaten werden danach weiterhin im Hintergrund der UI-Aktualisierung frisch aus IndexedDB gelesen.

### PWA
- Service-Worker-Cache auf `kofferly-shell-v12` angehoben.

## 0.3.7 – 2026-09-07

### Packliste
- Zusammenfassungsblock `Berechnet für deine Reise` aus der Packlistenansicht entfernt.
- Suche sitzt nun direkt unter dem Seitenkopf, damit die Aufgaben ohne zusätzlichen Infoblock sofort erreichbar sind.
- Mengen-, Wetter- und Empfehlungslogik bleiben unverändert aktiv.

### Einstellungen
- Erklärkarte `Intelligente Packliste` entfernt, ohne die automatische Packberechnung zu deaktivieren.

### PWA
- Service-Worker-Cache auf `kofferly-shell-v11` angehoben.

## 0.3.6 – 2026-09-07

### Bedienung
- Pinch-Zoom und Doppeltipp-Zoom in der App deaktiviert, damit sich Kofferly wie eine installierte native App verhält.
- Scrollen, Tippen und normale Touch-Bedienung bleiben unverändert nutzbar.

### PWA
- Viewport auf feste Skalierung (`maximum-scale=1`, `user-scalable=no`) umgestellt.
- Service-Worker-Cache auf `kofferly-shell-v10` angehoben.

## 0.3.5 – 2026-09-07

### Navigation
- Bottom-Navigation bleibt während Push- und Pop-Animationen fest an ihrer Position.
- Statt die gesamte App-Shell zu transformieren, bewegen sich nur Header und Inhaltsbereich leicht nach links bzw. zurück.
- Dadurch entfällt das sichtbare Zurückspringen des Footers am Ende der Rückwärtsanimation.

### PWA
- Service-Worker-Cache auf `kofferly-shell-v9` angehoben.

## 0.3.4 – 2026-09-07

### Packliste
- Lösch-`×` bei Aufgaben aus dem Mengen-/Statusbereich gelöst und als eigene Aktion ganz rechts positioniert.
- Löschaktion sitzt unabhängig von Textlänge und Badge-Anzahl vertikal mittig im Eintrag.
- Auf schmalen Displays bleibt der rechte Aktionsbereich stabil, während Mengen-/Statusbadges weiterhin sauber umbrechen können.

### PWA
- Service-Worker-Cache auf `kofferly-shell-v8` angehoben, damit die Layout-Korrektur zuverlässig ausgeliefert wird.

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
