---
title: "Invariant: Sponsor Abstractness"
---

## What must remain true?

Sponsors named in design documents are abstract roles, not specific
individuals or agent instances.

## Why does it matter?

METHOD is a coordination protocol between two seats at the table: the
Human and the Agent. Naming literal people (e.g., "@james") or literal
agents (e.g., "@gemini-cli") creates a brittle, person-dependent history.
Roles (e.g., "Repository Operator", "Code Hardener", "Protocol Designer") 
describe *who would care* about the feature and *what perspective* they 
bring, which remains true regardless of who is currently sitting in the seat.

## How do you check?

- Design documents name sponsors as roles (e.g., "Human: System Architect").
- No literal personal names or specific agent brand names are used in 
  the `Sponsors` section.
- The roles named are descriptive of the interests being represented 
  in the cycle.
