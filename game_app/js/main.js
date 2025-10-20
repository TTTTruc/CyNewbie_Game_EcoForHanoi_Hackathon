import { initGame } from './game.js';
import { storage } from './utils.js';

const params = new URLSearchParams(window.location.search);
const shouldContinue = params.get('continue') === '1';

initGame({ continueRun: shouldContinue, muted: storage.getMute() });

