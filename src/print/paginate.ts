import { DEFAULT_ATHLETES_PER_SHEET } from './geometry';

export type EliminationPrintSliceCount = 1 | 2 | 4 | 8;

export type PosterSide = 'left' | 'right';

/** Vertical band within one side of the poster. */
export type PosterBand = 'full' | 'top' | 'bottom' | `band${0 | 1 | 2 | 3}`;

export type PosterPanel = {
    side: PosterSide;
    band: PosterBand;
    bandIndex: number;
    bandsPerSide: number;
    /** Include repechage/bronze strip on this sheet. */
    includeRepechage: boolean;
};

export type PrintPagePlan = {
    sliceIndex: number;
    sliceCount: EliminationPrintSliceCount;
    panel: PosterPanel | null;
    sheetLabel: string | null;
    repechageHalf: 0 | 1;
    /** Inclusive start slot index in first-round athlete order (0-based). */
    athleteStart: number;
    /** Exclusive end slot index. */
    athleteEnd: number;
    /** First-round match index window [start, end). */
    firstRoundMatchStart: number;
    firstRoundMatchEnd: number;
};

function nextPowerOfTwo(value: number): number {
    let size = 2;
    while (size < value) size *= 2;
    return size;
}

/** Bracket capacity (power of 2 with byes) from first-round match count. */
export function bracketAthleteCapacity(firstRoundMatchCount: number, athleteCount = 0): number {
    const byMatches = Math.max(2, firstRoundMatchCount * 2);
    const rosterPow2 = athleteCount > 0 ? nextPowerOfTwo(athleteCount) : 0;
    return Math.max(byMatches, rosterPow2, 2);
}

/** How many A4 sheets an elimination bracket needs (16 athletes per sheet). */
export function eliminationPrintSliceCount(
    bracketAthleteCapacityValue: number,
    athletesPerSheet = DEFAULT_ATHLETES_PER_SHEET,
): EliminationPrintSliceCount {
    if (bracketAthleteCapacityValue <= athletesPerSheet) return 1;
    if (bracketAthleteCapacityValue <= athletesPerSheet * 2) return 2;
    if (bracketAthleteCapacityValue <= athletesPerSheet * 4) return 4;
    return 8;
}

function bandsPerSideForSliceCount(sliceCount: EliminationPrintSliceCount): number {
    switch (sliceCount) {
        case 1:
            return 1;
        case 2:
            return 1;
        case 4:
            return 2;
        case 8:
            return 4;
        default: {
            const _exhaustive: never = sliceCount;
            return _exhaustive;
        }
    }
}

function bandLabel(bandIndex: number, bandsPerSide: number): PosterBand {
    if (bandsPerSide <= 1) return 'full';
    if (bandsPerSide === 2) return bandIndex === 0 ? 'top' : 'bottom';
    return `band${bandIndex as 0 | 1 | 2 | 3}`;
}

/** Poster geometry for a given sheet index. */
export function posterPanelForSlice(
    sliceIndex: number,
    sliceCount: EliminationPrintSliceCount,
): PosterPanel | null {
    if (sliceCount <= 1) return null;
    const bandsPerSide = bandsPerSideForSliceCount(sliceCount);
    const side: PosterSide = sliceIndex % 2 === 0 ? 'left' : 'right';
    const bandIndex = Math.floor(sliceIndex / 2);
    const band = bandLabel(bandIndex, bandsPerSide);
    // Repechage only on the bottom band of each side (on 2 sheets: both).
    const includeRepechage = bandIndex === bandsPerSide - 1;
    return { side, band, bandIndex, bandsPerSide, includeRepechage };
}

function sideWord(side: PosterSide): string {
    return side === 'left' ? 'Esquerda' : 'Direita';
}

function bandWord(band: PosterBand): string {
    switch (band) {
        case 'full':
            return '';
        case 'top':
            return ' superior';
        case 'bottom':
            return ' inferior';
        case 'band0':
            return ' faixa 1';
        case 'band1':
            return ' faixa 2';
        case 'band2':
            return ' faixa 3';
        case 'band3':
            return ' faixa 4';
        default: {
            const _exhaustive: never = band;
            return _exhaustive;
        }
    }
}

export function eliminationSheetLabel(
    sliceIndex: number,
    sliceCount: EliminationPrintSliceCount,
): string | null {
    const panel = posterPanelForSlice(sliceIndex, sliceCount);
    if (!panel) return null;
    return `Folha ${sliceIndex + 1}/${sliceCount} · ${sideWord(panel.side)}${bandWord(panel.band)}`;
}

/** IJF repechage half: 0 = A/B (left), 1 = C/D (right). */
export function eliminationRepechageHalf(
    sliceIndex: number,
    sliceCount: EliminationPrintSliceCount,
): 0 | 1 {
    const panel = posterPanelForSlice(sliceIndex, sliceCount);
    if (!panel) return 0;
    return panel.side === 'left' ? 0 : 1;
}

function posterWindow(
    firstRoundMatches: number,
    panel: PosterPanel,
): { start: number; end: number } {
    const sideStart = panel.side === 'left' ? 0 : firstRoundMatches / 2;
    const sideLen = firstRoundMatches / 2;
    if (panel.bandsPerSide <= 1)
        return { start: sideStart, end: sideStart + sideLen };

    const bandLen = sideLen / panel.bandsPerSide;
    const start = sideStart + panel.bandIndex * bandLen;
    return { start, end: start + bandLen };
}

/**
 * Builds the full print page plan for an elimination bracket.
 *
 * @param firstRoundMatchCount Number of matches in round 1 (capacity/2).
 * @param athleteCount Optional roster size for capacity rounding.
 * @param athletesPerSheet Max athletes drawn on one A4 sheet (default 16).
 */
export function planEliminationPrintPages(
    firstRoundMatchCount: number,
    athleteCount = 0,
    athletesPerSheet = DEFAULT_ATHLETES_PER_SHEET,
): PrintPagePlan[] {
    const capacity = bracketAthleteCapacity(firstRoundMatchCount, athleteCount);
    const sliceCount = eliminationPrintSliceCount(capacity, athletesPerSheet);
    const firstMatches = Math.max(1, capacity / 2);

    if (sliceCount === 1) {
        return [{
            sliceIndex: 0,
            sliceCount,
            panel: null,
            sheetLabel: null,
            repechageHalf: 0,
            athleteStart: 0,
            athleteEnd: capacity,
            firstRoundMatchStart: 0,
            firstRoundMatchEnd: firstMatches,
        }];
    }

    return Array.from({ length: sliceCount }, (_, sliceIndex) => {
        const panel = posterPanelForSlice(sliceIndex, sliceCount)!;
        const { start, end } = posterWindow(firstMatches, panel);
        return {
            sliceIndex,
            sliceCount,
            panel,
            sheetLabel: eliminationSheetLabel(sliceIndex, sliceCount),
            repechageHalf: eliminationRepechageHalf(sliceIndex, sliceCount),
            athleteStart: start * 2,
            athleteEnd: end * 2,
            firstRoundMatchStart: start,
            firstRoundMatchEnd: end,
        };
    });
}
