# Skyghene

A repository for testing whether the architecture guide of
[guppy0356/Tolone](https://github.com/guppy0356/Tolone) can be rewritten as a single,
simpler `architecture.md` without losing what makes it work.

## Background

Tolone is a pnpm monorepo for working out one React architecture, Container +
Presentational Component, by building small playground apps against a written guide.
The guide is the deliverable, and it has grown with every playground:

- `docs/architecture/` now spans 24 files and roughly 2,650 lines, split into layers,
  conventions, testing, routing, URL state, mocking, setup and workflow.
- `docs/adr/` holds 13 decision records explaining why a rule is what it is.
- `overview.md` is mostly an index: two tables that map "what you are about to write"
  and "which rule" to the file that states it.

That structure is deliberate. Each rule is stated once, in the file that applies it.
But it means a reader opens many files to build one page, and the guide is hard to hold
in one's head. This repository asks whether the same architecture can be described in
far less.

## The hypothesis

Three things should be enough to implement against:

1. **An overview of the layers.** The whole shape on one screen: which layers exist,
   and in what order data moves through them.
2. **For each layer, three facts.** What it receives, what it does with that, and
   where it hands the result. Nothing else about the layer needs stating.
3. **A good example and a bad example.** For each layer, one implementation that
   follows the rule and one that breaks it, so the rule can be recognized rather than
   interpreted.

If `architecture.md` says this much and a builder still cannot decide something, the
document is not the place to resolve it. The builder asks a human, and the question and
the answer are kept in this repository as a record. Those records show what the three
items could not carry, and whether an answer belongs back in the guide or stays a
one-off.

## Method

The verification borrows Tolone's own method: put the document under pressure by
building against it.

1. Write `architecture.md` as a single file, from scratch, holding it to the three
   items above.
2. Build a small playground from `architecture.md` alone.
3. Where the build cannot decide, do not guess and do not patch the guide on the spot.
   Ask a human, and record the question and the answer.
4. Afterwards, go through the records. An answer that would apply to any page goes into
   the guide, within the same three items. An answer that only applied once stays in
   the record.
5. Compare the result with Tolone's guide: what was dropped safely, what had to return,
   and what turned out to belong in an ADR rather than in the guide.

## Layout

Planned shape. Nothing beyond this README exists yet.

```
.
├── README.md          # This file
├── architecture.md    # The candidate single-file guide
└── playgrounds/
    └── incident-board/    # The first app built from architecture.md alone
        └── questions.md   # What the guide could not answer while building it, and what the human said
```

## Status

Not started. The repository holds only this README.
