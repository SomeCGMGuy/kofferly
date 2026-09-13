# Kofferly – UI Guidelines

Diese Datei ist die verbindliche UI-/UX-Richtlinie für Kofferly. Sie ergänzt `docs/DESIGN_REFERENCE.md` und die dort referenzierten Mockups. Bei Konflikten gilt: konkrete freigegebene Mockups bzw. explizite Produktentscheidungen haben Vorrang; danach diese Datei; danach bestehende Implementierung.

## 1. Grundprinzipien

- Mobile-first, App-first: Kofferly soll sich wie eine native Android-App anfühlen, nicht wie eine Webseite.
- Ruhig, freundlich, funktional: keine unnötige Dashboard-Optik, keine visuellen Spielereien ohne Nutzen.
- Forest Green ist die Primärfarbe; warme Creme-/Off-White-Flächen bilden den ruhigen Gegenpol.
- Rot wird nur für echte Fehler, wichtige Warnungen oder destruktive Aktionen verwendet.
- Bestehende visuelle Sprache darf nicht ohne Freigabe neu interpretiert werden.
- Neue Komponenten müssen sich an vorhandenen Abständen, Radien, Typografie, Icon-Sprache und Interaktionsmustern orientieren.

## 2. Verbindliche Referenzen

Vor UI-Änderungen sind mindestens diese Referenzen zu prüfen:

1. `UI-GUIDELINES.md`
2. `docs/DESIGN_REFERENCE.md`
3. `docs/mockups/`
4. bestehende produktive Komponenten im aktuellen `main`

Freigegebene Mockups sind Soll-Zustände. Umsetzung soll so nah wie technisch sinnvoll an der Referenz erfolgen; freie Neuinterpretation ist nicht erwünscht.

## 3. Layout und Navigation

- Header minimal halten.
- Links im Header ausschließlich `Kofferly`; kein zusätzliches App-Logo.
- Rechts nur kontextrelevante Aktionen wie Benachrichtigungen und Reise anlegen.
- Safe Areas des Betriebssystems müssen berücksichtigt werden; Inhalte dürfen nicht in Status- oder Navigationsleisten hineinragen.
- Bottom Navigation, Header und andere persistente Flächen dürfen beim Scrollen oder bei View-Wechseln nicht springen oder flackern.
- Android-Zurück-Verhalten muss logisch sein: Modals schließen vor Views; Views navigieren zum vorherigen Zustand zurück.
- Vollbild-Overlays und Dialoge sperren den Hintergrund-Scroll.
- Modals schließen über explizite Aktion, Android-Zurück und – sofern fachlich passend – Tap außerhalb.

## 4. Scroll- und Gestenverhalten

- Nur der fachlich vorgesehene Inhaltsbereich darf scrollen.
- Kein unbeabsichtigtes Body-Scrolling hinter Dialogen oder Drawern.
- Scrollpositionen dürfen bei einfachen UI-Aktionen nicht unnötig zurückgesetzt werden.
- Browser-/WebView-artige Gummiband-, Stretch- oder Overscroll-Effekte sollen soweit technisch möglich unterbunden werden.
- CSS-seitig ist `overscroll-behavior` dort einzusetzen, wo es Scroll-Chaining oder unerwünschte Overscroll-Effekte verhindert.
- Falls ein nativer Android-Wrapper verwendet wird, soll das WebView zusätzlich `OVER_SCROLL_NEVER` nutzen.

## 5. Karten, Flächen und Abstände

- Karten verwenden große, weiche Radien.
- Schatten sind zurückhaltend und weich; keine harten Material-/Dashboard-Schatten.
- Abstände sollen großzügig, aber kompakt genug für mobile Bedienung bleiben.
- Zusammengehörige Informationen werden visuell gruppiert; technische Metadaten sollen die Hierarchie nicht dominieren.

## 6. Reisezielbild und Dashboard

- Das Reisezielbild ist funktionaler, emotionaler Einstieg und bleibt prominent.
- Countdown/Reisestatus stehen direkt im Hero-Bereich oder unmittelbar darunter.
- Offene Aufgaben werden nur angezeigt, wenn sie für die nächste Reise relevant sind.
- Für Reisen, die in 1–7 Tagen starten, darf die vorbereitende Pack-/Aufgabenkarte angezeigt werden.
- Am Abreisetag darf sie noch angezeigt werden.
- Während einer bereits laufenden Reise soll keine vorbereitende „Noch etwas zu erledigen“-/„Alles bereit“-Logik mehr prominent auf dem Dashboard erscheinen.
- Laufende Reisen sollen nicht mehr zum Ergänzen oder Abarbeiten der Packliste drängen.

## 7. Packliste

- Mengen und kurze Begründungen sind Teil der Packempfehlung.
- Wetterbasierte Empfehlungen dürfen eigene Nutzerentscheidungen nicht überschreiben.
- Explizit gelöschte, automatisch erzeugte Einträge dürfen bei Neuberechnung nicht ungefragt wieder erscheinen.
- Erledigte Einträge müssen klar unterscheidbar sein und können aus-/eingeblendet werden.
- Drag-/Sortierflächen und zusätzliche Controls dürfen die Zeile nicht visuell überfrachten.

## 8. Dialoge und Formulare

- Dialoge sollen sich wie native mobile Dialoge bzw. Bottom Sheets anfühlen, nicht wie Browserformulare.
- Primäraktion gut erreichbar, aber nicht überdimensioniert.
- Destruktive Aktionen klar getrennt und bestätigt.
- Fokusmanagement ist bewusst zu setzen; Tastatur darf wichtige Aktionen nicht verdecken.
- Kategorie-, Datums- und Auswahlfelder sollen möglichst app-native Interaktionsmuster verwenden.

## 9. Onboarding und Lockscreen

- Onboarding erklärt nur die wichtigsten Funktionen und bleibt visuell leicht.
- Texte dürfen keine irreführenden Aussagen über Offline-/Online-Verhalten enthalten.
- Lockscreen bleibt visuell konsistent mit Forest Green und der restlichen App.
- Biometrie ist optional und darf beim ersten Start nicht zwingend vorausgesetzt werden.

## 10. Icons und Typografie

- Einheitliche Icon-Familie und Strichstärke verwenden.
- Keine Mischung deutlich unterschiedlicher Icon-Stile innerhalb derselben Oberfläche.
- App-Icon und In-App-Branding müssen visuell zusammenpassen.
- Typografie konsistent halten; keine abweichenden Fonts in Onboarding, Dialogen oder Spezialansichten ohne Designentscheidung.

## 11. Animationen und Feedback

- Übergänge kurz, ruhig und Android-typisch.
- Navigation soll Richtung vermitteln, aber nicht verspielt wirken.
- Haptik kann ergänzend eingesetzt werden, ist aber kein Ersatz für visuelles Feedback.
- Keine Animation darf Eingaben verzögern oder Bedienbarkeit verschlechtern.

## 12. Änderungen an der UI

Vor Umsetzung größerer UI-Features:

- erst Verhalten und Zielzustand abstimmen,
- bei Bedarf Mockup erstellen,
- größere Features auf eigener Branch testen,
- erst nach Freigabe nach `main` übernehmen.

Kleine, klar definierte Fixes dürfen direkt in `main` erfolgen, sofern sie bestehende UI nicht neu interpretieren.
