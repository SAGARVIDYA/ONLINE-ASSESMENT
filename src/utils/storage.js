const ACTIVE_KEY = 'numerical_aptitude_active';
const HISTORY_KEY = 'numerical_aptitude_history';

export function saveActiveAttempt(data) {
  try {
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save to localStorage', err);
  }
}

export function getActiveAttempt() {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('Failed to parse active attempt', err);
    return null;
  }
}

export function clearActiveAttempt() {
  try {
    localStorage.removeItem(ACTIVE_KEY);
  } catch (err) {
    console.error('Failed to clear active attempt', err);
  }
}

export function saveAttemptToHistory(attempt) {
  try {
    const history = getAttemptHistory();
    // Prepend new attempt
    const updated = [attempt, ...history.filter(item => item.id !== attempt.id)];
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save history to localStorage', err);
  }
}

export function getAttemptHistory(rollNumber = null) {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const list = raw ? JSON.parse(raw) : [];
    if (rollNumber) {
      return list.filter(item => item.rollNumber && item.rollNumber.toUpperCase() === rollNumber.toUpperCase());
    }
    return list;
  } catch (err) {
    console.error('Failed to read history from localStorage', err);
    return [];
  }
}

export function formatTime(seconds) {
  if (seconds == null || isNaN(seconds) || seconds < 0) return '00:00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return [
    hrs.toString().padStart(2, '0'),
    mins.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0'),
  ].join(':');
}

export function formatDate(isoString) {
  if (!isoString) return 'N/A';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return isoString;
  }
}
