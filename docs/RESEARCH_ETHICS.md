# Research Ethics Boundary & Protocol — MindSense

**Project**: MindSense — Multimodal Emotion & Mental Health Monitoring System  
**Document Version**: 1.0 (Phase 0 Foundation)  
**Status**: Mandatory Research Policy  

---

## 1. Non-Clinical Diagnostic Boundary

> [!WARNING]
> **CRITICAL ETHICAL & LEGAL NOTICE**:  
> MindSense is strictly an **affective computing research platform and personal wellness reflection tool**.  
> MindSense is **NOT** a medical device, clinical diagnostic instrument, psychiatric diagnostic tool, or licensed healthcare service.

### Prohibited Descriptions & Medical Claims
Under no circumstances may MindSense outputs or algorithmic predictions be described as, marketed as, or utilized for:
- ❌ **Depression diagnosis** (Major Depressive Disorder, Dysthymia).
- ❌ **Anxiety diagnosis** (Generalized Anxiety Disorder, Panic Disorder, Social Anxiety).
- ❌ **Psychiatric or clinical diagnosis** (Bipolar disorder, PTSD, Schizophrenia, etc.).
- ❌ **Medical triage, therapy replacement, or clinical treatment recommendations**.

### Permitted Research & Wellness Descriptions
MindSense predictions must strictly be described as:
- ✅ **Computational estimates of expressed affective behavior** (facial action unit configurations, vocal acoustic prosody, lexical sentiment).
- ✅ **Subjective wellness reflection metrics** for personal self-monitoring.
- ✅ **Statistical research approximations** in affective computing.

---

## 2. Crisis Safety & Triage Protocol

If a user inputs language or cues indicating acute psychological distress, self-harm, or suicidal ideation:
1. **Immediate Algorithmic Bypass**: The model prediction pipeline is bypassed to prevent inappropriate automated classifications.
2. **Prominent Crisis Helpline Display**: Verified free, confidential professional support resources are immediately presented:
   - **National Suicide and Crisis Lifeline**: Call/Text `988` (USA/Canada)
   - **The Trevor Project**: Call `866-488-7386` or Text `START` to `678-678`
   - **Crisis Text Line**: Text `HOME` to `741741`
   - **International Resources**: Direct link to `findahelpline.com` (Befrienders Worldwide)
3. **No Automated Clinical Advice**: The platform never attempts automated psychological counseling or conversational therapy.

---

## 3. Human Subjects Data Collection Ethics (Future Real-User Studies)

Prior to any collection of real-world user data for research purposes (e.g. Experiment `E16`), the following seven mandatory safeguards must be satisfied:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    HUMAN RESEARCH SUBJECT ETHICS MATRIX                     │
├──────────────────────────┬──────────────────────────────────────────────────┤
│ Safeguard                │ Implementation & Enforcement Mechanism           │
├──────────────────────────┼──────────────────────────────────────────────────┤
│ 1. Ethical Approval      │ Formal IRB / Institutional Ethics Board Protocol │
│ 2. Informed Consent      │ Explicit opt-in consent form with clear scope    │
│ 3. Pseudonymization      │ De-identified participant tokens (e.g. `P-98A7`) │
│ 4. Granular Opt-in       │ Modality-level consent (Text, Audio, Vision)     │
│ 5. Right to Withdraw     │ One-click instant withdrawal from ongoing study  │
│ 6. Right to Erasure      │ Complete deletion of all raw media and metadata  │
│ 7. Strict Data Retention │ Automated expiration and purging after retention │
└──────────────────────────┴──────────────────────────────────────────────────┘
```

### 3.1 Informed Consent Protocol
Participants must review an explicit informed consent document detailing:
- Exact nature of data collected (audio recordings, facial images, journal entries).
- Research purposes and non-clinical nature of the study.
- Risks, benefits, and data storage protections.
- Voluntary nature of participation without penalty for non-participation.

### 3.2 Pseudonymization & De-Identification
- Raw user names and contact details are severed from research records.
- Each participant is assigned a cryptographically generated pseudonymized code (e.g., `P-4F829A`).
- All media assets (audio waveforms, face crops) are indexed strictly by participant code and analysis ID.

### 3.3 Right to Immediate Withdrawal & Data Erasure (GDPR/CCPA Compliance)
- Participants maintain the unilateral right to withdraw from research participation at any time via the user portal (`/research/participate`).
- One-click account deletion triggers immediate hard deletion (`CASCADE DELETE`) across all database records, Cloudinary media assets, and local temporary files.

### 3.4 Data Retention & Access Control
- Raw audio and video assets are retained strictly for the duration specified in the approved research protocol, after which they are automatically purged.
- Access to raw multimodal data is restricted to authorized research personnel with multi-factor authentication and signed DUAs.

---

## 4. Bias & Fairness Considerations

1. **Demographic & Cultural Variance**: Affective expression varies widely across cultural backgrounds, native languages, accents, age groups, and gender identities. Models must be audited for subgroup disparity.
2. **Acoustic & Environmental Disparities**: Microphone quality, ambient background noise, and camera resolution must not disproportionately degrade predictions for users in lower-resource settings.
3. **No Presumption of Affective Truth**: The system must acknowledge that outward expressive behavior (facial movements, vocal pitch) does not equate to internal subjective experience.
