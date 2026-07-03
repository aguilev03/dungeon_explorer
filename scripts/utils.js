export function rollDice(count) {
  return Array.from({ length: count }, () => Math.ceil(Math.random() * 6));
}

export function countSuccesses(rolls) {
  return rolls.filter((roll) => roll >= 5).length;
}

export function getOutcome(successes) {
  if (successes >= 2) return "Strong";
  if (successes === 1) return "Weak";
  return "Failure";
}

export function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours <= 0) return `${remainingMinutes} min`;
  if (remainingMinutes === 0) return `${hours} hr`;
  return `${hours} hr ${remainingMinutes} min`;
}

export function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[character]
  );
}
