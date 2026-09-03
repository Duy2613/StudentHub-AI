# 👤 Personal Digital Twin & Data Vault Architecture V1

> **Document Version**: `1.0.0` | **Status**: `PRODUCTION-READY LOCKED`  
> **Core Principle**: *The Digital Twin represents authorized institutional context and explicit user contributions — never invasive surveillance.*

---

## 1. 5-Tier Data Classification

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. INSTITUTION_PROVIDED (Authoritative Identity & Records)  │
├─────────────────────────────────────────────────────────────┤
│ 2. SYSTEM_DERIVED (Digital Twin Eligibility, Recommendations)│
├─────────────────────────────────────────────────────────────┤
│ 3. USER_OWNED (Goals, Notes, Preferences, Saved Knowledge) │
├─────────────────────────────────────────────────────────────┤
│ 4. COMMUNITY_DERIVED (Reputation Graph, Peer Validations)  │
├─────────────────────────────────────────────────────────────┤
│ 5. SECURITY_SENSITIVE (Registered Devices, Session State)  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Anti-Surveillance Invariants

The `PersonalDigitalTwin` is strictly bounded:
- ❌ **NO Browser History Snooping**
- ❌ **NO Device File Indexing**
- ❌ **NO Clipboard Snooping**
- ❌ **NO Keystroke Telemetry**
- ❌ **NO Background Microphone / Camera Access**

---

## 3. GDPR Article 20 Data Portability Export

Users can trigger a full JSON export of their Personal Data Vault (`PersonalDigitalTwin.exportPersonalVault(subjectId)`) via the Privacy & Access Center.
