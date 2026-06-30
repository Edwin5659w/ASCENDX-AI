let welcomePending = false;

export function markWelcomePending() {
  welcomePending = true;
}

export function consumeWelcomePending() {
  const pending = welcomePending;
  welcomePending = false;
  return pending;
}
