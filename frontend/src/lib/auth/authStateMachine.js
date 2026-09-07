// StudentHub AI — explicit client authentication state contract.
//
// This module is deliberately framework-free so the transition contract can be
// tested without mounting React or contacting an auth provider.

export const AUTH_STATE = Object.freeze({
  INITIALIZING: "INITIALIZING",
  SIGNED_OUT: "SIGNED_OUT",
  AUTHENTICATING: "AUTHENTICATING",
  SIGNED_IN: "SIGNED_IN",
  REFRESHING: "REFRESHING",
  SIGNING_OUT: "SIGNING_OUT",
  ERROR: "ERROR",
});

export const AUTH_STATES = AUTH_STATE;

// Cross-tab logout carries no credential; it is only a local invalidation
// signal for browser-owned UI and provider state.
export const AUTH_LOGOUT_CHANNEL = "studenthub-auth";
export const AUTH_LOGOUT_SIGNAL_KEY = "studenthub_auth_logout";

const transitionTable = Object.freeze({
  [AUTH_STATE.INITIALIZING]: new Set([
    AUTH_STATE.AUTHENTICATING,
    AUTH_STATE.SIGNED_IN,
    AUTH_STATE.SIGNED_OUT,
    AUTH_STATE.ERROR,
  ]),
  [AUTH_STATE.SIGNED_OUT]: new Set([
    AUTH_STATE.AUTHENTICATING,
    AUTH_STATE.SIGNING_OUT,
    AUTH_STATE.ERROR,
  ]),
  [AUTH_STATE.AUTHENTICATING]: new Set([
    AUTH_STATE.SIGNED_IN,
    AUTH_STATE.SIGNED_OUT,
    AUTH_STATE.ERROR,
    AUTH_STATE.AUTHENTICATING,
  ]),
  [AUTH_STATE.SIGNED_IN]: new Set([
    AUTH_STATE.REFRESHING,
    AUTH_STATE.AUTHENTICATING,
    AUTH_STATE.SIGNING_OUT,
    AUTH_STATE.SIGNED_OUT,
    AUTH_STATE.ERROR,
  ]),
  [AUTH_STATE.REFRESHING]: new Set([
    AUTH_STATE.SIGNED_IN,
    AUTH_STATE.SIGNED_OUT,
    AUTH_STATE.SIGNING_OUT,
    AUTH_STATE.ERROR,
    AUTH_STATE.REFRESHING,
  ]),
  [AUTH_STATE.SIGNING_OUT]: new Set([
    AUTH_STATE.SIGNED_OUT,
    AUTH_STATE.ERROR,
    AUTH_STATE.SIGNING_OUT,
  ]),
  [AUTH_STATE.ERROR]: new Set([
    AUTH_STATE.INITIALIZING,
    AUTH_STATE.AUTHENTICATING,
    AUTH_STATE.SIGNED_IN,
    AUTH_STATE.SIGNED_OUT,
    AUTH_STATE.SIGNING_OUT,
    AUTH_STATE.ERROR,
  ]),
});

export function isAuthState(value) {
  return Object.values(AUTH_STATE).includes(value);
}

export function canTransitionAuthState(from, to) {
  if (!isAuthState(from) || !isAuthState(to)) return false;
  if (from === to) return true;
  return transitionTable[from]?.has(to) === true;
}

export function assertAuthTransition(from, to) {
  if (!canTransitionAuthState(from, to)) {
    throw new Error(`AUTH_ILLEGAL_TRANSITION:${String(from)}->${String(to)}`);
  }
  return to;
}

export function transitionAuthState(current, next) {
  return assertAuthTransition(current, next);
}
