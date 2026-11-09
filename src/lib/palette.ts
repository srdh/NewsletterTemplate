/**
 * The Microsoft colour palette, offered in every colour field and in the
 * text editor's colour menus.
 */
export interface PaletteColor {
  name: string
  hex: string
}

export const MS_PRIMARY: PaletteColor[] = [
  { name: 'Dark Teal', hex: '#225B62' },
  { name: 'Teal', hex: '#49C5B1' },
  { name: 'Light Teal', hex: '#B9DCD2' },
  { name: 'Warm White', hex: '#FFF8F3' },
  { name: 'Pure Black', hex: '#000000' },
]

/** In palette order: each row is light then strong, per hue. */
export const MS_SECONDARY: PaletteColor[] = [
  { name: 'Light Blue', hex: '#8DC8E8' },
  { name: 'Blue', hex: '#0078D4' },
  { name: 'Light Green', hex: '#D4EC8E' },
  { name: 'Green', hex: '#8DE971' },
  { name: 'Light Purple', hex: '#C5B4E3' },
  { name: 'Purple', hex: '#8661C5' },
  { name: 'Light Violet', hex: '#D59ED7' },
  { name: 'Violet', hex: '#C03BC4' },
  { name: 'Light Yellow', hex: '#FFE399' },
  { name: 'Yellow', hex: '#FFB900' },
  { name: 'Light Red', hex: '#FFB3BB' },
  { name: 'Red', hex: '#F4364C' },
]

export const MS_PALETTE: PaletteColor[] = [...MS_PRIMARY, ...MS_SECONDARY]

/** The palette name of a colour, if it is one. */
export function paletteName(hex: string): string | undefined {
  return MS_PALETTE.find((color) => color.hex === hex.toUpperCase())?.name
}
