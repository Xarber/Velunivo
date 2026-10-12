export function centerSquare(width: number, height: number) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) throw new Error('Could not read image dimensions.');
  const size = Math.floor(Math.min(width, height));
  return { originX: Math.floor((width - size) / 2), originY: Math.floor((height - size) / 2), width: size, height: size };
}
