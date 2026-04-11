# Visual Map Editor — v1 Implementation Plan

## Context

The repo is a clean Vite 8 + React 19 + TypeScript + Tailwind v4 + shadcn/ui scaffold. [src/App.tsx](src/App.tsx) renders a hello-world; only one shadcn component ([src/components/ui/button.tsx](src/components/ui/button.tsx)) and [src/lib/utils.ts](src/lib/utils.ts) exist. All domain code must be built from scratch to satisfy [docs/spec.md](docs/spec.md).

The goal is a focused, Excalidraw-like, single-document zone-graph editor: full-screen SVG canvas with floating header/toolbar/inspector overlays, five mutually-exclusive tools, undo/redo, autosave, and JSON export/import. Acceptance is the 12-step walkthrough in spec §9.

**Chosen approach (confirmed with user):**

- Rendering: **SVG with React**. Simple, idiomatic, handles the "few hundred zones" target (spec §7).
- State: **Zustand** with a history slice for snapshot-based undo/redo.
- Persistence: **localStorage** for map JSON (small, fast) + **IndexedDB via `idb-keyval`** for the background image blob (avoids the ~5 MB base64 quota cliff). Matches spec §6.5 "background survives refresh" and §6.6 export excluding the image.

## Dependencies to add

```
pnpm add zustand idb-keyval
pnpm dlx shadcn@latest add input select dialog label separator tooltip alert
```

## File layout (new files unless noted)

```
src/
  types/map.ts                    # Zone, Edge, MapDoc, Terrain, EdgeType, ExportedMap
  constants/
    terrain.ts                    # Plains/Forest/City + Tailwind color tokens
    edgeTypes.ts                  # Primary/Secondary/Trail stroke width/dash
    shortcuts.ts                  # V/Z/C/H/B/Delete/Ctrl+Z/Ctrl+Shift+Z/Esc
  lib/
    id.ts                         # crypto.randomUUID wrapper
    storage.ts                    # localStorage map + idb-keyval image; debounced save
    export.ts                     # serialize, parse, validate, version migrate
    geometry.ts                   # screen<->world transforms, hit-test helpers
  store/
    mapStore.ts                   # zustand: doc + history slice + actions + transactions
    toolStore.ts                  # active tool + connect-source + background-drag state
    viewportStore.ts              # pan x/y, zoom (NOT in history — spec FR-U4)
  components/
    App.tsx                       # edit existing: mount Canvas + overlays + hydration
    Canvas/
      Canvas.tsx                  # root <svg>, viewport transform, event router
      BackgroundLayer.tsx         # <image> in world coords
      EdgesLayer.tsx              # map edges to styled <line>
      ZonesLayer.tsx              # circle + label below (spec §6.4)
      GhostLine.tsx               # connect-tool preview line
      useCanvasInteractions.ts    # pointer/wheel/key routing per active tool
      useHydration.ts             # on mount: load map + image from storage
    Toolbar/Toolbar.tsx           # 5 tool buttons, active highlight, tooltips+shortcut
    Header/Header.tsx             # map name input, Undo/Redo, New/Import/Export
    Inspector/
      Inspector.tsx               # root switch by selection kind
      MapInspector.tsx            # name, attach/clear background
      ZoneInspector.tsx           # label, terrain, owner, tags editor, delete
      EdgeInspector.tsx           # type, endpoint labels, delete
    ConfirmNewMapDialog.tsx       # spec §6.6 confirmation
  hooks/
    useKeyboardShortcuts.ts       # global key handler; respects input focus
    useAutosave.ts                # subscribe to store; debounce ~1s; persist
```

Files to **edit**: [src/App.tsx](src/App.tsx) (replace hello-world with layout), [src/index.css](src/index.css) (only if a global style is needed).

## Domain model ([src/types/map.ts](src/types/map.ts))

```ts
type Terrain = 'plains' | 'forest' | 'city'
type EdgeType = 'primary' | 'secondary' | 'trail'

type Tag = { key: string; value: string }

type Zone = {
  id: string
  label: string
  terrain: Terrain
  owner?: string
  tags: Tag[]
  x: number
  y: number // world coords
}

type Edge = {
  id: string
  type: EdgeType
  a: string
  b: string // zone ids; invariant: a !== b
}

type MapDoc = {
  name: string
  zones: Zone[]
  edges: Edge[]
  background?: { offsetX: number; offsetY: number; width: number; height: number }
  // image blob lives in IndexedDB under a fixed key, not in MapDoc
}

type ExportedMap = { version: 1; map: Omit<MapDoc, 'background'> & { background?: never } }
```

## Store design ([src/store/mapStore.ts](src/store/mapStore.ts))

Zustand store containing `{ doc, selection, past, future }` plus actions. Every document-mutating action:

1. pushes a deep-cloned snapshot of `doc` to `past` (capped, e.g. 100),
2. clears `future`,
3. applies the mutation.

`undo()` / `redo()` swap snapshots between past/present/future. Selection is kept outside history (spec FR-U4).

**Drag transactions (spec FR-U3).** Expose `beginTransaction()` / `commitTransaction()` / `abortTransaction()`. `beginTransaction` snapshots once; intermediate `moveZone` calls during drag skip the snapshot push; `commit` finalizes. Used by Select-tool drag and Background-tool drag.

**Actions**: `createZone(x,y)`, `moveZone(id, x, y)`, `updateZone(id, patch)`, `deleteZone(id)` (also drops incident edges — spec US-08), `createEdge(a,b,type?)` (rejects self-edge and duplicates — spec §6.2), `updateEdge`, `deleteEdge`, `renameMap`, `setBackgroundGeometry`, `clearBackground`, `replaceDoc` (for import / new map), `undo`, `redo`.

Selection actions (no history): `select({kind:'zone'|'edge'|'none', id?})`.

## Canvas & interactions

- **Viewport**: `viewportStore` holds `{ tx, ty, scale }`. SVG root has a `<g transform="translate(tx,ty) scale(scale)">` wrapping all world content. Zoom on wheel uses cursor-anchored math so the world point under the cursor is invariant (spec FR-3).
- **Pan**: Pan tool drag, Space-hold drag, or middle-mouse drag. Temporary Space-pan doesn't switch the active tool in the store — it's a transient override in `useCanvasInteractions`.
- **Add Zone**: click empty canvas → `createZone` at the cursor's world coords with label `Zone ${n}` and Plains terrain; auto-select.
- **Connect**: first click on a zone stores `connectSource` in `toolStore`; `GhostLine` follows pointer; second click on another zone calls `createEdge`; click empty or `Esc` cancels.
- **Background tool**: drag offsets `doc.background.offset{X,Y}` inside a single transaction. No-op if no image.
- **Hit-testing**: SVG handles it natively via `onPointerDown` on `<circle>` / `<line>`. Edges get an invisible wider `<line>` hit target on top for easier clicks.

## Persistence ([src/lib/storage.ts](src/lib/storage.ts))

- **Map JSON**: `localStorage.setItem("mapEditor:doc", JSON.stringify(doc))`, debounced ~1s via `useAutosave`. Load on boot in `useHydration`.
- **Background image**: `idb-keyval.set("mapEditor:bgImage", blob)` when attached; `get` on hydration → `URL.createObjectURL` → store object URL in a ref, revoke on replace/clear. The store only holds geometry, not the blob URL (keeps store serializable and cleanly persistable).
- **Export** ([src/lib/export.ts](src/lib/export.ts)): serialize `{ version: 1, map: docWithoutBackground }` and `download` as `<mapname>.json`. **Import**: `JSON.parse` → schema validation (manual type guards; no zod to keep deps lean) → on success `replaceDoc`; on failure render an error banner and leave current state untouched (spec §6.6, acceptance step 12).

## UI overlays

- **Header** (top-left): map name `<Input>`, Undo/Redo buttons (disabled states from store), New/Import/Export buttons. Wrapped in a floating card with a backdrop so the canvas remains visible underneath (spec §6.1/§8).
- **Toolbar** (top-center): 5 icon buttons (`lucide-react`: `MousePointer2`, `Circle`, `Spline`, `Hand`, `Image`). Active tool styled with a ring; tooltip includes the keyboard shortcut.
- **Inspector** (right): switches on `selection.kind`. Map inspector uses a hidden `<input type="file" accept="image/*">` for attach. Zone inspector's tag editor is a list of `<Input>` rows with add/remove buttons; keys must stay unique within a zone (validated on commit).
- **Confirm New Map**: shadcn `<Dialog>`.

## Undo/redo

- History list of `doc` snapshots. Drag collapses via transactions (FR-U3). Keyboard shortcut hook handles `Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z`.
- Undoable actions: zone create/move/delete/edit, edge create/delete/edit, rename map, attach/clear background (spec FR-U1). Tool switches, selection, pan, and zoom stay outside history.

## Keyboard shortcuts ([src/hooks/useKeyboardShortcuts.ts](src/hooks/useKeyboardShortcuts.ts))

Maps the spec §6.8 table. Critically, all handlers early-return when `document.activeElement` is an `<input>`, `<textarea>`, or `[contenteditable]` so typing a label doesn't switch tools. `Space` activates temporary Pan via a ref read by `useCanvasInteractions` rather than via the store.

## Visual language ([src/constants/terrain.ts](src/constants/terrain.ts), [src/constants/edgeTypes.ts](src/constants/edgeTypes.ts))

- Plains `#b7e4b5`, Forest `#2f6b3a`, City `#7a4b2a`. Zones are circles r=24 with a label `<text>` at `y + r + 14`, centered.
- Edges: Primary `stroke-width=4 solid #222`, Secondary `stroke-width=2.5 solid #666`, Trail `stroke-width=2.5 stroke-dasharray="6 4" #555`.
- Selection highlight: zones get an outer ring (`<circle>` with transparent fill + accent stroke); edges get a thicker accent stroke underneath.

## Execution order

1. **Scaffolding** — install deps, add shadcn components, define types and constants.
2. **Stores & storage** — `mapStore` (with history + transactions), `toolStore`, `viewportStore`, `storage.ts`, `useHydration`, `useAutosave`.
3. **Canvas static render** — `Canvas.tsx`, `BackgroundLayer`, `EdgesLayer`, `ZonesLayer` driven by the store. Verify with seeded data.
4. **Toolbar + tool routing** — `Toolbar.tsx`, `useCanvasInteractions` routing pointer events per active tool. Wire Select, Add Zone, Connect (+ `GhostLine`), Pan, Background.
5. **Header + Inspector** — map name, Undo/Redo, New/Import/Export buttons, Map/Zone/Edge inspectors with live edits, New Map confirm dialog.
6. **Keyboard shortcuts** — `useKeyboardShortcuts` honoring input-focus guard.
7. **Export/Import** — `export.ts` with version field, validation, error banner on bad files.
8. **Polish & acceptance walkthrough** — run spec §9 steps 1–12 manually in the dev server; fix gaps.

## Critical files to create/modify

- New: everything under `src/types/`, `src/constants/`, `src/lib/` (except existing `utils.ts`), `src/store/`, `src/components/Canvas/`, `src/components/Toolbar/`, `src/components/Header/`, `src/components/Inspector/`, `src/hooks/`.
- Edit: [src/App.tsx](src/App.tsx) — replace hello-world with the three overlays + canvas.
- Untouched: [src/lib/utils.ts](src/lib/utils.ts), [src/components/ui/button.tsx](src/components/ui/button.tsx), Vite/TS/Tailwind configs.

## Verification

1. `pnpm run build` — TypeScript passes, bundle builds.
2. `pnpm run dev` and walk through the spec §9 acceptance checklist **in a real browser**:
   - blank canvas + visible toolbar + empty inspector
   - set map name
   - attach a local PNG/JPG as background
   - add ≥10 zones with Add Zone tool
   - connect them using a mix of all 3 edge types
   - rename 3 zones, change terrain on 3, set an owner on 1
   - add ≥1 custom tag to a zone
   - move a zone, Ctrl+Z, Ctrl+Shift+Z
   - delete a zone and confirm incident edges vanish; undo restores both
   - refresh browser → exact state including background restored
   - Export → New Map (confirm) → Import → original graph back, no background
   - Import a deliberately broken `.json` → error banner, current map intact
3. Verify FR-U3: dragging a zone across the canvas and pressing `Ctrl+Z` once returns it to its pre-drag position (not mid-drag).
4. Verify FR-3: wheel-zoom keeps the world point under the cursor stationary.
5. Verify shortcut guard: typing `z` inside the zone label input must not switch tools.
