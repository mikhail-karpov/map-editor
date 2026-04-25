import { Slider as SliderPrimitive } from '@base-ui/react/slider';
import { cn } from '@/lib/utils';

type SliderProps = {
  value: number;
  onValueChange: (value: number) => void;
  onValueCommitted?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
};

function Slider({
  value,
  onValueChange,
  onValueCommitted,
  min = 0,
  max = 100,
  step = 1,
  className,
}: SliderProps) {
  return (
    <SliderPrimitive.Root
      value={value}
      onValueChange={(vals) => onValueChange(Array.isArray(vals) ? vals[0] : vals)}
      onValueCommitted={(vals) => onValueCommitted?.(Array.isArray(vals) ? vals[0] : vals)}
      min={min}
      max={max}
      step={step}
      className={cn('w-full', className)}
    >
      <SliderPrimitive.Control className="flex items-center w-full h-5 cursor-pointer touch-none">
        <SliderPrimitive.Track className="relative w-full h-1.5 rounded-full bg-muted">
          <SliderPrimitive.Indicator className="absolute h-full rounded-full bg-primary" />
          <SliderPrimitive.Thumb className="block size-3.5 rounded-full bg-primary border-2 border-background shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50 transition-transform hover:scale-110" />
        </SliderPrimitive.Track>
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };
