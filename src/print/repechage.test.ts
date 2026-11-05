import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { filterRepechageRoundByHalf, planRepechageForPage, shouldIncludeRepechage } from './repechage';
import { planEliminationPrintPages } from './paginate';

describe('repechage half filter', () => {
    it('keeps bronze slot by half', () => {
        const bronze = [
            { id: 1, number: 1, group_id: 9, round_id: 1 },
            { id: 2, number: 2, group_id: 9, round_id: 1 },
        ];
        const left = filterRepechageRoundByHalf(bronze, 0, true);
        const right = filterRepechageRoundByHalf(bronze, 1, true);
        assert.equal(left.length, 1);
        assert.equal(left[0].id, 1);
        assert.equal(right[0].id, 2);
    });

    it('keeps chain slots [half*2, half*2+1]', () => {
        const chain = [1, 2, 3, 4].map((n) => ({ id: n, number: n, group_id: 8, round_id: 1 }));
        const left = filterRepechageRoundByHalf(chain, 0, false);
        const right = filterRepechageRoundByHalf(chain, 1, false);
        assert.deepEqual(left.map((m) => m.id), [1, 2]);
        assert.deepEqual(right.map((m) => m.id), [3, 4]);
    });

    it('omits repechage on top bands of 64-athlete poster', () => {
        const pages = planEliminationPrintPages(32);
        assert.equal(shouldIncludeRepechage(pages[0]), false);
        assert.equal(shouldIncludeRepechage(pages[2]), true);
        const planned = planRepechageForPage(pages[2], [
            [1, 2, 3, 4].map((n) => ({ id: n, number: n, group_id: 8, round_id: 1 })),
            [{ id: 10, number: 1, group_id: 9, round_id: 2 }, { id: 11, number: 2, group_id: 9, round_id: 2 }],
        ]);
        assert.equal(planned.length, 2);
        assert.deepEqual(planned[0].map((m) => m.id), [1, 2]);
        assert.deepEqual(planned[1].map((m) => m.id), [10]);
    });
});
