export type StatusColorOption = {
  backgroundColor: string;
  textColor: string;
  paletteDotColor: string;
};

export const STATUS_COLOR_PALETTE: StatusColorOption[] = [
  { backgroundColor: "#D6FAE8", textColor: "#00B55B", paletteDotColor: "#00E272" },
  { backgroundColor: "#B1EACE", textColor: "#004824", paletteDotColor: "#00B55B" },
  { backgroundColor: "#D3E1FE", textColor: "#4D82F3", paletteDotColor: "#7EA5F8" },
  { backgroundColor: "#A6C3FF", textColor: "#0037B3", paletteDotColor: "#2563EB" },
  { backgroundColor: "#DCEBD9", textColor: "#4D843F", paletteDotColor: "#78B16A" },
  { backgroundColor: "#C4E9E7", textColor: "#1B5B54", paletteDotColor: "#56ACA3" },
  { backgroundColor: "#C7E9FF", textColor: "#4AA4E0", paletteDotColor: "#4AA4E0" },
  { backgroundColor: "#D6C5EA", textColor: "#5F358E", paletteDotColor: "#8665AC" },
  { backgroundColor: "#FFE6CD", textColor: "#DE8D3B", paletteDotColor: "#DE8D3B" },
  { backgroundColor: "#ECD4B4", textColor: "#94611A", paletteDotColor: "#B87F30" },
  { backgroundColor: "#FEC3E7", textColor: "#BA1445", paletteDotColor: "#CD466E" },
  { backgroundColor: "#EAC0D4", textColor: "#830140", paletteDotColor: "#981E59" },
  { backgroundColor: "#FFF5D5", textColor: "#976400", paletteDotColor: "#EFB008" },
  { backgroundColor: "#FFC5C5", textColor: "#B01212", paletteDotColor: "#D83232" },
  { backgroundColor: "#FFEBEB", textColor: "#D83232", paletteDotColor: "#FC9595" },
  { backgroundColor: "#E2E2E2", textColor: "#595959", paletteDotColor: "#777777" },
];

export const DEFAULT_STATUS_COLOR = STATUS_COLOR_PALETTE[0].backgroundColor;

export function normalizeHexColor(color?: string | null): string | null {
  if (!color) return null;

  const normalized = color.trim().toUpperCase();
  if (!normalized) return null;

  const prefixed = normalized.startsWith("#") ? normalized : `#${normalized}`;
  if (!/^#[0-9A-F]{6}$/.test(prefixed)) return null;

  return prefixed;
}

function parseRgbChannel(hexColor: string, start: number): number {
  return Number.parseInt(hexColor.slice(start, start + 2), 16);
}

function getRelativeLuminance(channel: number): number {
  const normalized = channel / 255;
  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function getContrastingTextColor(backgroundColor: string): string {
  const red = parseRgbChannel(backgroundColor, 1);
  const green = parseRgbChannel(backgroundColor, 3);
  const blue = parseRgbChannel(backgroundColor, 5);

  const luminance =
    0.2126 * getRelativeLuminance(red) +
    0.7152 * getRelativeLuminance(green) +
    0.0722 * getRelativeLuminance(blue);

  return luminance > 0.6 ? "#252525" : "#FFFFFF";
}

export function getStatusColorTone(backgroundColor?: string | null): StatusColorOption {
  const normalizedColor = normalizeHexColor(backgroundColor) ?? DEFAULT_STATUS_COLOR;
  const paletteColor = STATUS_COLOR_PALETTE.find(
    (option) => option.backgroundColor === normalizedColor
  );

  if (paletteColor) {
    return paletteColor;
  }

  return {
    backgroundColor: normalizedColor,
    textColor: getContrastingTextColor(normalizedColor),
    paletteDotColor: getContrastingTextColor(normalizedColor),
  };
}

export function getStatusPaletteDotColor(backgroundColor?: string | null): string {
  return getStatusColorTone(backgroundColor).paletteDotColor;
}
