import type { BackgroundGeometry } from '@/types/map';

type Props = {
  geom: BackgroundGeometry;
  objectUrl: string;
};

export function BackgroundLayer({ geom, objectUrl }: Props) {
  return (
    <image
      href={objectUrl}
      x={geom.offsetX}
      y={geom.offsetY}
      width={geom.width}
      height={geom.height}
      preserveAspectRatio="xMidYMid meet"
      style={{ pointerEvents: 'none', opacity: 0.65 }}
    />
  );
}
