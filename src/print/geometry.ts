/** A4 portrait physical size (ISO 216). */
export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;

/** Useful printable height after typical browser chrome/margins (TatameArena convention). */
export const A4_USEFUL_HEIGHT_MM = 268;

/** CSS px at 96 DPI. */
export const MM_TO_PX = 96 / 25.4;

/** LayoutNG epsilon buffer to avoid blank ghost pages. */
export const PAGE_HEIGHT_EPSILON_PX = 0.5;

export type PrintPageSize = 'A4';
export type PrintOrientation = 'portrait' | 'landscape';

export type PrintGeometry = {
    page: PrintPageSize;
    orientation: PrintOrientation;
    widthMm: number;
    heightMm: number;
    usefulHeightMm: number;
    usefulHeightPx: number;
    pageCss: string;
};

/**
 * Canonical A4 portrait geometry for print sheets.
 */
export function a4PortraitGeometry(usefulHeightMm = A4_USEFUL_HEIGHT_MM): PrintGeometry {
    return {
        page: 'A4',
        orientation: 'portrait',
        widthMm: A4_WIDTH_MM,
        heightMm: A4_HEIGHT_MM,
        usefulHeightMm,
        usefulHeightPx: usefulHeightMm * MM_TO_PX - PAGE_HEIGHT_EPSILON_PX,
        // Blink does not support CSS variables inside @page — use literals.
        pageCss: `@page { size: ${A4_WIDTH_MM}mm ${A4_HEIGHT_MM}mm; margin: 8mm; }`,
    };
}

/**
 * Target slots (athletes) that should fill one A4 sheet.
 */
export const DEFAULT_ATHLETES_PER_SHEET = 16;
