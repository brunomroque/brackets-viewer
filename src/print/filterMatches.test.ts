import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Match } from 'brackets-model';
import { filterMatchesByFirstRoundWindow } from './filterMatches';
import { planEliminationPrintPages } from './paginate';

function fakeMatch(number: number, id = number): Match {
    return {
        id,
        number,
        stage_id: 0,
        group_id: 0,
        round_id: 0,
        status: 0,
        child_count: 0,
        opponent1: { id: null },
        opponent2: { id: null },
    };
}

function buildSe32(): Match[][] {
    return [
        Array.from({ length: 16 }, (_, i) => fakeMatch(i + 1, i + 1)),
        Array.from({ length: 8 }, (_, i) => fakeMatch(i + 1, 100 + i)),
        Array.from({ length: 4 }, (_, i) => fakeMatch(i + 1, 200 + i)),
        Array.from({ length: 2 }, (_, i) => fakeMatch(i + 1, 300 + i)),
        [fakeMatch(1, 400)],
    ];
}

describe('filterMatchesByFirstRoundWindow', () => {
    it('keeps left half of 32 and a final stub', () => {
        const plan = planEliminationPrintPages(16)[0];
        const filtered = filterMatchesByFirstRoundWindow(
            buildSe32(),
            plan.firstRoundMatchStart,
            plan.firstRoundMatchEnd,
            true,
        );
        assert.equal(filtered[0].length, 8);
        assert.equal(filtered[filtered.length - 1].length, 1);
        assert.equal(filtered[filtered.length - 1][0].id, 400);
    });

    it('keeps right half with local reindex starting at 1', () => {
        const plan = planEliminationPrintPages(16)[1];
        const filtered = filterMatchesByFirstRoundWindow(
            buildSe32(),
            plan.firstRoundMatchStart,
            plan.firstRoundMatchEnd,
            true,
        );
        assert.equal(filtered[0].length, 8);
        assert.equal(filtered[0][0].number, 1);
        assert.equal(filtered[0][0].id, 9);
    });
});
