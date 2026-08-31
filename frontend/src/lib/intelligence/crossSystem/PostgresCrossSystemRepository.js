import { getPostgresPool } from "../../server/database/PostgresPool.js";

function eventDto(row) {
  return {
    id: row.id,
    type: row.event_type,
    provenanceClass: row.provenance_class,
    summary: row.summary,
    occurredAt: new Date(row.occurred_at).toISOString(),
    previousStatus: row.previous_status,
    newStatus: row.new_status,
    material: row.material,
    changeReason: row.change_reason,
    references: row.source_references || [],
    metadata: row.metadata || {},
  };
}

function passportDto(row, events = []) {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    subjectType: row.subject_type,
    subjectId: row.subject_id,
    currentStatus: row.current_status,
    revision: row.revision,
    demo: row.demo,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    events,
  };
}

export class PostgresCrossSystemRepository {
  constructor(pool = getPostgresPool()) {
    this.pool = pool;
  }

  async listPassports(ownerId) {
    const result = await this.pool.query(`
      select * from public.evidence_passports
      where owner_id = $1
      order by updated_at desc
      limit 100
    `, [ownerId]);
    return result.rows.map((row) => passportDto(row));
  }

  async getPassport(ownerId, passportId, { forUpdate = false, client = this.pool } = {}) {
    const passportResult = await client.query(`
      select * from public.evidence_passports
      where id = $1 and owner_id = $2
      ${forUpdate ? "for update" : ""}
    `, [passportId, ownerId]);
    if (!passportResult.rowCount) return null;
    const eventResult = await client.query(`
      select * from public.evidence_passport_events
      where passport_id = $1
      order by revision asc
    `, [passportId]);
    return passportDto(passportResult.rows[0], eventResult.rows.map(eventDto));
  }

  async createPassport(passport) {
    if (passport.demo) throw new Error("DEMO_DATA_REJECTED");
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const inserted = await client.query(`
        insert into public.evidence_passports(
          id, owner_id, title, subject_type, subject_id, current_status, revision, demo, created_at, updated_at
        ) values($1,$2,$3,$4,$5,$6,$7,false,$8,$8)
        returning *
      `, [passport.id, passport.ownerId, passport.title, passport.subjectType, passport.subjectId, passport.currentStatus, passport.revision, passport.createdAt]);
      const event = passport.events[0];
      await client.query(`
        insert into public.evidence_passport_events(
          id, passport_id, revision, event_type, provenance_class, summary,
          previous_status, new_status, material, change_reason, source_references, metadata, occurred_at
        ) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12::jsonb,$13)
      `, [event.id, passport.id, passport.revision, event.type, event.provenanceClass, event.summary, event.previousStatus, event.newStatus, event.material, event.changeReason, JSON.stringify(event.references), JSON.stringify(event.metadata), event.occurredAt]);
      await client.query("commit");
      return passportDto(inserted.rows[0], [event]);
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async appendPassportEvent(ownerId, passport) {
    if (passport.demo) throw new Error("DEMO_DATA_REJECTED");
    const event = passport.events.at(-1);
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const current = await this.getPassport(ownerId, passport.id, { forUpdate: true, client });
      if (!current) throw Object.assign(new Error("PASSPORT_NOT_FOUND"), { code: "PASSPORT_NOT_FOUND" });
      if (passport.revision !== current.revision + 1) throw Object.assign(new Error("PASSPORT_REVISION_CONFLICT"), { code: "PASSPORT_REVISION_CONFLICT" });
      await client.query(`
        insert into public.evidence_passport_events(
          id, passport_id, revision, event_type, provenance_class, summary,
          previous_status, new_status, material, change_reason, source_references, metadata, occurred_at
        ) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12::jsonb,$13)
      `, [event.id, passport.id, passport.revision, event.type, event.provenanceClass, event.summary, event.previousStatus, event.newStatus, event.material, event.changeReason, JSON.stringify(event.references), JSON.stringify(event.metadata), event.occurredAt]);
      await client.query(`
        update public.evidence_passports
        set current_status = $1, revision = $2, updated_at = $3
        where id = $4 and owner_id = $5 and revision = $6
      `, [passport.currentStatus, passport.revision, passport.updatedAt, passport.id, ownerId, current.revision]);
      if (event.material) {
        await client.query(`
          insert into public.notifications(
            owner_id, notification_type, subject_type, subject_id, material_change_revision, title, body
          ) select owner_id, 'EVIDENCE_MATERIAL_CHANGE', 'EVIDENCE_PASSPORT', id::text, $1, $2, $3
          from public.evidence_passports where id = $4 and owner_id = $5
          on conflict do nothing
        `, [passport.revision, `Bằng chứng mới: ${passport.title}`, event.changeReason || event.summary, passport.id, ownerId]);
      }
      await client.query("commit");
      return passport;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async createDecision(ownerId, decision) {
    if (decision.demo) throw new Error("DEMO_DATA_REJECTED");
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const scenarioResult = await client.query(`
        insert into public.decision_scenarios(
          owner_id, title, current_state, evaluation_method, recommendation_state,
          recommended_option_key, unknowns, demo
        ) values($1,$2,$3,$4,$5,$6,$7::jsonb,false)
        returning id, created_at
      `, [ownerId, decision.title, decision.currentState, decision.evaluationMethod, decision.recommendationState, decision.recommendedOptionId, JSON.stringify(decision.unknowns)]);
      const scenarioId = scenarioResult.rows[0].id;
      for (const option of decision.options) {
        const rank = decision.ranking.find((item) => item.optionId === option.id)?.rank || decision.options.length;
        await client.query(`
          insert into public.decision_options(
            scenario_id, option_key, label, summary, next_action, factors, consequences, total_cost, rank
          ) values($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,$9)
        `, [scenarioId, option.id, option.label, option.summary, option.nextAction, JSON.stringify(option.factors), JSON.stringify(option.consequences), option.score.total, rank]);
      }
      await client.query("commit");
      return { ...decision, persistence: { scenarioId, createdAt: new Date(scenarioResult.rows[0].created_at).toISOString() } };
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }
}
