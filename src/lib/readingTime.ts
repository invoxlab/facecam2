export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0).length;
}

export function estimateReadingTime(text: string, wpm: number = 150): string {
  const words = countWords(text);
  if (words === 0) return '';
  const totalSeconds = Math.round((words / wpm) * 60);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `≈ ${seconds} s`;
  if (seconds === 0) return `≈ ${minutes} min`;
  return `≈ ${minutes} min ${seconds} s`;
}

export function formatRelativeDate(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  if (hours < 24) return `il y a ${hours} h`;
  if (days === 1) return 'hier';
  if (days < 7) return `il y a ${days} jours`;
  return new Date(timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
