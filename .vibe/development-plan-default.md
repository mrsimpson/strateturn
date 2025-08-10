# Development Plan: Strateturn - Browser-basiertes Stratego-Spiel

*Generated on 2025-07-29 by Vibe Feature MCP*
*Workflow: [greenfield](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/greenfield)*

## Goal
Entwicklung eines konfigurierbaren, browser-basierten Strategiespiels, bei dem Benutzer Aspekte wie Brettgröße, Ränge und Schlagverhalten deklarativ konfigurieren können. Unterstützung für verschiedene Themes (Harry Potter, Minecraft, Schulklasse, etc.) mit Peer-to-Peer-Verbindung zwischen zwei Spielern.

## Ideation
### Tasks
- [x] Detaillierte Anforderungsanalyse durchführen
- [x] YAML-Konfigurationsschema für Spielregeln definieren
- [x] Vorgefertigte Spielkonfigurationen spezifizieren (Klassisch + Mini)
- [x] Kampfsystem-Mechaniken detailliert ausarbeiten
- [x] Peer-to-Peer Verbindungsarchitektur konzipieren
- [x] Git-basierte Spielstand-Synchronisation definieren
- [x] Zielgruppe und Benutzerprofile definieren
- [x] Product Requirements Document (PRD) erstellen

### Completed
- [x] Created development plan file
- [x] Grundlegende Vision und Scope geklärt
- [x] UX-Flow und Interface-Entscheidungen getroffen
- [x] Spielvarianten und Kampfregeln finalisiert

## Architecture

### Phase Entrance Criteria:
- [ ] Die Anforderungen wurden gründlich definiert
- [ ] Alternativen wurden evaluiert und dokumentiert
- [ ] Es ist klar, was im Scope und außerhalb des Scopes liegt
- [ ] Ein vollständiges PRD wurde erstellt

### Tasks
- [ ] *To be added when this phase becomes active*

### Completed
*None yet*

## Plan

### Phase Entrance Criteria:
- [ ] Die technische Architektur wurde vollständig definiert
- [ ] Tech-Stack-Entscheidungen wurden getroffen und dokumentiert
- [ ] Architekturmuster wurden festgelegt
- [ ] Nicht-funktionale Anforderungen wurden berücksichtigt

### Tasks
- [ ] *To be added when this phase becomes active*

### Completed
*None yet*

## Code

### Phase Entrance Criteria:
- [ ] Ein detaillierter Implementierungsplan wurde erstellt
- [ ] Aufgaben wurden in spezifische, umsetzbare Schritte unterteilt
- [ ] Abhängigkeiten und Risiken wurden identifiziert
- [ ] Die Implementierungsreihenfolge wurde festgelegt

### Tasks
- [ ] *To be added when this phase becomes active*

### Completed
*None yet*

## Document

### Phase Entrance Criteria:
- [ ] Die Kernimplementierung ist abgeschlossen
- [ ] Alle geplanten Features wurden umgesetzt
- [ ] Das System funktioniert gemäß den Anforderungen
- [ ] Tests wurden durchgeführt und bestanden

### Tasks
- [ ] *To be added when this phase becomes active*

### Completed
*None yet*

## Key Decisions
- **Konfigurationsformat**: YAML für deklarative Spielregeln (Editor später)
- **Vorgaben**: Sinnvolle Kombinationen (10x10 Brett, 40 Figuren) als Templates
- **Figurenkonfiguration**: Anzahl pro Rang immer konfigurierbar
- **Rangsystem**: Numerische Werte mit benutzerdefinierten Namen pro Partei
- **Kampfmechaniken**: Stratego-Mechanismen (Bomben, Mineur, Spion) pro Figur konfigurierbar
- **Kampfregeln**: Gleicher Rang = beide sterben, Fahne von allen besiegbar
- **Spielvarianten**: Klassisch (10x10, 40 Figuren) + Mini (8x8, 24 Figuren)
- **Raum-Links**: Einmal-Links pro Spiel
- **Bewegungsregeln**: Pro Figur konfigurierbar (Aufklärer = mehrere Felder, andere = 1 Feld)
- **Starttheme**: Klassisches Stratego als Basis
- **Spielstart**: Spieler 1 konfiguriert Raum/Brett/Figuren, teilt Link
- **Aufstellung**: Gleichzeitig, Click-to-Select, Überschreiben sendet Figur zurück in Vorrat
- **Spielzüge**: Click-to-Select, Click-to-Move, keine Bestätigung
- **Browser-Support**: Alle modernen Browser inkl. mobil (aber keine Mobile-Optimierung v1)
- **Persistenz**: Merkle-Tree/Git-basiert für Synchronisation und Cheating-Prevention
- **Reconnect**: Local-First mit Browser-Pufferung, Re-Join übernimmt Stand vom Gegner
- **Verbindung**: Link-basiertes Matchmaking (evtl. über Server für Discovery)
- **Zielgruppe**: Familien/Freunde und Lehrer/Schüler (nicht Militär-Enthusiasten)
- **Success Metrics**: Anzahl gespielter Spiele und wiederkehrende Nutzer
- **Spielende**: Nur "Capture the Flag", Unentschieden und Aufgabe möglich
- **Züge-Validierung**: System verhindert ungültige Züge komplett
- **Timeouts**: Keine - Spieler regeln außerhalb der Plattform
- **Out of Scope v1**: Nutzer-Konfiguration, grafischer Editor, KI, Turniere, Tutorials, Chat

## Notes
### Product Requirements Document (PRD)

**Vision**: Ein konfigurierbares, browser-basiertes Strategiespiel, das Familien, Freunden und Lehrern ermöglicht, thematische Varianten von Stratego-ähnlichen Spielen zu spielen.

**Zielgruppe**: 
- Primär: Familien/Freunde für gemeinsame Spielzeit
- Sekundär: Lehrer/Schüler für thematische Lernspiele
- Nicht: Militär-/Stratego-Enthusiasten

**Success Metrics**:
- Anzahl gespielter Spiele
- Wiederkehrende Nutzer

**Core Features v1**:
1. **Deklarative YAML-Konfiguration** für Spielregeln
2. **Vorgefertigte Templates** (Start: Klassisches Stratego)
3. **P2P-Verbindung** via WebRTC mit Link-Sharing
4. **Git-basierte Synchronisation** (Commits, Fast-Forward, Reset bei Konflikten)
5. **Click-to-Select/Move Interface** ohne Drag&Drop
6. **Gleichzeitige Aufstellungsphase**
7. **Cross-Browser-Kompatibilität** (Desktop + Mobile)

**Spielmechaniken**:
- Konfigurierbare Brettgröße und Figurenanzahl
- Numerische Ränge mit benutzerdefinierten Namen
- Stratego-Kampfregeln (defeats_additionally, defeats_all_except)
- Konfigurierbare Bewegungsregeln pro Figur
- Nur "Capture the Flag" Siegbedingung
- Unentschieden und Aufgabe möglich
- Keine ungültigen Züge (System-Validierung)
- Keine Timeouts

**Technical Approach**:
- Local-First mit Browser-Persistierung
- Merkle-Tree/Git für Tamper-Evidence
- WebRTC für P2P-Kommunikation
- YAML für Spielkonfiguration

### YAML-Schema Entwurf:
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
        - rank: 2, name: "Aufklärer", count: 8, movement: "unlimited"
        - rank: 0, name: "Bombe", count: 6, movement: 0
        - rank: -1, name: "Fahne", count: 1, movement: 0
    - name: "Blau" 
      pieces:
        - rank: 10, name: "Marschall", count: 1, movement: 1
        # ... (gleiche Struktur)

  combat_rules:
    - piece: "Spion", defeats_additionally: ["Marschall"]
    - piece: "Mineur", defeats_additionally: ["Bombe"]
    - piece: "Bombe", defeats_all_except: ["Mineur"]
    - piece: "Fahne", defeats_all_except: []  # wird von allen geschlagen
```

### Git-Integration:
- **Nur Commits**: Keine Branches/Merges, nur lineare Historie
- **Fast-Forward-Merges**: Einfache Synchronisation zwischen Clients
- **Konfliktauflösung**: Einseitiger Reset bei Divergenz
- **Commit-Granularität**: TBD (jeder Zug vs. Phasen)

---
*This plan is maintained by the LLM. Tool responses provide guidance on which section to focus on and what tasks to work on.*
