const FRIEND_SUPPORTED_INPUTS = new Set(["text", "url"]);

function normalizeInputType(value) {
  const type = typeof value === "string" ? value.trim().toLowerCase() : "text";
  return ["text", "url", "image", "qr", "file"].includes(type) ? type : "text";
}

/**
 * Keep the StudentHub path available for every input. Friend Trust is an
 * explicitly enabled advisory capability and currently has verified request
 * request wiring for text and URL only; media stays StudentHub-only.
 */
export function resolveTrustCapabilityPlan(input, { friendEnabled = false } = {}) {
  const inputType = normalizeInputType(input?.type);
  const friendInputSupported = FRIEND_SUPPORTED_INPUTS.has(inputType);
  const friendAdvisoryEnabled = friendEnabled === true && friendInputSupported;

  return Object.freeze({
    inputType,
    canonicalProvider: "STUDENTHUB",
    canonicalStages: ["L1", "L2", "L3", "L4"],
    friendTrust: Object.freeze({
      mode: friendAdvisoryEnabled ? "SHADOW" : "DISABLED",
      inputSupported: friendInputSupported,
      layer2: friendAdvisoryEnabled,
      layer3: friendAdvisoryEnabled,
      layer4: friendAdvisoryEnabled,
      canAffectCanonicalConclusion: false,
      reason: friendAdvisoryEnabled
        ? "Friend Trust is attached as a non-authoritative advisory for a supported input type."
        : friendEnabled
          ? `Friend Trust has no verified ${inputType.toUpperCase()} capability; StudentHub remains the sole processor.`
          : "Friend Trust is not enabled; StudentHub remains the sole processor.",
    }),
  });
}
