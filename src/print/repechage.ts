import { Match } from 'brackets-model';
import { PosterPanel, PrintPagePlan } from './paginate';

/**
 * IJF-style repechage half assignment.
 * Left sheets → half 0 (A/B), right sheets → half 1 (C/D).
 */
export function repechageHalfForPanel(panel: PosterPanel | null): 0 | 1 {
    if (!panel) return 0;
    return panel.side === 'left' ? 0 : 1;
}

/**
 * Whether this print page should include the repechage/bronze strip.
 * Only bottom bands of each side (or both sheets when sliceCount === 2).
 */
export function shouldIncludeRepechage(plan: PrintPagePlan): boolean {
    if (!plan.panel) return true;
    return plan.panel.includeRepechage;
}

export type RepechageMatchLike = Pick<Match, 'id' | 'number' | 'group_id' | 'round_id'> & {
    /** Optional stage/group tag used by Tatame-style payloads. */
    metadata?: { kind?: 'REPESCAGEM' | 'BRONZE' | string; step?: number };
};

/**
 * Filters repechage/bronze matches for one IJF half.
 *
 * Convention (aligned with TatameArena cartaz):
 * - Bronze / final repechage step: keep match whose slot index === half (0 or 1).
 * - Earlier repechage chain steps: keep slots [half*2, half*2+1].
 *
 * @param matches Ordered matches in one repechage round/column.
 * @param half 0 = A/B (left), 1 = C/D (right).
 * @param isFinalStep Whether this is the last repechage step or bronze.
 */
export function filterRepechageRoundByHalf(
    matches: RepechageMatchLike[],
    half: 0 | 1,
    isFinalStep: boolean,
): RepechageMatchLike[] {
    const ordered = matches.slice().sort((a, b) => a.number - b.number);

    if (isFinalStep) {
        return ordered
            .filter((_, order) => order === half)
            .map((match, i) => ({ ...match, number: i + 1 }));
    }

    const lo = half * 2;
    const hi = lo + 1;
    return ordered
        .filter((_, order) => order >= lo && order <= hi)
        .map((match, i) => ({ ...match, number: i + 1 }));
}

/**
 * Plans which repechage content belongs on a print page.
 */
export function planRepechageForPage(
    plan: PrintPagePlan,
    repechageRounds: RepechageMatchLike[][],
): RepechageMatchLike[][] {
    if (!shouldIncludeRepechage(plan))
        return [];

    const half = plan.repechageHalf;
    if (repechageRounds.length === 0)
        return [];

    return repechageRounds.map((round, index) => {
        const isFinalStep = index === repechageRounds.length - 1;
        return filterRepechageRoundByHalf(round, half, isFinalStep);
    });
}
