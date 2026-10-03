// Both the room read model and round creation use this eligibility query.
// The independent Supervisor validates answers; a separate Expert submits them.
export async function roomRoundEligibility(client, room) {
  const members = await client.query(
    `SELECT p.user_id, p.role, p.conflict_declaration
       FROM private.expert_room_participants p
       JOIN private.expert_room_presence presence ON presence.user_id = p.user_id
       JOIN private.expert_verifications v ON v.user_id = p.user_id AND v.domain_code = $2
      WHERE p.room_id = $1 AND p.state = 'JOINED'
        AND p.role IN ('PARTICIPANT_EXPERT','SUPERVISOR_EXPERT')
        AND presence.expires_at > now()
        AND v.status = 'VERIFIED' AND v.qualification_state = 'DOMAIN_VERIFIED'
        AND v.suspended_at IS NULL AND (v.expires_at IS NULL OR v.expires_at > now())
      ORDER BY p.role, p.joined_at`, [room.id, room.domain_code],
  );
  const supervisor = members.rows.find((row) => row.role === 'SUPERVISOR_EXPERT'
    && String(row.user_id) === String(room.supervisor_user_id)
    && row.conflict_declaration === 'NO_KNOWN_CONFLICT');
  const answerExpertIds = [...new Set(members.rows
    .filter((row) => row.role === 'PARTICIPANT_EXPERT'
      && String(row.user_id) !== String(room.supervisor_user_id)
      && String(row.user_id) !== String(room.host_user_id))
    .map((row) => String(row.user_id)))];
  const blockReason = room.status !== 'LOBBY' ? 'EXPERT_ROOM_NOT_READY'
    : !supervisor ? 'EXPERT_ROOM_SUPERVISOR_REQUIRED'
      : !answerExpertIds.length ? 'EXPERT_ROOM_EXPERT_REQUIRED' : null;
  return {
    eligibility: {
      canStart: blockReason === null,
      supervisorEligible: Boolean(supervisor),
      answerExpertCount: answerExpertIds.length,
      blockReason,
    },
    answerExpertIds,
  };
}
