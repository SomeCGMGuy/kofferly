# Kofferly – AGENTS.md

Diese Datei enthält verbindliche Arbeitsregeln für Coding-Agenten und automatisierte Änderungen im Kofferly-Repository.

## 1. Vor jeder Änderung

- Immer zuerst den aktuellen Stand von `main` und die letzten Commits prüfen.
- Vorhandene Änderungen des Nutzers niemals überschreiben oder rückgängig machen, wenn sie nicht Teil des Auftrags sind.
- Relevante Referenzen lesen: `README.md`, `UI-GUIDELINES.md`, `docs/DESIGN_REFERENCE.md` und bei visuellen Änderungen passende Mockups unter `docs/mockups/`.
- Bestehende Architektur und Patterns bevorzugen; keine unnötigen Frameworks, Build-Systeme oder Abhängigkeiten einführen.

## 2. Scope diszipliniert halten

- Nur die beauftragte Änderung umsetzen.
- Änderungen nicht „verbessern“, wenn sie nicht Teil des Auftrags sind.
- Keine beiläufigen Refactorings, Design-Neuinterpretationen oder Dateiumstrukturierungen ohne ausdrückliche Freigabe.
- Bei Bugs nur den kleinstmöglichen robusten Fix umsetzen; keine Nebenbaustellen und kein spontanes Refactoring.
- Nutzerzustand und lokale Daten sind besonders schützenswert; IndexedDB-/Storage-Migrationen nur bewusst und rückwärtskompatibel durchführen.

## 3. Branching und Testfreigabe

- Kleine, eindeutig risikoarme und klar abgegrenzte Fixes dürfen direkt auf `main` umgesetzt werden, sofern kein Testlauf vereinbart wurde.
- Größere Features und riskante Fixes werden immer auf einer eigenen Test-/Feature-Branch umgesetzt.
- `main` bleibt bei solchen Änderungen unangetastet, bis der Test ausdrücklich freigegeben ist.
- Sagt der Nutzer „lass uns das testen“, wird die Änderung auf einer eigenen Branch implementiert, die App-Version erhöht und – sofern die Repository-/CI-Infrastruktur dies unterstützt – ein Test-Build erzeugt.
- Nach Testfeedback wird auf derselben Test-Branch nachgebessert. Es wird nicht für jede Korrektur eine neue Branch begonnen.
- Erst nach einem ausdrücklichen „passt so“, „freigegeben“ oder einer gleichwertigen Freigabe erfolgt der Merge nach `main`.
- Vor dem Merge müssen alle beim Test gefundenen Regressionen, die durch die Änderung verursacht wurden, beseitigt sein.
- Ein Test-Branch darf nicht stillschweigend nach `main` übernommen werden.

## 4. Klare Stop-/Diskussionssignale

- Sagt der Nutzer „nicht gleich coden“, „erst besprechen“, „zeig mir erst, ob du es verstanden hast“ oder sinngemäß dasselbe, wird nichts implementiert, keine Version erhöht und kein Code-Commit erzeugt.
- In diesem Zustand werden ausschließlich Verhalten, Scope, Risiken, Lösungsweg oder Mockups besprochen.
- Erst eine anschließende ausdrückliche Umsetzungsfreigabe hebt diesen Stopp auf.

## 5. UI/UX

- `UI-GUIDELINES.md` ist verbindlich.
- Bei UI gilt ein freigegebener Mock stärker als eigene Interpretation.
- Freigegebene Mockups sind Soll-Referenzen und dürfen nicht frei umgedeutet oder „verbessert“ werden.
- Kofferly soll sich app-nativ anfühlen, insbesondere auf Android.
- Keine Browser-artigen oder Desktop-zentrierten Komponenten einführen, wenn ein mobiles Pattern vorhanden ist.
- Safe Areas, Android-Zurück-Verhalten, Tastatur, Fokus, Scroll-Locking und Overscroll bei jeder betroffenen Änderung mitdenken.

## 6. Funktionale Leitplanken

- Offline-first-Verhalten erhalten.
- Wetterdaten dürfen lokale Nutzerdaten nicht zerstören oder explizit gelöschte automatische Packeinträge ungefragt wiederherstellen.
- Eigene Packlisteneinträge und Nutzerentscheidungen haben Vorrang vor automatisch generierten Vorschlägen.
- Laufende Reisen sollen nicht so behandelt werden, als müssten sie noch vorbereitet werden.
- Reiselogik für Countdown, Dashboard und Packliste immer anhand klarer Datumszustände prüfen: Zukunft, Abreisetag, laufend, beendet.

## 7. Versionierung und Test-Builds

- `VERSION` ist die kanonische Versionsquelle.
- Bei ausgelieferten Codeänderungen die App-Version erhöhen.
- Auch ein explizit angeforderter Test-Build erhält eine nachvollziehbar erhöhte Version, damit Testergebnisse eindeutig einem Stand zugeordnet werden können.
- Reine Dokumentationsänderungen benötigen keinen Versionsbump.
- Versionsreferenzen in `README.md`, Changelog, App-Shell und Build-Konfiguration dürfen nicht widersprüchlich werden.
- Ein Versionsbump allein ist keine Freigabe für einen Merge nach `main`.

## 8. Tests und Regressionen

Vor jedem Commit bzw. Test-Build mindestens:

- geänderte Dateien vollständig gegen den Auftrag prüfen,
- offensichtliche Syntax-/Importfehler ausschließen,
- betroffene Nutzerflüsse mit verfügbaren Tests oder gezielter manueller Prüfung durchgehen,
- sicherstellen, dass keine unbeauftragten Dateien oder Funktionen verändert wurden,
- kritische bestehende Funktionen, die durch die Änderung berührt werden könnten, gezielt gegenprüfen.

Bei UI-Änderungen zusätzlich:

- relevante mobile Viewports und Zustände prüfen,
- Safe Areas, Scrollen, Android-Zurück, Dialoge, Fokus und Tastatur berücksichtigen,
- Umsetzung gegen den freigegebenen Mock bzw. die verbindlichen UI-Guidelines vergleichen.

Nach Testfeedback:

- Regressionen zuerst auf derselben Test-Branch beseitigen,
- keine fachfremden Verbesserungen in die Nachbesserung aufnehmen,
- die von der Korrektur potenziell betroffenen kritischen Funktionen erneut prüfen,
- erst danach erneut zum Test bereitstellen.

## 9. Commits und Merge

- Änderungen selbstständig committen.
- Commit-Nachrichten kurz, konkret und im bestehenden Stil halten, z. B. `fix: ...`, `feat: ...`, `docs: ...`, `chore: ...`.
- Ein Commit soll fachlich zusammengehörige Änderungen enthalten.
- Test-Commits bleiben bis zur Freigabe auf der Test-Branch.
- Nach einem Commit den resultierenden Stand bzw. Commit-SHA prüfen und dem Nutzer nennen.
- Merge nach `main` nur gemäß dem Freigabeprozess aus Abschnitt 3.

## 10. Kommunikation

- Vor größeren Änderungen erst Verständnis/Zielbild abstimmen, wenn der Nutzer dies verlangt oder der Scope offen ist.
- Sprachliche Freigaben und Stopps des Nutzers sind Teil des Workflows und verbindlich zu beachten.
- Keine fertige Umsetzung, keinen Test-Build und keinen Merge behaupten, bevor diese tatsächlich erfolgt sind.
- Unsicherheiten klar benennen; nichts erfinden, was im Repository oder in der verfügbaren Build-Infrastruktur nicht vorhanden ist.
