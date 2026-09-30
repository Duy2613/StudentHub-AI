"use client";

import { useState } from "react";
import { relationLabel } from "@/lib/trust/trustV4Model";
import styles from "./trust-v4.module.css";

// The semantic tree is the explorer. It needs no canvas runtime or alternate
// inaccessible representation; every edge uses an explicit ID relationship.
export default function TrustV4Explorer({ model }) {
  const [selected, setSelected] = useState("");
  return <div className={styles.explorer} aria-label="Quan hệ bằng chứng"><p className={styles.note}>Mở một mệnh đề để theo dõi các liên kết được trả về.</p>{model.claims.filter((c) => c.id).map((claim) => <details key={claim.key} open={selected === claim.key} onToggle={(event) => { if (event.currentTarget.open && selected !== claim.key) setSelected(claim.key); }}><summary>{claim.statement}</summary><ul>{model.evidence.filter((e) => e.claimId === claim.id && e.source).map((item) => <li key={item.key}><span>{relationLabel(item.relation)}</span><p>{item.excerpt || item.summary || "Chưa có nội dung bằng chứng"}</p><strong>{item.source.title}</strong></li>)}</ul></details>)}</div>;
}
