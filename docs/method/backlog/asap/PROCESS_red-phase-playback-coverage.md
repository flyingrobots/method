# RED should explicitly cover playback questions and test-shape breadth

METHOD says RED tests are the executable spec and that playback
questions become specs. That is directionally correct, but it still
allows a weak RED phase where only the happy path is captured.

The README should state this explicitly:

- RED must cover the playback questions
- RED should also cover, where relevant to the hill:
  - golden path
  - failure modes
  - edge cases
  - stress / fuzz behavior
- If one of those categories is not relevant, the design doc or test
  file should say so explicitly

Why:
- It makes RED usable as both witness scaffold and regression suite
- It prevents narrow happy-path RED from masquerading as executable spec
- It makes the quality bar legible before GREEN starts

Likely touch points:
- `README.md` RED step
- Possibly `process.md` if the repo wants a more operational version of
  the same rule
