import { Match } from 'brackets-model';

export type WingSide = 'left' | 'right';

export type RoundWingSplit<T extends Match> = {
    left: T[];
    right: T[];
};

/**
 * Splits a round's matches into left/right wings by match.number order.
 * First half → left, second half → right.
 */
export function splitRoundMatchesForWings<T extends Match>(matches: T[]): RoundWingSplit<T> {
    const ordered = matches.slice().sort((a, b) => a.number - b.number);
    const mid = Math.floor(ordered.length / 2);
    return {
        left: ordered.slice(0, mid),
        right: ordered.slice(mid),
    };
}

/**
 * Whether a round is the final round of a single/winner bracket (one match).
 */
export function isFinalRoundMatches(matches: Match[]): boolean {
    return matches.length === 1;
}

/**
 * Partitions all rounds of a bracket for two-sided layout.
 * Every round except the last is split into left/right; the last round is the center final.
 */
export function partitionBracketForTwoSided<T extends Match>(matchesByRound: T[][]): {
    wingRounds: RoundWingSplit<T>[];
    finalRound: T[] | null;
} {
    if (matchesByRound.length === 0)
        return { wingRounds: [], finalRound: null };

    if (matchesByRound.length === 1) {
        // Single match stage: only the final column.
        return { wingRounds: [], finalRound: matchesByRound[0] };
    }

    const wingRounds: RoundWingSplit<T>[] = [];
    for (let i = 0; i < matchesByRound.length - 1; i++)
        wingRounds.push(splitRoundMatchesForWings(matchesByRound[i]));

    return {
        wingRounds,
        finalRound: matchesByRound[matchesByRound.length - 1],
    };
}

/**
 * First-round athlete capacity from match count (byes included as slots).
 */
export function firstRoundAthleteCapacity(firstRoundMatchCount: number): number {
    return Math.max(2, firstRoundMatchCount * 2);
}
