# Kofferly – AGENTS.md

Diese Datei enthält verbindliche Arbeitsregeln für Coding-Agenten und automatisierte Änderungen im Kofferly-Repository.

## 1. Vor jeder Änderung

- Immer zuerst den aktuellen Stand von `main` und die letzten Commits prüfen.
- Vorhandene Änderungen des Nutzers niemals überschreiben oder rückgängig machen, wenn sie nicht Teil des Auftrags sind.
- Relevante Referenzen lesen: `README.md`, `UI-GUIDELINES.md`, `docs/DESIGN_REFERENCE.md` und bei visuellen Änderungen passende Mockups unter `docs/mockups/`.
- Bestehende Architektur und Patterns bevorzugen; keine unnötigen Frameworks, Build-Systeme oder Abhängigkeiten einführen.

## 2. Scope diszipliniert halten

- Nur die beauftragte Änderung umsetzen.
- Keine beiläufigen Refactorings, Design-Neuinterpretationen oder Dateiumstrukturierungen ohne ausdrückliche Freigabe.
- Bei Bugfixes den kleinstmöglichen robusten Fix bevorzugen.
- Nutzerzustand und lokale Daten sind besonders schützenswert; IndexedDB-/Storage-Migrationen nur bewusst und rückwärtskompatibel durchführen.

## 3. Branching

- Kleine, klar abgegrenzte Fixes dürfen direkt auf `main` umgesetzt werden.
- Größere Features, experimentelle UI-Änderungen oder riskante technische Umbauten gehören auf eine eigene Branch.
- Test-/Feature-Branches werden erst nach Freigabe nach `main` übernommen.

## 4. UI/UX

- `UI-GUIDELINES.md` ist verbindlich.
- Freigegebene Mockups sind Soll-Referenzen und dürfen nicht frei umgedeutet werden.
- Kofferly soll sich app-nativ anfühlen, insbesondere auf Android.
- Keine Browser-artigen oder Desktop-zentrierten Komponenten einführen, wenn ein mobiles Pattern vorhanden ist.
- Safe Areas, Android-Zurück-Verhalten, Tastatur, Fokus, Scroll-Locking und Overscroll bei jeder betroffenen Änderung mitdenken.

## 5. Funktionale Leitplanken

- Offline-first-Verhalten erhalten.
- Wetterdaten dürfen lokale Nutzerdaten nicht zerstören oder explizit gelöschte automatische Packeinträge ungefragt wiederherstellen.
- Eigene Packlisteneinträge und Nutzerentscheidungen haben Vorrang vor automatisch generierten Vorschlägen.
- Laufende Reisen sollen nicht so behandelt werden, als müssten sie noch vorbereitet werden.
- Reiselogik für Countdown, Dashboard und Packliste immer anhand klarer Datumszustände prüfen: Zukunft, Abreisetag, laufend, beendet.

## 6. Versionierung

- `VERSION` ist die kanonische Versionsquelle.
- Bei produktiven Codeänderungen die Version erhöhen, sofern nicht ausdrücklich anders vereinbart.
- Dokumentationsänderungen allein benötigen keinen Versionsbump.
- Versionsreferenzen in `README.md`, Changelog oder App-Shell dürfen nicht widersprüchlich werden.

## 7. Tests und Prüfung

Vor Commit mindestens:

- geänderte Dateien nochmals vollständig gegen den Auftrag prüfen,
- offensichtliche Syntax-/Importfehler ausschließen,
- betroffene Nutzerflüsse gedanklich bzw. mit verfügbaren Tests durchgehen,
- sicherstellen, dass keine unbeauftragten Dateien verändert wurden.

Bei UI-Änderungen zusätzlich mobile Viewports und relevante Zustände berücksichtigen.

## 8. Commits

- Änderungen selbstständig committen.
- Commit-Nachrichten kurz, konkret und im bestehenden Stil halten, z. B. `fix: ...`, `feat: ...`, `docs: ...`, `chore: ...`.
- Ein Commit soll fachlich zusammengehörige Änderungen enthalten.
- Nach einem Commit den resultierenden Stand bzw. Commit-SHA prüfen und dem Nutzer nennen.

## 9. Kommunikation

- Vor größeren Änderungen erst Verständnis/Zielbild abstimmen, wenn der Nutzer dies verlangt oder der Scope offen ist.
- Wenn der Nutzer ausdrücklich „nicht gleich coden“ oder „erst zeigen“ sagt, keine Implementierung beginnen.
- Keine fertige Umsetzung behaupten, bevor sie tatsächlich im Repository committed ist.
- Unsicherheiten klar benennen; nichts erfinden, was im Repository nicht vorhanden ist.
