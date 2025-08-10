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
- [x] Die Anforderungen wurden gründlich definiert
- [x] Alternativen wurden evaluiert und dokumentiert
- [x] Es ist klar, was im Scope und außerhalb des Scopes liegt
- [x] Ein vollständiges PRD wurde erstellt

### Tasks
- [x] Frontend-Framework auswählen (Vue 3 mit Pinia)
- [x] Git-Library für Browser evaluieren (isomorphic-git)
- [x] WebRTC-Implementation definieren (simple-peer)
- [x] YAML-Parser auswählen (js-yaml)
- [x] Signaling-Mechanismus definieren (minimaler Server)
- [x] State-Management-Architektur entwerfen (URL-basiert + minimale Stores)
- [x] Component-Struktur und UI-Architektur planen (Views + granulare Components)
- [x] P2P-Protokoll und Signaling-Mechanismus detaillieren
- [x] Backend-Architektur für Signaling und Konfigurationen planen
- [x] Persistierung-Strategie (IndexedDB + SQLite/Turso) festlegen
- [x] Build-System und Deployment-Strategie wählen
- [x] Architektur-Dokument erstellen

### Completed
- [x] Frontend-Framework: Vue 3 mit Pinia für State-Management
- [x] Git-Library: isomorphic-git für browser-basierte Git-Operationen
- [x] WebRTC-Library: simple-peer für vereinfachte P2P-Verbindungen
- [x] YAML-Parser: js-yaml für Konfigurationsparsing
- [x] Signaling-Ansatz: Minimaler Server für WebRTC-Handshake
- [x] State-Architektur: URL-basierter State + Pinia Stores (config, connection, game UI)
- [x] Component-Struktur: Views für Routes + granulare Single-Responsibility Components
- [x] P2P-Protokoll: Git-basierte Commit-per-Move Synchronisation
- [x] Backend-Architektur: Node.js + Express + Turso für Signaling
- [x] Persistierung: IndexedDB für Git-Repos, localStorage für UI, URL für State
- [x] Build-System: Vite + TypeScript, Vercel/Netlify + Fly.io Deployment
- [x] Umfassendes Architektur-Dokument mit Mermaid-Diagrammen erstellt

## Plan

### Phase Entrance Criteria:
- [x] Die technische Architektur wurde vollständig definiert
- [x] Tech-Stack-Entscheidungen wurden getroffen und dokumentiert
- [x] Architekturmuster wurden festgelegt
- [x] Nicht-funktionale Anforderungen wurden berücksichtigt

### Tasks
- [x] Implementierungsreihenfolge und Meilensteine definieren
- [x] Frontend-Projekt-Setup planen (Vite, Vue 3, TypeScript, Vitest)
- [x] Backend-Projekt-Setup planen (Node.js, Express, WebSocket, Vitest)
- [x] Test-Setup und Testing-Strategie definieren
- [x] Core-Game-Logic mit hardcoded Stratego-Regeln planen
- [x] Git-basierte P2P-Synchronisation Implementierungsplan
- [x] WebRTC-Verbindungsmanagement Implementierungsplan
- [x] UI-Komponenten und Views Implementierungsplan
- [x] YAML-Konfigurationssystem für später vorbereiten (Architektur)
- [x] Deployment-Pipeline planen
- [x] Risiken und Mitigation-Strategien identifizieren
- [x] Detaillierte Code-Tasks für Implementation erstellen

### Completed
- [x] Implementierungsstrategie überarbeitet: Configuration später, Tests von Anfang an
- [x] Umfassender Implementierungsplan mit EARS-Notation erstellt (docs/IMPLEMENTATION_PLAN.md)
- [x] 7-Phasen-Strategie: Foundation → Core Logic → Git P2P → WebRTC → UI → Integration → YAML
- [x] Vitest als einheitliches Testing-Framework für Frontend und Backend
- [x] Test-unterstützte Entwicklung mit 80%+ Coverage-Ziel
- [x] Hardcoded Stratego-Regeln mit konfigurierbarer Architektur

## Code

### Phase Entrance Criteria:
- [x] Ein detaillierter Implementierungsplan wurde erstellt
- [x] Aufgaben wurden in spezifische, umsetzbare Schritte unterteilt
- [x] Abhängigkeiten und Risiken wurden identifiziert
- [x] Die Implementierungsreihenfolge wurde festgelegt

### Implementation Strategy

**Business Requirements**: Siehe **docs/REQUIREMENTS.md** für vollständige EARS-Notation der fachlichen Anforderungen

**7-Phasen-Implementierung**:
1. **Foundation + Test Setup** (Woche 1-2) - Vite, Vue 3, TypeScript, Vitest für Frontend & Backend
2. **Core Game Logic** (Woche 3-4) - Hardcoded Stratego-Regeln mit konfigurierbarer Architektur
3. **Git-based P2P Synchronization** (Woche 5-6) - isomorphic-git + Commit-per-Move
4. **WebRTC Connection Management** (Woche 7-8) - simple-peer + Signaling-Server
5. **User Interface** (Woche 9-10) - Vue 3 Components + Click-to-Select/Move
6. **Integration & Testing** (Woche 11-12) - E2E mit Playwright + Performance-Tests
7. **YAML Configuration System** (Woche 13-14) - Migration zu konfigurierbaren Regeln

### Development Conventions

**Testing Strategy**:
- **Framework**: Vitest für Frontend und Backend (einheitlich)
- **Coverage**: 90% für Business Logic, 80% für UI Components
- **Test Types**: Unit (Vitest) → Integration (Vitest) → E2E (Playwright)
- **Mocking**: WebRTC, Git-Operationen, externe APIs

**Code Organization**:
- **Hardcoded-First**: Stratego-Regeln initial hardcoded, aber konfigurierbar architektiert
- **Single Responsibility**: Ein Concern pro Datei/Komponente
- **Immutable State**: Unveränderliche State-Objekte für Vorhersagbarkeit
- **URL-based State**: Spielstand über URL transportieren für Shareability

**Git Workflow**:
- **Conventional Commits**: feat/fix/docs/test/refactor für automatisches Versioning
- **Feature Branches**: Kurze Feature-Branches mit schnellem Merge
- **Test-First**: Tests vor oder parallel zur Implementation

**Performance Targets**:
- **Bundle Size**: <500KB total (Vue 3 + Libraries)
- **Load Time**: <3 Sekunden auf Standard-Breitband
- **Interaction**: <100ms für lokale Aktionen
- **Git Performance**: Bis 1000 Commits ohne Degradation

### Risk Mitigation

**Business Logic Risks**:
- Komplexe Kampfregeln → Umfassende Test-Coverage für alle Spezialfälle
- State-Synchronisation → Extensive Conflict-Resolution-Tests
- Spielbalance → Validierung gegen Standard-Stratego-Regeln

**Technical Risks**:
- isomorphic-git Performance → Frühe Benchmarks mit großen Commit-Historien
- WebRTC Browser-Kompatibilität → Cross-Browser-Tests (Chrome, Firefox, Safari, Edge)
- P2P-Synchronisation → Netzwerk-Failure-Simulation und Recovery-Tests

### Tasks

**Phase 1: Foundation + Test Setup (Woche 1-2)**
- [x] Frontend-Projekt initialisieren (Vite + Vue 3 + TypeScript + Vitest)
- [x] Backend-Projekt initialisieren (Node.js + Express + Vitest)
- [x] Grundlegende UI-Komponenten erstellen (Button, Modal, LoadingSpinner)
- [x] Test-Setup konfigurieren und erste Tests schreiben
- [ ] CI/CD-Pipeline einrichten
- [x] Projekt-Struktur und Coding-Standards etablieren

**Phase 2: Core Game Logic (Woche 3-4)**
- [ ] Game State Management implementieren
- [ ] Movement System mit Validierung
- [ ] Combat System mit Stratego-Regeln
- [ ] Game Setup und Turn Management
- [ ] Umfassende Tests für alle Game Logic

**Phase 3-7: Weitere Phasen**
- [ ] *Werden nach Abschluss der aktuellen Phase hinzugefügt*

### Completed
- [x] Frontend-Projekt erfolgreich initialisiert mit Vue 3 + Vite + TypeScript + Vitest
- [x] Backend-Server läuft mit Express + WebSocket + Health-Check-Endpoint
- [x] Button-Komponente mit umfassenden Tests (6/6 Tests bestehen)
- [x] GameView und HomeView mit Navigation implementiert
- [x] Grundlegende UI mit Tailwind CSS und responsivem Design
- [x] Test-Setup funktioniert für Frontend und Backend

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
- **Frontend-Framework**: Vue 3 mit Pinia für State-Management
- **Git-Library**: isomorphic-git für browser-basierte Git-Operationen (~200KB)
- **WebRTC-Library**: simple-peer für vereinfachte P2P-Verbindungen (~25KB)
- **YAML-Parser**: js-yaml für Konfigurationsparsing (~45KB)
- **Signaling**: Minimaler Server für WebRTC-Handshake
- **Backend**: Node.js + Express + SQLite/Turso
- **State-Management**: URL-basierter State + Pinia Stores (config, connection, game UI)
- **Component-Architektur**: Views für Routes + granulare Single-Responsibility Components
- **Implementierungsstrategie**: Hardcoded Stratego-Regeln zuerst, YAML-Konfiguration später
- **Testing-Ansatz**: Test-unterstützte Entwicklung von Anfang an (Vitest, Jest)
- **Backend-DB**: SQLite/Turso für Konfigurationsspeicherung (zukünftig)
- **Out of Scope v1**: Nutzer-Konfiguration, grafischer Editor, KI, Turniere, Tutorials, Chat

## Notes
### Business Requirements
Siehe **docs/REQUIREMENTS.md** für vollständige fachliche Anforderungen mit EARS-Notation:
- Game State Management (REQ-G001-G006)
- Movement System (REQ-M001-M008) 
- Combat System (REQ-C001-C009)
- Game Setup Rules (REQ-S001-S007)
- Turn Management (REQ-T001-T006)
- Git-based Synchronization (REQ-GIT001-GIT007)
- P2P Communication (REQ-P2P001-P2P005)
- Connection Management (REQ-CONN001-CONN006)
- User Interface Logic (REQ-UI001-UI007)
- Configuration Migration (REQ-YAML001-YAML005)

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
