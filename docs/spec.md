# Visual Map Editor — Product Requirements Document

## 1. Context & Problem

Digital board games often model the world as a **graph of zones** — discrete locations connected by adjacencies that regulate point-to-point movement of units. Designing such a map today means sketching it on paper or hand-editing JSON, both of which are slow, error-prone, and hard to iterate on.

We want a focused, **Excalidraw-like visual editor** whose sole job is to let a designer lay out zones, connect them, and annotate them with the properties a game rule-engine will consume. The editor itself does not play games; it produces a map document.

**Outcome we want:** a designer can open the app, sketch a map with a reference image underneath, annotate every zone and connection, and export a clean data file ready for a game engine — in a single sitting, without reading a manual.

## 2. Target User & Persona

**Primary user: The Map Designer.**

- Hobbyist or indie board-game designer. Visually-oriented. Comfortable with tools like Figma, Excalidraw, Tiled.
- Iterates quickly: sketches, reworks, scraps, retries. Expects undo, autosave, and zero friction.
- Treats the map as a living document; will re-open it many times and tweak it.
- Not a programmer in the context of this task — does **not** want to edit JSON by hand, but is comfortable exporting/importing files.

**Secondary consumer: The Game Engine.**

- An external system (out of scope for this app) that reads the exported map file. The editor must emit a structured, predictable format so this consumer is easy to build.

## 3. Goals & Non-Goals

### Goals

- Let a designer build a zone-graph map visually in minutes.
- Capture all data a movement rule-engine would need: zones, adjacencies, terrain, ownership, free-form tags.
- Never lose work: autosave locally, plus explicit export/import.
- Feel calm and minimal — Excalidraw-style, not Photoshop-style.

### Non-goals (v1)

- Playing the game / simulating movement.
- Multiplayer or real-time collaboration.
- Accounts, cloud sync, sharing links.
- Multiple maps / a map library (one map at a time).
- Custom terrain palettes (the terrain set is fixed for v1).
- Directed edges / one-way connections (all edges are two-way in v1).
- Numeric movement costs on edges (deferred; can be modeled with tags on zones for now).
- Mobile / touch-first support (desktop mouse + keyboard first).

## 4. Core Concepts (Domain Model)

| Concept              | Description                                                                                                                                           |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Map**              | The document being edited. Has a name, an optional background reference image, and a graph of zones + edges.                                          |
| **Zone**             | A node in the graph. Visually a colored circle with a label. Represents a location on the map.                                                        |
| **Edge**             | An undirected connection between two zones. Represents that units can move directly between them.                                                     |
| **Terrain (zone)**   | A fixed category that determines the zone's color and semantic meaning. **v1 set: Plains · Forest · City.**                                           |
| **Edge type**        | A fixed category for a connection. **v1 set: Primary road · Secondary road · Trail.**                                                                 |
| **Owner / faction**  | Free-text label indicating who controls a zone by default. Optional.                                                                                  |
| **Tags**             | Free-form `key = value` pairs on a zone, for game-specific data the fixed schema doesn't cover (e.g. `supply=3`, `capital=true`, `garrison=militia`). |
| **Background image** | An optional reference image (scanned board, concept art, world map) that sits underneath the graph so the designer can trace zones on top of it.      |

### Zone properties

- `label` (string, required, defaults to `Zone N`)
- `terrain` (one of Plains / Forest / City; defaults to Plains)
- `owner` (string, optional)
- `tags` (list of key/value pairs, keys must be unique within a zone)
- position on the canvas

### Edge properties

- `type` (one of Primary road / Secondary road / Trail; defaults to Secondary road)
- the two zones it connects
- Edges are **undirected**. There can be at most one edge between any pair of zones. A zone cannot connect to itself.

## 5. User Stories

### Creating a map

- **US-01** As a designer, I want to start with a blank canvas so I can begin sketching immediately without any setup.
- **US-02** As a designer, I want to upload a reference image of an existing map so I can trace zones over it.
- **US-02a** As a designer, I want to drag the background image to reposition it under my existing zones so I can align a newly-attached reference to a graph I already started.
- **US-03** As a designer, I want to give my map a name so I can recognize it when I export it.

### Building the graph

- **US-04** As a designer, I want to place a zone with a single click so adding locations feels effortless.
- **US-05** As a designer, I want to connect two zones with a simple click-to-click gesture so defining adjacencies is quick.
- **US-06** As a designer, I want to move zones around freely so I can refine the layout as the map evolves.
- **US-07** As a designer, I want to delete a zone or an edge with a single keystroke so cleanup is fast.
- **US-08** As a designer, when I delete a zone, I want any connections touching it to disappear automatically so I never end up with dangling edges.

### Annotating

- **US-09** As a designer, I want to pick a terrain for each zone so the map visually communicates its geography.
- **US-10** As a designer, I want to set an owner on a zone so I can describe initial control.
- **US-11** As a designer, I want to add arbitrary key-value tags to a zone so my game's specific rules can read data the editor doesn't know about.
- **US-12** As a designer, I want to set the type of a connection (primary road, secondary road, trail) so the map shows the difference between major arteries and footpaths.
- **US-13** As a designer, I want to rename a zone so each location has a meaningful name.

### Navigation & editing comfort

- **US-14** As a designer, I want to pan and zoom the canvas so I can work on both the overview and fine details.
- **US-15** As a designer, I want to undo and redo any change so I can experiment fearlessly.
- **US-16** As a designer, I want the app to autosave so a browser crash doesn't cost me work.
- **US-17** As a designer, I want a clear visual indication of what is currently selected so I always know what my edits will affect.
- **US-18** As a designer, I want the currently active tool to be obvious so I don't accidentally add zones when I meant to select one.

### Moving work between sessions

- **US-19** As a designer, I want to export my map as a file so I can version it, share it, or hand it to the game engine.
- **US-20** As a designer, I want to import a previously exported file so I can resume or revise old maps.
- **US-21** As a designer, I want a "New Map" action that clears the canvas (with a confirmation) so I can start fresh without touching files.

## 6. Functional Requirements

### 6.1 Canvas & navigation

- **FR-1** The canvas is **full-screen**: it occupies the entire browser page edge-to-edge. All other UI elements (header, toolbar, inspector) float on top of it as overlays rather than taking dedicated space from it.
- **FR-2** The designer can **pan** the canvas by dragging with the Pan tool, by holding Space while dragging, or by middle-mouse drag.
- **FR-3** The designer can **zoom** with the mouse wheel. Zoom stays centered on the cursor (the world point under the cursor does not move). Zoom range roughly 25%–400%.
- **FR-4** The canvas shows an optional **background reference image** beneath all zones and edges. The image is anchored in world coordinates and pans/zooms with the graph.

### 6.2 Tools (toolbar)

A small **horizontal toolbar overlayed on top of the canvas, anchored near the top of the screen**, exposes mutually-exclusive **modes**. The toolbar floats above the canvas (Excalidraw-style) rather than occupying its own band — the canvas extends underneath it. Only one tool is active at a time, and the active tool is visually highlighted.

- **Select tool.** Clicking a zone or an edge selects it. Clicking empty canvas deselects. Dragging a selected zone moves it.
- **Add Zone tool.** Clicking empty canvas creates a new zone at that point, with default terrain (Plains) and an auto-incremented label (`Zone 1`, `Zone 2`, …). The new zone is selected immediately so the designer can rename it.
- **Connect tool.** Clicking a zone, then clicking a second zone, creates an edge between them. Clicking empty canvas in the middle cancels. Self-edges and duplicate edges are silently rejected.
- **Pan tool.** Dragging pans the canvas. No selection or creation happens.
- **Background tool.** Dragging the canvas **repositions the background reference image** relative to the graph. Zones and edges stay in place; only the background moves. This lets the designer align an imported image to zones that are already laid out (or vice versa). If no background image is attached, the tool is a no-op.

Deleting the current selection is done with the `Delete` / `Backspace` key only — there is no dedicated button for it.

### 6.3 Inspector (right overlay)

A small **panel overlayed on top of the canvas, anchored to the right edge** of the screen, shows properties for whatever is selected. Like the toolbar, it floats above the canvas rather than claiming its own column — the canvas extends underneath it. Edits in the inspector apply live.

- **Nothing selected → Map inspector.** Map name; "Attach background image" button (opens a file picker); "Clear background image" button when one is set. No thumbnail preview — the canvas itself shows the image.
- **Zone selected → Zone inspector.** Label, terrain (dropdown: Plains / Forest / City), owner (free text), tags editor (list of key/value rows with add + remove), delete button.
- **Edge selected → Edge inspector.** Edge type (dropdown: Primary road / Secondary road / Trail), read-only display of the two connected zone labels, delete button.

### 6.4 Visual language

- **Zones** are circles. Color is determined by terrain:
  - Plains — light green
  - Forest — dark green
  - City — brown
- Each zone shows its label **exactly below** the circle (never inside it).
- A selected zone gets a clear highlight (ring/outline) so selection is obvious.
- **Edges** are lines between zone centers. Style is determined by edge type:
  - **Primary road** — thick, solid, dark
  - **Secondary road** — medium, solid, muted
  - **Trail** — medium, dashed
- A selected edge gets a clear highlight.
- While in the Connect tool, after clicking the first zone, a **ghost line** follows the cursor until the second click.

### 6.5 Background reference image

- **Purpose.** The background image is a **tracing aid for the designer only**. The game engine never needs it — it consumes only the zone graph. This drives the decisions below.
- **Attaching an image.** The designer clicks "Attach background image" in the Map inspector and picks a file from their local machine through the OS file picker. The image appears beneath all zones and edges, anchored in world coordinates so it pans and zooms with the graph.
- **Repositioning.** The designer can re-align the background relative to the graph using the **Background tool** (see §6.2). Zones do not move; only the image does.
- **Clearing.** The designer can remove the background from the Map inspector.
- **Session persistence.** The background image survives browser refresh: it is kept in the editor's local browser storage alongside the rest of the autosaved map. The designer does not have to re-pick the file every time they open the app.
- **Export.** The exported map file **does not include the background image**. Export is the format the game engine consumes, and the engine does not need the tracing reference. This also keeps exported files small and portable. If the designer wants to preserve the image across machines or tools, they keep the original file themselves.

### 6.6 Persistence

- **Autosave.** Every change is automatically saved to the browser's local storage within ~1 second, so closing the tab and coming back later restores exactly where the designer left off — including the attached background image.
- **Export.** The designer can export the current map as a single `.json` file named after the map. The file describes the zone graph (zones, edges, properties, map name). It is versioned so future editor versions can migrate older files. **It does not include the background reference image** — see §6.5.
- **Import.** The designer can import a previously-exported `.json` file. If the file is malformed or from an incompatible version, the editor shows an error and leaves the current map untouched. Imported maps do not carry a background; the designer re-attaches one if they want to.
- **New map.** A "New Map" button clears the canvas. Because this destroys the current work, it is confirmed with a dialog ("Start a new map? Your current map will be cleared. Export first if you want to keep it.").

### 6.7 Undo / redo

- **FR-U1** Every document-changing action is undoable: create/move/delete/edit zone, create/delete/edit edge, rename map, attach/clear background.
- **FR-U2** Undo and redo are reachable via the header buttons and via `Ctrl/Cmd+Z` and `Ctrl/Cmd+Shift+Z`.
- **FR-U3** A drag that moves a zone from A to B collapses into a **single** undo step (not one step per pixel).
- **FR-U4** Purely view-only changes — panning, zooming, selecting, switching tools — do **not** enter the undo history.

### 6.8 Keyboard shortcuts (v1)

| Shortcut               | Action                                  |
| ---------------------- | --------------------------------------- |
| `V`                    | Select tool                             |
| `Z`                    | Add Zone tool                           |
| `C`                    | Connect tool                            |
| `H` / hold `Space`     | Pan tool / temporary pan                |
| `B`                    | Background tool                         |
| `Delete` / `Backspace` | Delete selection                        |
| `Ctrl/Cmd+Z`           | Undo                                    |
| `Ctrl/Cmd+Shift+Z`     | Redo                                    |
| `Esc`                  | Cancel in-progress connection; deselect |

## 7. Non-Functional Requirements

- **Feel.** Interactions must feel immediate. Placing a zone, dragging it, and connecting it should have no perceptible lag on a map of up to a few hundred zones.
- **Clarity.** At all times the designer can tell: (a) which tool is active, (b) what is currently selected, (c) whether their work is saved.
- **Safety.** No action other than "New Map" and "Delete" destroys work, and both are either confirmed or trivially undoable.
- **Portability.** The exported map file is self-sufficient — opening it on another machine produces an identical editing experience (image included).
- **Accessibility, minimum bar.** All inspector controls are reachable by keyboard; focus states are visible; color is never the only channel conveying meaning (zones also carry a label; edges also carry visual weight/dash differences).
- **Browser scope.** Latest Chrome, Firefox, Safari on desktop. No mobile requirements for v1.

## 8. UX Layout (at a glance)

The canvas is full-screen. The header bar, the tool toolbar, and the inspector panel all **float on top** of the canvas as overlays — the canvas (including its background image) extends edge-to-edge underneath them. This matches the Excalidraw/Figma feel: nothing around the drawing, just the drawing, with small floating controls.

```
 ┌───────────────────────────────────────────────────────────────┐
 │ ╔══════════════╗   ╔═════════════════════╗    ┌─────────────┐ │
 │ ║ [Map name] … ║   ║  ▸ Sel Zone Conn    ║    │             │ │
 │ ║ Undo  Redo   ║   ║  Pan  Background    ║    │  INSPECTOR  │ │
 │ ║ New Imp Exp  ║   ╚═════════════════════╝    │             │ │
 │ ╚══════════════╝                              │  Map /      │ │
 │                                               │  Zone /     │ │
 │              F U L L - S C R E E N            │  Edge props │ │
 │                  C A N V A S                  │             │ │
 │           (background image · edges ·         │             │ │
 │              zones pan/zoom freely)           └─────────────┘ │
 │                                                               │
 └───────────────────────────────────────────────────────────────┘
   ↑ canvas fills the entire browser viewport; all panels overlay it
```

## 9. Acceptance Criteria (v1 "done")

The editor is considered shipped when a first-time user, with no instructions, can do the following in a single session:

1. Open the app and see a blank canvas with an obvious toolbar and an empty inspector.
2. Give the map a name.
3. Attach a local image as background.
4. Place at least ten zones on top of that image using the Add Zone tool.
5. Connect them into a graph using the Connect tool, with a mix of the three edge types.
6. Rename three zones, change their terrain to three different values, and set an owner on one of them.
7. Add at least one custom tag to a zone.
8. Move a zone, undo the move, redo the move.
9. Delete a zone and observe that its edges also disappear; then undo to restore both the zone and its edges.
10. Refresh the browser and see the exact same map (including background image) restored.
11. Export the map to a file, start a new map, then import the file and see the original zone graph back (background image is not expected to return — that behavior is documented in §6.5).
12. Import a deliberately broken file and see a clear error that does **not** destroy the current map.

If all twelve steps succeed without the user asking for help, v1 is done.

## 10. Out of Scope (explicit)

- Playing or simulating a game on the map.
- Collaborative / multi-user editing.
- Accounts, cloud storage, sharing links.
- Directed edges, weighted edges, hyperedges.
- Numeric movement costs on edges.
- Custom / user-editable terrain palettes (locked to Plains / Forest / City).
- Custom / user-editable edge types (locked to Primary road / Secondary road / Trail).
- Multiple maps / map library (single map at a time; export/import covers archival).
- Including the background reference image in exported files.
- Grouping zones into regions, layers, or territories.
- Procedural generation, import from external map formats.
- Versioning / history beyond undo/redo within a session.
- Mobile / touch / tablet support (desktop mouse + keyboard only).
