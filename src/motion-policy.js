// Pure rendering policy: reduced motion must never trigger automated camera travel.
// Manual orbit and zoom remain available regardless of OS preference.
export function shouldFollowStoryCamera({automaticFraming, reducedMotion}) {
  return Boolean(automaticFraming) && !Boolean(reducedMotion);
}
