---
title: "Semantic Drift Detector"
legend: PROCESS
lane: inbox
---

# Semantic Drift Detector

Extend `method drift` to use LLM-based semantic matching for cases where 
test descriptions don't exactly match playback questions but are 
conceptually identical.

## Matching Rules

- **Automatic Match**: Cosine similarity >= 0.80 or LLM confidence >= 0.9.
- **Human Review**: Similarity between 0.65 and 0.80 triggers a "Near Miss" 
  hint requiring manual confirmation.
- **Non-Match**: Marked as drift if confidence is below 0.65.

## Fallback Behavior

- If the LLM call fails or times out, fall back to the existing lexical 
  normalized matching.
- Explicitly log failure modes: `low_confidence`, `timeout`, 
  `ambiguous_multi_intent`.
