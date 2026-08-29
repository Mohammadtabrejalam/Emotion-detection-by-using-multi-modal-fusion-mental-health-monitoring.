# Emotion Recognition Challenge Specification

## Overview
The **Emotion Recognition Challenge** (`#/challenge` or `/game`) is an educational reflection feature testing perception of facial micro-expressions, vocal acoustics, and situational context across 7 affective classes (Happy, Sad, Angry, Fearful, Surprised, Disgusted, Neutral).

## Key Features
- **30–90 Second Interactive Reflection**: 5 situational affect scenarios.
- **Real-Time Scoring & Streak**: Score, accuracy percentage, and current daily streak.
- **Anonymous Play Support**: Unauthenticated visitors can complete challenges without mandatory registration.
- **Optional Account Registration CTA**: Displayed upon completion (*"Create a free research account to track long-term accuracy trends"*).
- **Non-Clinical Disclaimer**: Prominently states that challenge scores are educational exercises and do NOT constitute psychological evaluation or medical diagnosis.

## Database Integration
Game sessions are logged to `game_sessions` (`score`, `total_questions`, `accuracy`, `streak`, `completed_at`) and high scores are tracked in `game_scores`.
