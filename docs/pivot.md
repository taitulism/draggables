# pivot.md

Main entry point for the `draggables` pivot. Work spans multiple chats — read this file first.

## Context

This library was built for one specific project. I now want it reusable in more cases.

**First change:** emit on drag move instead of changing the CSS `translate`. Movement becomes the
consumer's job; the library reports the gesture.

Other things need to be refactored / abstracted out. This is a big refactor / pivot — a re-shuffle.
New decisions will be made, **breaking changes are expected**.

## Docs

- [BUGS.md](BUGS.md) — bugs, small stuff, test gaps. Concrete near-term fixes; **start here**.
  These get addressed before any big change.
- [GRILL.md](GRILL.md) — architecture & abstractions (A1–A8) + the "headless gesture core"
  direction. To be **discussed first**, not implemented blind.

## Order of work

1. Clear [BUGS.md](BUGS.md) — small, self-contained, keeps the lib honest through the refactor.
2. Discuss the A-section of [GRILL.md](GRILL.md) — decide what stays, what goes, what's a feature.
3. Pivot: emit-on-move (drop CSS writes), then extract whatever falls out of step 2.

The "Direction: extract a headless gesture core" section at the end of [GRILL.md](GRILL.md) is the
closest thing to a target shape so far — a starting point for the discussion, not a decision.

## Decisions log

_(append decisions here as they're made, so later chats don't re-litigate them)_
