import { storage } from './utils.js';

const playBtn = document.getElementById('playBtn');
const continueBtn = document.getElementById('continueBtn');
const aboutBtn = document.getElementById('aboutBtn');
const muteToggle = document.getElementById('muteToggle');

function updateContinue() {
  const s = storage.load();
  const canContinue = !!(s && !s.finalized);
  continueBtn.hidden = !canContinue;
}

function updateMuteButton() {
  const muted = storage.getMute();
  muteToggle.setAttribute('aria-pressed', String(!!muted));
  muteToggle.textContent = muted ? '🔇 Audio Off' : '🔊 Audio On';
}

playBtn?.addEventListener('click', () => {
  try { storage.clear(); } catch {}
  window.location.href = 'game.html';
});

continueBtn?.addEventListener('click', () => {
  window.location.href = 'game.html?continue=1';
});

aboutBtn?.addEventListener('click', () => {
  window.location.href = 'about.html';
});

muteToggle?.addEventListener('click', () => {
  const muted = !storage.getMute();
  storage.setMute(muted);
  updateMuteButton();
});

updateContinue();
updateMuteButton();

