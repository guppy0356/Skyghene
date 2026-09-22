# Skyghene

A repository for testing whether the architecture guide of
[guppy0356/Tolone](https://github.com/guppy0356/Tolone) can be rewritten as one short
overview plus a set of complete examples, without losing what makes it work.

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
But a rule stated once must be linked from everywhere else it applies, so building one
page means following links across files and holding the rules in one's head. This
repository asks whether the same architecture can be carried by far less prose: one
short overview, and examples that are complete on their own.

## The hypothesis

Three things should be enough to implement against:

1. **An overview of the layers.** The whole shape on one screen: which layers exist,
   and in what order data moves through them.
2. **For each layer, three facts.** What it receives, what it does with that, and
   where it hands the result. Nothing else about the layer needs stating.
3. **For each layer, one file per implementation pattern.** Each file holds one complete
   implementation that follows the rules, why it does, and a few that break them by a
   few lines, so a rule can be recognized rather than interpreted.

If the guide says this much and a builder still cannot decide something, the
document is not the place to resolve it. The builder asks a human, and the question and
the answer are kept in this repository as a record. Those records show what the three
items could not carry, and whether an answer belongs back in the guide or stays a
one-off.

## Method

The verification borrows Tolone's own method: put the document under pressure by
building against it.

1. Write `architecture.md` and `layers/` from scratch, holding them to the three items
   above. Prose lives only in `architecture.md`; a pattern file holds code, one line of
   when to use it, and one line of why per decision.
2. Build a small playground from those files alone.
3. Where the build cannot decide, do not guess and do not patch the guide on the spot.
   Ask a human, and record the question and the answer.
4. Afterwards, go through the records. An answer that would apply to any page goes into
   the guide, within the same three items. An answer that only applied once stays in
   the record.
5. Compare the result with Tolone's guide: what was dropped safely, what had to return,
   and what turned out to belong in an ADR rather than in the guide.

Two rules keep `layers/` from growing back into Tolone's guide: prose stays in
`architecture.md`, and pattern files never link to each other. A builder reads the whole
directory for the layer it is about to write, and nothing else.

## Layout

```
.
├── README.md
├── architecture.md              # Items 1 and 2: the shape, and three facts per layer
├── layers/
│   └── {layer}/                 # Item 3: one file per implementation pattern
│       └── {pattern}.md         #   When, Good with its why, Bads that differ by a few lines
└── playgrounds/
    └── incident-board/          # The first app built from the guide alone
        └── questions.md         # What the guide could not answer while building it, and what the human said
```

## Status

`architecture.md` holds item 1; the three facts per layer are not written. `layers/` has
container-hook only; the other seven layers are not written. No playground yet.
