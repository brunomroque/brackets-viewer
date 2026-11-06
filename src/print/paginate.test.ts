import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    bracketAthleteCapacity,
    eliminationPrintSliceCount,
    planEliminationPrintPages,
    posterPanelForSlice,
    eliminationRepechageHalf,
} from './paginate';

describe('eliminationPrintSliceCount', () => {
    it('maps capacity to sheet count', () => {
        assert.equal(eliminationPrintSliceCount(16), 1);
        assert.equal(eliminationPrintSliceCount(32), 2);
        assert.equal(eliminationPrintSliceCount(64), 4);
        assert.equal(eliminationPrintSliceCount(128), 8);
        assert.equal(eliminationPrintSliceCount(256), 16);
    });
});

describe('planEliminationPrintPages', () => {
    it('returns a single page for 16 athletes (8 R1 matches)', () => {
        const pages = planEliminationPrintPages(8);
        assert.equal(pages.length, 1);
        assert.equal(pages[0].panel, null);
        assert.equal(pages[0].athleteEnd - pages[0].athleteStart, 16);
    });

    it('splits 32 into left/right with repechage on both', () => {
        const pages = planEliminationPrintPages(16);
        assert.equal(pages.length, 2);
        assert.equal(pages[0].panel?.side, 'left');
        assert.equal(pages[1].panel?.side, 'right');
        assert.equal(pages[0].panel?.includeRepechage, true);
        assert.equal(pages[1].panel?.includeRepechage, true);
        assert.equal(eliminationRepechageHalf(0, 2), 0);
        assert.equal(eliminationRepechageHalf(1, 2), 1);
    });

    it('splits 64 into 4 sheets; repechage only on bottom bands', () => {
        const pages = planEliminationPrintPages(32);
        assert.equal(pages.length, 4);
        assert.equal(pages[0].panel?.band, 'top');
        assert.equal(pages[0].panel?.includeRepechage, false);
        assert.equal(pages[2].panel?.band, 'bottom');
        assert.equal(pages[2].panel?.includeRepechage, true);
        assert.equal(pages[3].panel?.includeRepechage, true);
        assert.equal(pages[2].repechageHalf, 0);
        assert.equal(pages[3].repechageHalf, 1);
    });

    it('splits 128 into 8 sheets', () => {
        assert.equal(planEliminationPrintPages(64).length, 8);
        assert.equal(bracketAthleteCapacity(64), 128);
        const panel = posterPanelForSlice(7, 8);
        assert.equal(panel?.side, 'right');
        assert.equal(panel?.includeRepechage, true);
    });

    it('splits 256 into 16 sheets at 16 athletes each', () => {
        const pages = planEliminationPrintPages(128);
        assert.equal(pages.length, 16);
        assert.equal(bracketAthleteCapacity(128), 256);
        assert.ok(pages.every((page) => page.athleteEnd - page.athleteStart === 16));
        assert.equal(pages[0].panel?.side, 'left');
        assert.equal(pages[0].panel?.bandsPerSide, 8);
        assert.equal(pages[0].panel?.includeRepechage, false);
        assert.equal(pages[14].panel?.includeRepechage, true);
        assert.equal(pages[15].panel?.side, 'right');
        assert.equal(pages[15].panel?.includeRepechage, true);
    });
});
