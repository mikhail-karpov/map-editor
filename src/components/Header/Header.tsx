import { useRef, useState } from 'react';
import { Undo2, Redo2, FilePlus, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useMapStore, useDoc, useCanUndo, useCanRedo } from '@/store/mapStore';
import { exportMap, parseImport } from '@/lib/export';
import { clearBgImage } from '@/lib/storage';
import { cn } from '@/lib/utils';

type Props = {
  onBgCleared: () => void;
};

export function Header({ onBgCleared }: Props) {
  const doc = useDoc();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const { undo, redo, renameMap, replaceDoc, newMap, clearBackground } = useMapStore();

  const [showNewDialog, setShowNewDialog] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  function handleRename(val: string) {
    if (val !== doc.name) renameMap(val);
  }

  function handleExport() {
    exportMap(doc);
  }

  function handleImportClick() {
    setImportError(null);
    importFileRef.current?.click();
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = () => {
      const result = parseImport(reader.result as string);
      if (!result.ok) {
        setImportError(result.error);
        return;
      }
      // Always clear the active background blob before loading the imported doc
      clearBgImage();
      onBgCleared();
      replaceDoc(result.doc);
      setImportError(null);
    };
    reader.readAsText(file);
  }

  function handleNewConfirm() {
    newMap();
    clearBackground();
    clearBgImage();
    onBgCleared();
    setShowNewDialog(false);
  }

  return (
    <>
      <div
        className={cn(
          'fixed top-3 left-3 z-20',
          'flex flex-col gap-1.5 rounded-xl border border-border bg-background/90 backdrop-blur px-3 py-2 shadow-md min-w-[180px]'
        )}
      >
        {/* Map name */}
        <Input
          value={doc.name}
          onChange={(e) => renameMap(e.target.value)}
          onBlur={(e) => handleRename(e.target.value)}
          className="h-7 text-sm font-medium border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          aria-label="Map name"
        />

        {/* Undo / Redo */}
        <div className="flex gap-1">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={undo}
                  disabled={!canUndo}
                  aria-label="Undo"
                />
              }
            >
              <Undo2 size={14} />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Undo <kbd className="ml-1 opacity-60">⌘Z</kbd>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={redo}
                  disabled={!canRedo}
                  aria-label="Redo"
                />
              }
            >
              <Redo2 size={14} />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Redo <kbd className="ml-1 opacity-60">⌘⇧Z</kbd>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* New / Import / Export */}
        <div className="flex gap-1">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setShowNewDialog(true)}
                  aria-label="New map"
                />
              }
            >
              <FilePlus size={14} />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              New map
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={handleImportClick}
                  aria-label="Import map"
                />
              }
            >
              <Upload size={14} />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Import
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={handleExport}
                  aria-label="Export map"
                />
              }
            >
              <Download size={14} />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Export
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Import error */}
        {importError && (
          <Alert variant="destructive" className="py-1 px-2 text-xs">
            <AlertDescription>{importError}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Hidden file inputs */}
      <input
        ref={importFileRef}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={handleImportFile}
      />

      {/* New Map confirmation dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start a new map?</DialogTitle>
            <DialogDescription>
              Your current map will be cleared. Export first if you want to keep it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleNewConfirm}>
              Clear and start new
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
