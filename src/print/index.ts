export * from './geometry';
export * from './paginate';
export * from './filterMatches';
export * from './repechage';

import { Match } from 'brackets-model';
import { a4PortraitGeometry, DEFAULT_ATHLETES_PER_SHEET, PrintGeometry } from './geometry';
import { planEliminationPrintPages, PrintPagePlan } from './paginate';
import { filterBracketRoundsForPage } from './filterMatches';
import { planRepechageForPage, RepechageMatchLike, shouldIncludeRepechage } from './repechage';

export type PrintConfig = {
    page?: 'A4';
    orientation?: 'portrait';
    athletesPerSheet?: number;
    /** Stretch CSS vars so up to 16 slots fill the sheet height. */
    scaleToFill?: boolean;
};

export type PreparedPrintPage = {
    plan: PrintPagePlan;
    geometry: PrintGeometry;
    /** Classic elimination rounds filtered for this sheet (final stub included). */
    matchesByRound: Match[][];
    /** Repechage/bronze rounds for this sheet (empty when not included). */
    repechageByRound: RepechageMatchLike[][];
    includeRepechage: boolean;
    /** Suggested CSS custom properties for scale-to-fill. */
    cssVars: Record<string, string>;
};

/**
 * Plans and prepares print pages for a classic elimination bracket (+ optional repechage).
 *
 * Does not render DOM — callers feed each page into `bracketsViewer.render()` with
 * `layout: 'two-sided'` (or linear) and wrap in `.print-page`.
 */
export function planPrintPages(
    matchesByRound: Match[][],
    options?: {
        athleteCount?: number;
        print?: PrintConfig;
        repechageRounds?: RepechageMatchLike[][];
    },
): PreparedPrintPage[] {
    if (!matchesByRound.length || !matchesByRound[0]?.length)
        return [];

    const athletesPerSheet = options?.print?.athletesPerSheet ?? DEFAULT_ATHLETES_PER_SHEET;
    const geometry = a4PortraitGeometry();
    const firstRoundMatchCount = matchesByRound[0].length;
    const plans = planEliminationPrintPages(
        firstRoundMatchCount,
        options?.athleteCount ?? 0,
        athletesPerSheet,
    );

    const scaleToFill = options?.print?.scaleToFill !== false;
    const slotsOnSheet = Math.min(
        athletesPerSheet,
        firstRoundMatchCount * 2 / Math.max(plans.length, 1) * (plans[0].panel?.bandsPerSide === 1 && plans.length === 2 ? 1 : 1),
    );

    return plans.map((plan) => {
        const filtered = filterBracketRoundsForPage(matchesByRound, plan);
        const includeRepechage = shouldIncludeRepechage(plan);
        const repechageByRound = includeRepechage
            ? planRepechageForPage(plan, options?.repechageRounds ?? [])
            : [];

        const athleteSlots = plan.athleteEnd - plan.athleteStart;
        const cssVars: Record<string, string> = {};
        if (scaleToFill) {
            // Rough vertical budget: useful height minus header/footer chrome (~40mm).
            const usableMm = Math.max(geometry.usefulHeightMm - 40, 80);
            const matchBlockMm = usableMm / Math.max(athleteSlots / 2, 1);
            cssVars['--print-match-block-mm'] = `${matchBlockMm.toFixed(2)}mm`;
            cssVars['--print-athletes-on-sheet'] = String(athleteSlots);
            cssVars['--print-slots-target'] = String(slotsOnSheet);
        }

        return {
            plan,
            geometry,
            matchesByRound: filtered,
            repechageByRound,
            includeRepechage,
            cssVars,
        };
    });
}
