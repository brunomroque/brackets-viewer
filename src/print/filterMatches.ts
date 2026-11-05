import { Match } from 'brackets-model';
import { PosterPanel, PrintPagePlan } from './paginate';

/**
 * Full capacity of matches in a classic elimination round (power-of-two tree).
 */
export function roundMatchCapacity(roundIndex: number, firstRoundMatchCount: number): number {
    return Math.max(1, firstRoundMatchCount / Math.pow(2, roundIndex));
}

/**
 * Whether a match at `orderInRound` (0-based by match.number order) overlaps the poster window.
 * Final round (single match) always overlaps — callers may stub it on the inner edge.
 */
export function matchOverlapsPoster(
    orderInRound: number,
    roundIndex: number,
    firstRoundMatchCount: number,
    panel: PosterPanel,
    isFinalRound: boolean,
): boolean {
    if (isFinalRound) return true;

    const fullCapacity = roundMatchCapacity(roundIndex, firstRoundMatchCount);
    const span = firstRoundMatchCount / fullCapacity;
    const matchStart = orderInRound * span;
    const matchEnd = (orderInRound + 1) * span;

    const sideStart = panel.side === 'left' ? 0 : firstRoundMatchCount / 2;
    const sideLen = firstRoundMatchCount / 2;
    let start = sideStart;
    let end = sideStart + sideLen;
    if (panel.bandsPerSide > 1) {
        const bandLen = sideLen / panel.bandsPerSide;
        start = sideStart + panel.bandIndex * bandLen;
        end = start + bandLen;
    }

    return matchStart < end && matchEnd > start;
}

/**
 * Keep matches whose first-round span overlaps [firstRoundMatchStart, firstRoundMatchEnd).
 * Final round is always included as a stub when `keepFinalStub` is true.
 */
export function filterMatchesByFirstRoundWindow(
    matchesByRound: Match[][],
    firstRoundMatchStart: number,
    firstRoundMatchEnd: number,
    keepFinalStub = true,
): Match[][] {
    if (matchesByRound.length === 0) return [];
    const firstRoundCount = matchesByRound[0].length;

    return matchesByRound.map((roundMatches, roundIndex) => {
        const ordered = roundMatches.slice().sort((a, b) => a.number - b.number);
        const isFinal = roundIndex === matchesByRound.length - 1 && ordered.length === 1;

        if (isFinal)
            return keepFinalStub ? ordered.map((m, i) => ({ ...m, number: i + 1 })) : [];

        const fullCap = ordered.length;
        const span = firstRoundCount / fullCap;

        const filtered = ordered.filter((_, order) => {
            const matchStart = order * span;
            const matchEnd = (order + 1) * span;
            return matchStart < firstRoundMatchEnd && matchEnd > firstRoundMatchStart;
        });

        const localBase = firstRoundMatchStart / span;
        return filtered.map((match) => {
            const global = ordered.indexOf(match);
            const local = Math.max(0, Math.round(global - localBase));
            return { ...match, number: local + 1 };
        });
    });
}

/**
 * Filters an entire bracket for one print page plan.
 */
export function filterBracketRoundsForPage(
    matchesByRound: Match[][],
    plan: PrintPagePlan,
): Match[][] {
    return filterMatchesByFirstRoundWindow(
        matchesByRound,
        plan.firstRoundMatchStart,
        plan.firstRoundMatchEnd,
        true,
    );
}

/**
 * Filters matches of one round for a print page plan (panel-aware).
 */
export function filterRoundMatchesForPage(
    matches: Match[],
    roundIndex: number,
    plan: PrintPagePlan,
    isFinalRound: boolean,
    firstRoundMatchCount: number,
): Match[] {
    const ordered = matches.slice().sort((a, b) => a.number - b.number);

    if (!plan.panel)
        return ordered;

    if (isFinalRound)
        return ordered.map((match, i) => ({ ...match, number: i + 1 }));

    const filtered = ordered.filter((_, order) =>
        matchOverlapsPoster(order, roundIndex, firstRoundMatchCount, plan.panel!, false),
    );

    const fullCap = roundMatchCapacity(roundIndex, firstRoundMatchCount);
    const span = firstRoundMatchCount / fullCap;
    const localBase = plan.firstRoundMatchStart / span;

    return filtered.map((match) => {
        const global = ordered.indexOf(match);
        const local = Math.max(0, Math.round(global - localBase));
        return { ...match, number: local + 1 };
    });
}
