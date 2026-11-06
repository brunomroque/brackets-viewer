import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Match } from 'brackets-model';
import { partitionBracketForTwoSided, splitRoundMatchesForWings } from './twoSided';

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

describe('twoSided partition', () => {
    it('splits R1 of 16 matches into 8+8', () => {
        const r1 = Array.from({ length: 16 }, (_, i) => fakeMatch(i + 1));
        const { left, right } = splitRoundMatchesForWings(r1);
        assert.equal(left.length, 8);
        assert.equal(right.length, 8);
        assert.equal(left[0].number, 1);
        assert.equal(right[0].number, 9);
    });

    it('puts the single final match in the center', () => {
        const rounds = [
            Array.from({ length: 8 }, (_, i) => fakeMatch(i + 1, i + 1)),
            Array.from({ length: 4 }, (_, i) => fakeMatch(i + 1, 100 + i)),
            Array.from({ length: 2 }, (_, i) => fakeMatch(i + 1, 200 + i)),
            [fakeMatch(1, 300)],
        ];
        const { wingRounds, finalRound } = partitionBracketForTwoSided(rounds);
        assert.equal(wingRounds.length, 3);
        assert.equal(wingRounds[0].left.length, 4);
        assert.equal(wingRounds[0].right.length, 4);
        assert.equal(wingRounds[2].left.length, 1);
        assert.equal(wingRounds[2].right.length, 1);
        assert.ok(finalRound);
        assert.equal(finalRound!.length, 1);
        assert.equal(finalRound![0]!.id, 300);
    });

    it('tolerates null placeholders from completeWithBlankMatches (chave 64 com byes)', () => {
        const r1 = [
            fakeMatch(1),
            null,
            fakeMatch(3),
            null,
            fakeMatch(5),
            fakeMatch(6),
            null,
            fakeMatch(8),
        ];
        const { left, right } = splitRoundMatchesForWings(r1);
        assert.equal(left.length, 4);
        assert.equal(right.length, 4);
        assert.equal(left.filter(Boolean).length + right.filter(Boolean).length, 5);
    });
});
