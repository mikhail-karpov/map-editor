import { MousePointer2, CircleDot, Spline, Hand, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToolStore, useActiveTool, type Tool } from '@/store/toolStore';
import { cn } from '@/lib/utils';

type ToolDef = {
  id: Tool;
  label: string;
  shortcut: string;
  Icon: React.ComponentType<{ size?: number }>;
};

const TOOLS: ToolDef[] = [
  { id: 'select', label: 'Select', shortcut: 'V', Icon: MousePointer2 },
  { id: 'addZone', label: 'Add Zone', shortcut: 'Z', Icon: CircleDot },
  { id: 'connect', label: 'Connect', shortcut: 'C', Icon: Spline },
  { id: 'pan', label: 'Pan', shortcut: 'H', Icon: Hand },
  { id: 'background', label: 'Background', shortcut: 'B', Icon: Image },
];

export function Toolbar() {
  const activeTool = useActiveTool();
  const setTool = useToolStore((s) => s.setTool);

  return (
    <div
      className={cn(
        'fixed top-3 left-1/2 -translate-x-1/2 z-20',
        'flex items-center gap-1 rounded-xl border border-border bg-background/90 backdrop-blur px-2 py-1.5 shadow-md'
      )}
    >
      {TOOLS.map(({ id, label, shortcut, Icon }) => (
        <Tooltip key={id}>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-8 w-8 p-0 rounded-lg',
                  activeTool === id && 'bg-primary text-primary-foreground hover:bg-primary/90'
                )}
                onClick={() => setTool(id)}
                aria-label={label}
                aria-pressed={activeTool === id}
              />
            }
          >
            <Icon size={16} />
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {label} <kbd className="ml-1 opacity-60">{shortcut}</kbd>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
