# Kofferly – Design Reference

Diese Datei und die Mockups in `docs/mockups/` sind die verbindliche visuelle Soll-Referenz für die weitere Entwicklung.

## Verbindliche Designsprache

- Forest Green als Primärfarbe
- warme Creme-/Off-White-Flächen
- große, weiche Kartenradien
- ruhige Schatten, keine harte Dashboard-Optik
- Reisezielbild prominent als emotionaler Einstieg
- Countdown und Reisedatum direkt am Hero-Bereich
- klare, freundliche Packfortschritte
- Erinnerungen dezent und hilfreich statt alarmistisch
- Rot nur für echte Fehler bzw. destruktive Aktionen
- Mobile-first / PWA-geeignet

## Header

Der Header bleibt bewusst minimal: links ausschließlich der Schriftzug `Kofferly`, ohne App-Logo. Rechts stehen nur die In-App-Benachrichtigungen und die Aktion zum Anlegen einer neuen Reise. Technische Zustände wie Online/Offline dürfen die visuelle Hierarchie dort nicht dominieren.

## Reisezielbild

Das Zielbild ist funktionaler Bestandteil des Dashboards, nicht bloß Dekoration. Es soll sich am konkreten Reiseziel orientieren. Wird ein Bild online geladen, wird es komprimiert und als Blob in IndexedDB gespeichert, damit es anschließend offline verfügbar ist.

## Countdown-Karte

Direkt unter dem Hero-Bild steht die markante Statuskarte aus der Mockup-Idee. Sie verwendet das Flugzeugmotiv, die Überschrift `Noch etwas zu erledigen` und einen klaren Countdown wie `Die Reise startet in 3 Tagen`. Darunter stehen offene Punkte und die Anzahl wichtiger offener Punkte. Ein direkter Sprung führt zur Packliste. Wenn alles erledigt ist, wechselt die Karte in einen ruhigen `Alles bereit`-Zustand.

## In-App-Benachrichtigungen

Die Glocke im Header sammelt lokale Hinweise wie Countdown-Meilensteine, offene Packpunkte und eine Erinnerung zur Wetteraktualisierung kurz vor Abreise. Gelesen/Ungelesen wird ausschließlich lokal gespeichert. Dafür ist kein Server- oder Push-Dienst erforderlich.

## Packempfehlung

Die Packliste soll nicht nur Stichwörter enthalten. Sie zeigt Mengen und kurze Begründungen, berechnet aus Reisedauer sowie – soweit vorhanden – Zieltyp und Wetter.

## Gestaltungsprinzip

Oben bleibt Kofferly emotional, ruhig und einfach. Detailliertere Funktionen wie Wetter, Mengenberechnung, Packfortschritt und Reiseverwaltung folgen darunter. Neue Funktionen dürfen diese Hierarchie nicht wieder verwässern.

## Referenz-Mockup

- `mockups/kofferly-design-reference-v1.png`

Bei späteren Layout-Änderungen wird zuerst gegen diese Referenz geprüft, bevor neue UI-Muster eingeführt werden.
