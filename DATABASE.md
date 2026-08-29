# MindSense PostgreSQL Database Schema & Migration Specification

## 1. Database Architecture
MindSense utilizes **PostgreSQL** in production with **SQLAlchemy 2.0 ORM** models and **Alembic** migration management. Local development falls back seamlessly to SQLite (`mindsense.db`).

## 2. Entity Relationship Summary

| Table | Purpose | Primary Keys & Indexes | Foreign Keys |
| :--- | :--- | :--- | :--- |
| `users` | User accounts | `id` (PK), `username` (UIX), `email` (UIX) | None |
| `developers` | Developer portal accounts | `id` (PK), `username` (UIX), `email` (UIX) | None |
| `roles` | RBAC role definitions | `id` (PK), `name` (UIX) | None |
| `sessions` | Active login sessions | `id` (PK), `token_jti` (UIX) | `user_id` $\rightarrow$ `users.id`, `developer_id` $\rightarrow$ `developers.id` |
| `analysis_results` | Emotion predictions | `id` (PK), `user_id` (IDX), `created_at` (IDX) | `user_id` $\rightarrow$ `users.id` (CASCADE) |
| `analysis_input_metadata` | Input file references | `id` (PK), `analysis_id` (UIX) | `analysis_id` $\rightarrow$ `analysis_results.id` (CASCADE) |
| `checkins` | Daily mood check-ins | `id` (PK), `user_id` (IDX) | `user_id` $\rightarrow$ `users.id` (CASCADE) |
| `feedbacks` | User feedback tickets | `id` (PK), `user_id` (FK) | `user_id` $\rightarrow$ `users.id` (SET NULL) |
| `research_participants` | Academic study codes | `id` (PK), `participant_code` (UIX) | `user_id` $\rightarrow$ `users.id` (CASCADE) |
| `research_consents` | Informed consent logs | `id` (PK), `user_id` (FK) | `user_id` $\rightarrow$ `users.id` (CASCADE) |
| `share_links` | Shared analysis tokens | `id` (PK), `token` (UIX) | `analysis_id` $\rightarrow$ `analysis_results.id`, `user_id` $\rightarrow$ `users.id` |
| `game_sessions` | Challenge quiz attempts | `id` (PK), `user_id` (FK) | `user_id` $\rightarrow$ `users.id` (SET NULL) |
| `game_scores` | High scores | `id` (PK), `user_id` (FK) | `user_id` $\rightarrow$ `users.id` (CASCADE) |
| `audit_logs` | System security audit trail | `id` (PK), `created_at` (IDX) | None |
