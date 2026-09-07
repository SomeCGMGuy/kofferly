# Kofferly – Designreferenz

Diese Datei und die Bilder unter `docs/mockups/` sind die verbindliche visuelle Soll-Vorgabe für Kofferly.

## Grundgefühl

Kofferly soll wie eine ruhige, hochwertige Reise-App wirken – nicht wie eine technische Checklisten-Anwendung.

- Forest Green als Primärfarbe
- warmes Creme / Off-White als Hintergrund
- Sage- und Peach-Akzente
- großzügige Rundungen
- weiche, zurückhaltende Schatten
- klare Hierarchie und viel Luft
- keine aggressive Alarm-Optik für normale Erinnerungen

## Dashboard

1. Im Header steht links ausschließlich **Kofferly** als Schriftzug. Dort wird kein App-Logo gezeigt.
2. Das große Reisezielbild ist das emotionale Hero-Element.
3. Direkt danach folgt – wenn die Abreise näher rückt und noch Dinge offen sind – die Karte **„Noch etwas zu erledigen“**.
4. Die Karte nutzt ein Flugzeugmotiv und den Text **„Die Reise startet in …“**.
5. Ein Tipp auf diese Karte öffnet eine ruhige Detailansicht der noch unvollständigen Kategorien.
6. Packfortschritt, Wetter und weitere Reiseinformationen folgen erst darunter.

## Benachrichtigungen

- Im Header sitzt rechts ein dezentes Glockensymbol.
- Ungelesene Hinweise werden mit einem kleinen Zähler markiert.
- Der Benachrichtigungsbereich besitzt die Filter **Alle**, **Wichtig** und **Tipps**.
- Benachrichtigungen bleiben lokal und gehören zur Offline-first-Strategie.
- Countdown-, Pack-, Letzter-Check-, Wetter- und Reisetipp-Hinweise sollen ruhig formuliert sein.
- Benachrichtigungsarten können in den Einstellungen einzeln deaktiviert werden.

## Erinnerungslogik

- mehr als 7 Tage: kein prominenter Aufgabenhinweis auf dem Dashboard
- 7–3 Tage: sanfter Hinweis auf größere offene Bereiche
- 2 Tage bis Abreise: wichtige offene Punkte deutlich sichtbarer
- 24 Stunden / letzter Tag: „Letzter Check“
- alles erledigt: keine unnötige Warnkarte

## App-Icon

Das sichtbare App-Icon darf nicht als UI-Logo im Header missverstanden werden. Für Android werden normale und maskierbare Icons getrennt behandelt.

Das maskierbare Icon muss:

- einen vollflächigen Forest-Green-Hintergrund besitzen
- das eigentliche Koffer-Motiv deutlich innerhalb der Safe-Zone halten
- auch bei runder oder Squircle-Maske vollständig erkennbar bleiben

Dies ist insbesondere für Launcher mit aggressivem Zuschnitt wie auf manchen Xiaomi-/HyperOS-Geräten relevant.

## Mockup

Aktuelle Referenz:

- `mockups/kofferly-design-reference-v1.png`

Bei späteren Layout-Änderungen muss zuerst geprüft werden, ob die Änderung mit dieser Designsprache konsistent bleibt.
