export function vibrate(pattern = 18) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch (e) {}
}

export function tapFeedback(audioManager, sound = 'click') {
  try { audioManager?.playSound(sound, sound === 'success' ? 660 : 520, sound === 'success' ? 0.22 : 0.08); } catch (e) {}
  vibrate(sound === 'success' ? [18, 30, 28] : 12);
}
