import { InMemoryDatabase } from 'brackets-memory-db';
import { BracketsManager } from 'brackets-manager';
import { BracketsViewer } from './main';
import { planPrintPages, planEliminationPrintPages } from './print';

window.bracketsViewer = new BracketsViewer();
window.inMemoryDatabase = new InMemoryDatabase();
window.bracketsManager = new BracketsManager(window.inMemoryDatabase);
(window as Window & { planPrintPages: typeof planPrintPages }).planPrintPages = planPrintPages;
(window as Window & { planEliminationPrintPages: typeof planEliminationPrintPages }).planEliminationPrintPages = planEliminationPrintPages;

export { BracketsViewer };
export * from './types';
export * from './twoSided';
export * from './print';
