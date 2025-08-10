# Strateturn - Product Requirements Document

## Vision
Ein konfigurierbares, browser-basiertes Strategiespiel, das Familien, Freunden und Lehrern ermöglicht, thematische Varianten von Stratego-ähnlichen Spielen zu spielen.

## Zielgruppe
- **Primär**: Familien/Freunde für gemeinsame Spielzeit
- **Sekundär**: Lehrer/Schüler für thematische Lernspiele
- **Nicht**: Militär-/Stratego-Enthusiasten

## Success Metrics
- Anzahl gespielter Spiele
- Wiederkehrende Nutzer

## Core Features v1

### 1. Deklarative YAML-Konfiguration
- Vollständig konfigurierbare Spielregeln via YAML
- Brettgröße, Figurenanzahl, Ränge, Kampf- und Bewegungsregeln
- Numerische Ränge mit benutzerdefinierten Namen pro Partei

### 2. Vorgefertigte Spielvarianten
- **Klassisches Stratego**: 10x10 Brett, 40 Figuren pro Spieler
- **Mini-Stratego**: 8x8 Brett, 24 Figuren pro Spieler

### 3. P2P-Verbindung
- WebRTC-basierte Peer-to-Peer-Kommunikation
- Link-basiertes Matchmaking mit Einmal-Links
- Spieler 1 erstellt Raum und teilt Link mit Spieler 2

### 4. Git-basierte Synchronisation
- Merkle-Tree/Git-Ansatz für Tamper-Evidence
- Nur Commits (keine Branches/Merges)
- Fast-Forward-Merges für Synchronisation
- Einseitiger Reset bei Konflikten
- Local-First mit Browser-Persistierung

### 5. Benutzerfreundliches Interface
- Click-to-Select/Click-to-Move (kein Drag&Drop)
- Gleichzeitige Aufstellungsphase beider Spieler
- Überschreiben sendet Figur zurück in Vorrat
- Keine Bestätigung bei Zügen erforderlich

### 6. Cross-Browser-Kompatibilität
- Alle modernen Browser (Chrome, Firefox, Safari, Edge)
- Mobile Browser unterstützt (aber keine Mobile-Optimierung v1)

## Spielmechaniken

### Kampfsystem
- **Rangbasiert**: Höherer Rang schlägt niedrigeren
- **Gleicher Rang**: Beide Figuren sterben
- **Spezialregeln** (konfigurierbar pro Figur):
  - `defeats_additionally`: Schlägt zusätzlich spezifische Figuren (Spion vs. Marschall)
  - `defeats_all_except`: Schlägt alle außer spezifischen Figuren (Bombe vs. Mineur)

### Bewegungsregeln
- **Standard**: 1 Feld pro Zug
- **Aufklärer**: Unbegrenzte Bewegung in gerader Linie
- **Unbewegliche**: Bomben und Fahne (movement: 0)

### Spielende
- **Siegbedingung**: Nur "Capture the Flag"
- **Unentschieden**: Möglich wenn keine beweglichen Figuren mehr vorhanden
- **Aufgabe**: Einseitige Aufgabe möglich

### Validierung
- System verhindert ungültige Züge komplett
- Keine Timeouts - Spieler regeln außerhalb der Plattform

## YAML-Konfigurationsschema

```yaml
game:
  name: "Klassisches Stratego"
  board:
    width: 10
    height: 10
    obstacles: 
      - {x: 2, y: 4, width: 2, height: 2, type: "lake"}
      - {x: 6, y: 4, width: 2, height: 2, type: "lake"}
  
  players:
    - name: "Rot"
      pieces:
        - rank: 10, name: "Marschall", count: 1, movement: 1
        - rank: 9, name: "General", count: 1, movement: 1
        - rank: 8, name: "Oberst", count: 2, movement: 1
        - rank: 7, name: "Major", count: 3, movement: 1
        - rank: 6, name: "Hauptmann", count: 4, movement: 1
        - rank: 5, name: "Leutnant", count: 4, movement: 1
        - rank: 4, name: "Feldwebel", count: 4, movement: 1
        - rank: 3, name: "Mineur", count: 5, movement: 1
        - rank: 2, name: "Aufklärer", count: 8, movement: "unlimited"
        - rank: 1, name: "Spion", count: 1, movement: 1
        - rank: 0, name: "Bombe", count: 6, movement: 0
        - rank: -1, name: "Fahne", count: 1, movement: 0
    - name: "Blau" 
      pieces:
        # ... (identische Struktur)

  combat_rules:
    - piece: "Spion", defeats_additionally: ["Marschall"]
    - piece: "Mineur", defeats_additionally: ["Bombe"]
    - piece: "Bombe", defeats_all_except: ["Mineur"]
    - piece: "Fahne", defeats_all_except: []  # wird von allen geschlagen
```

## Technical Approach

### Architecture Principles
- **Local-First**: Spielstand immer browser-lokal gepuffert
- **P2P-First**: Direkte Kommunikation zwischen Clients
- **Git-Inspired**: Versionierung und Synchronisation wie in Git
- **Declarative**: Komplette Spiellogik über YAML konfigurierbar

### Reconnect-Mechanismus
- Re-Join mit existierendem Link übernimmt Spielstand vom Gegner
- Lokale Persistierung als Fallback
- Fast-Forward-Merge bei Wiederverbindung

## Out of Scope v1
- Nutzer-erstellte Konfigurationen
- Grafischer Konfigurationseditor
- KI-Gegner
- Turniere/Ligen
- Tutorials
- In-Game-Chat
- Mobile-Optimierung
- Mehrspielerspiele (>2 Spieler)

## Future Considerations
- **v2**: Grafischer YAML-Editor
- **v3**: Community-Sharing von Konfigurationen
- **v4**: Thematische Templates (Harry Potter, Minecraft, etc.)
- **v5**: Mobile-optimierte UI
- **v6**: Erweiterte Spielmodi und Turniere
