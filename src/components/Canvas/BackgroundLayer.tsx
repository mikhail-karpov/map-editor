import type { BackgroundGeometry } from '@/types/map';

type Props = {
  geom: BackgroundGeometry;
  objectUrl: string;
};

export function BackgroundLayer({ geom, objectUrl }: Props) {
  const scale = geom.scale ?? 1;
  return (
    <image
      href={objectUrl}
      x={geom.offsetX}
      y={geom.offsetY}
      width={geom.width * scale}
      height={geom.height * scale}
      preserveAspectRatio="xMidYMid meet"
      style={{ pointerEvents: 'none', opacity: 0.65 }}
    />
  );
}
