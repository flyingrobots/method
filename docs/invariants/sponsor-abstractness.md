---
title: "Invariant: Role and Perspective Abstractness"
---

## What must remain true?

When METHOD says `Human`, `Agent`, or `User`, it means an abstract role
or perspective, not a specific individual, account, model brand, or
running agent instance.

## Why does it matter?

METHOD is a coordination protocol between two seats at the table: the
Human and the Agent. Naming literal people (e.g., "@james") or literal
agents (e.g., "@gemini-cli") creates a brittle, person-dependent history.
Roles (e.g., "Repository Operator", "Code Hardener", "Protocol Designer")
describe *who would care* about the feature and *what perspective* they
bring, which remains true regardless of who is currently sitting in the seat.

`User` should be read the same way it is in a user story: the served
perspective or beneficiary of the change, not a named person who must be
present during authorship, review, or playback.

## How do you check?

- Design documents name sponsors as roles (e.g., "Human: System Architect").
- Doctrine uses `human`, `agent`, and `user` to describe seats or
  perspectives in the workflow, not literal identities.
- No literal personal names or specific agent brand names are used in
  the `Sponsors` section or elsewhere when an abstract seat is intended.
- The roles named are descriptive of the interests being represented
  in the cycle.
- This is enforced by the automated docs test (`tests/docs.test.ts`).
