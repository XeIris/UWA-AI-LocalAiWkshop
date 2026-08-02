# CLAUDE.md — "Run AI Locally" Workshop

## What this project is

An interactive HTML presentation for a **2-hour beginners' workshop** on running local
LLMs, delivered at a hobbyist club. The deck is projected by a presenter and may also be
shared afterwards as a self-study link.

**Audience:** beginners. Consumer hardware (8–16GB laptops, mid-tier dGPUs, M-series
Macs). Assume no prior knowledge of quantization, VRAM, or inference engines.

**Tone:** practical, honest about limitations, no hype. The goal is that everyone leaves
with a working local model on their own machine and a correct mental model of *why* it
performs the way it does.

## Identity & visual design (decided 2026-07-26)

**Title:** **AI, Unplugged** — subtitle *"Real language models, running on the hardware
you already own."* Cover strapline: NO CLOUD / NO SUBSCRIPTION / NO WI-FI REQUIRED.

**Theme:** *hardware blueprint*. Near-black base (`#05080b`), faint cyan measurement grid,
thin rules, panels rather than cards-with-shadows. Everything reads as a schematic.

**The palette rule — this is load-bearing, do not break it.** Cyan (`--accent: #35d6e8`)
owns *all* chrome and structure. The **entire warm range is reserved for semantics**:
`--ok` green, `--warn` amber, `--bad` red exist only for the fit indicator, the
quantization cliff, and genuine warnings. If something is amber on a slide, it *means*
something. Never use warm colors decoratively.

**Third state — filled white.** Where something needs to read as a *different category*
rather than a stronger recommendation (the "PRESENTER DEMO" badge on the model picker),
use filled `--ink` with dark text, mirroring the filled-cyan badge. Violet was the
obvious choice and is wrong: Qwen's own mark is `#6336E7` and sits directly under that
badge. Do not add a fourth hue without a reason this specific. On paper the same
third state is filled black — "a different category", not "a darker cyan", is the
thing being encoded, and it survives the inversion.

**Light theme (added 2026-08-02).** A second token block, `:root[data-theme="light"]`,
and *nothing else*: the same blueprint printed rather than projected. Dark remains the
default and there is deliberately **no `prefers-color-scheme` rule** — auto-switching
would mean a presenter discovering their deck is white as they plug into the projector.
The toggle is top-left, mirrors the counter, persists in `localStorage` (wrapped in
try/catch; `file://` storage is not guaranteed), and shows the theme you would *get*.

Three rules keep it working:

- **No colour at a use site.** A hex or `rgba()` in a component file is a bug now.
  Warm tints are `color-mix(in srgb, var(--ok) 9%, transparent)` so they follow the
  semantic token; text sitting *on* a filled swatch uses `--on-accent` / `--on-ink` /
  `--on-ok` / `--on-bad`, which flip with the theme. Hardcoding `#04262b` on a fill is
  exactly what broke when light mode arrived.
- **Canvas has to be told.** `THEME` (and §3's `C`) are **refilled in place** on
  `deck:theme`, never replaced — every module captured the reference. A theme change
  fires `deck:theme` then `deck:slide`, in that order, or the repaint uses the old
  palette. The cover art's shade ramp is two numeric tokens (`--art-l0`, `--art-span`,
  plus saturation) so it inverts instead of staying a dark rectangle on white.
- **Never name a colour in slide copy.** "The white bars are inference" stopped being
  true the moment the bars went black. Name the category, not the ink.

Semantics keep their meaning and lose their neon: `--ok` `#15803d`, `--warn` `#b45309`,
`--bad` `#c02626`. Green at dark-theme brightness is unreadable on white, and washing it
out instead would break the one rule the palette has.

**Glossary.** Terms are marked by a DOM pass at load (`js/19-glossary.js`), not by hand
in the slide source — hand-marked spans would drift the first time a sentence was
reworded. The pass is timid on purpose: prose containers only (never a heading, readout
or control, where an underline reads as part of the number), one mark per *definition*
per slide, at most six per slide, longest term first so "memory bandwidth" beats
"bandwidth". Opt out with `data-noglossary`. Definitions are one sentence and say what
the thing **is** — the slide is already doing the job of saying why it matters. Each
carries the section that covers it properly, as a `data-goto` button, which the deck's
existing delegated listener handles for free.

Each entry may also carry a **"not the same as"** list, and that half is the one people
actually need. Nearly every wrong mental model in the room is a *collision* between two
neighbouring words — quantization with distillation, the context window with memory,
fine-tuning with RAG, llama.cpp with Llama, LM Studio with LM Studio Bionic,
DiffusionGemma with Gemini Diffusion — and a definition that only says what a thing is
leaves the collision intact. Where a term has a famous twin, name the twin. Definitions
are as long as the idea needs; the panel scrolls internally rather than growing off the
screen, because it is anchored to a word in a sentence and cannot move to make room.

**Type:** system font stack (no CDN, no embedded webfont). Sans for prose, monospace for
every number, formula, label and eyebrow. Root font-size scales off `min(vw, vh)` so the
deck is legible both projected at 1080p and on an attendee's 13" laptop.

**Motion:** slide-to-slide is a pure ~260ms opacity fade, nothing else. Within a slide,
**an animation must encode a variable, never decorate one** — if it moves, it is showing
a quantity changing. Respect `prefers-reduced-motion`.

**Every animation loop is wound on arrival and stopped on departure.** Not merely
skipped: a `requestAnimationFrame` loop that early-returns when its slide is inactive
still pays a callback every frame, and the two `setInterval` clocks (§2's template, §6's
chat) were firing 30 times a second on all 38 slides. Six loops ran for the whole talk on
a laptop that is probably on battery. Each module now starts its loop from its own
`deck:slide` handler and clears it otherwise, with a guard against double-starting —
`deck:slide` arrives twice when the theme toggle fires. This does not weaken the
timer-not-rAF argument in `17-chat.js`: that is about which *clock* to use, not about
running one all evening.

**Pin every canvas to a resolved height.** A `<canvas>` is a replaced element, so if its
height stays unresolved it falls back to its own `height` attribute — which `fitCanvas`
writes from the measured size, so the two chase each other and the canvas runs away by
the device pixel ratio on every repaint. **This has now bitten twice**, on §6's scale
grid and on §5's KV chart, and both times it was invisible at dpr 1 and explosive on the
Retina laptop you present from. Give the container a definite height (an explicit grid
row) and let the canvas take `height: 100%` or `flex: 1 1 0; min-height: 0`. Never leave
a canvas sized by its own content.

**Corner radius is a single dial.** `--r-scale` in `:root` drives every rounded corner
in the deck (`--r-sm` / `--r-md` / `--r-lg` / `--r-pill` all derive from it). `1` is the
current app-like rounding; `0` returns the whole deck to the original hard-edged
draughting look. Do not hardcode a `border-radius` anywhere — derive it, or the dial
stops working.

Note the tension this creates: rounded corners pull *away* from "technical drawing".
What keeps the blueprint identity is the measurement grid, the thin rules, the mono
labels and the numeric readouts — not the corners. The corner-bracket panel treatment
was removed when rounding came in because the two fight each other.

**Brand assets.** All logos are inlined as `<symbol>` elements in a hidden `<svg>` at the
top of `<body>`, used via `<use href="#lg-…">`. Nothing is fetched at runtime — the
offline rule applies to logos too. Most come from **lobehub/lobe-icons**, which matters
because every icon there is a 1:1 24×24 glyph; mixing official brand assets would mean
mixing wildly different aspect ratios. Exceptions: llama.cpp uses the official
`ggml-org/llama.brand` 600×600 icon, MLX is Apple's square PNG base64'd (it has no
dark-background square mark, so it fills its chip as an app icon), and GPT4All has no
logo at all and gets a typographic chip.

When adding a logo, namespace any `id` inside it — brand gradients collide otherwise.
If a mark relied on `fill="currentColor"` on its root `<svg>`, that attribute is lost in
the lift to `<symbol>`; `.chip svg { fill: currentColor }` restores it.

**Cover art:** canvas grid of weights cycling the flagship trio (7.5B@16 → 15B@8 →
30B@4). As parameters rise the grid gets denser; as precision falls it gets coarser; the
footprint bar underneath never moves. The invariance *is* the thesis, stated before a
word is spoken.

## Build order

1. ~~Shell + theme spike~~ — nav, rail, fades, cover, §0 content, §3 formula slide.
2. ~~§1 model picker + sampling interactives, §2 provenance/engines/alternatives~~ —
   brand chip system and the rounded-corner dial landed with these.
3. ~~§3 decode-speed estimator~~ — plus the two-machine fit/spill slide. Hardware
   figures verified Jul 2026: RTX 5090 32 GB @ 1792 GB/s, DDR5-6000 dual-channel
   96 GB/s, M5 Max 614 GB/s (40-core; 32-core is 460, M5 Pro 307). Both machines on
   the slide hold 64 GB *on purpose* — equal capacity isolates bandwidth as the
   variable. The read head crosses the whole model once per token at the bandwidth of
   whichever pool it is in, slowed by a single constant (`SLOWMO`), so every ratio on
   screen is the true ratio. Canvas metrics derive from the live root font size —
   canvas ignores rem, and hardcoded px would not survive a projector.
4. ~~§4 quant explainer + memory calculator + fit indicator + quiz + quality cliff;
   §5 KV formula/chart + the context ceiling.~~ The §4 spine is *what a quant is →
   see it → cost it → commit to an answer → learn the floor*. The explainer
   quantizes a real 24-weight block live (symmetric absmax), so the integer codes
   on screen are the ones a file would hold and the shared fp16 scale is visible —
   that block-scale overhead is what makes Q4_K_M 4.83 bpw, which is the setup for
   the calculator's napkin-vs-reality gap. The quiz reveals on click, never on
   load; ask the room for hands first. §5's per-token figures are representative
   configs, not any one `config.json`: 1B ≈ 26L/1 KV/256, 8B ≈ 32L/8 KV/128
   (the familiar 128 KB/token), 30B ≈ 48L/8 KV/128. KV sizes are **binary**
   throughout — a context length is a power of two and rendering 32768 as "33K"
   is correct and useless.
5. ~~Orientation slide, the LM Studio download slide, the prefill race, and the
   napkin fraction.~~ Adding three slides forced a full renumber of `src/slides/`
   — that is the prefix rule working, not a problem with it. The orientation
   slide's contents rows are `[data-goto]` buttons handled by a delegated
   listener in `00-deck.js`, so any future slide can carry a jump target with
   no JS of its own.
6. ~~§6 / §7 content.~~ §6 opens with a **scale chart** before any
   good-at/bad-at claim, because "your model is small" has to be *felt*
   before it can be reframed. Models are revealed one at a time and the
   axis rescales, so each press visibly shrinks everything already on
   screen; LINEAR is the drama and LOG is where you read the numbers.
   A second BY YEAR view carries the disclosure story — OpenAI and
   Google published parameter counts up to 2022/23 and then stopped, so
   every solid point after 2023 is open weights. Say that precisely on
   the slide: OpenAI's last real number was GPT-3's and Google's was
   PaLM's, both superseded in 2023 by releases that gave no figure, and
   **Anthropic never published one at all**. "OpenAI stopped after 2023"
   is wrong (GPT-4 is where they stopped, not where they last disclosed)
   and "Google never started" is wrong the other way. Closed models are drawn
   as **ranges**, not points: the two public attempts to estimate them
   from the outside (arXiv 2604.24827 and the LessWrong re-analysis)
   disagree by roughly 6x, and pretending otherwise would be the one
   dishonest thing on the slide. Category is coded by fill — solid cyan
   runs on a laptop, hollow cyan is open-but-out-of-reach, filled `--ink`
   is closed. That is the same third-state rule as the PRESENTER DEMO
   badge, and it is what keeps the warm range free.
   §6's second slide is a **chat window**, not a list. Nine scenarios
   play as scripted conversations — the good ones show the model doing
   the job (a PDF arrives, it is read, an answer streams), the bad ones
   put a frontier model or the arithmetic in a second lane beside it.
   A second lane appears *only* where the comparison is the argument
   (offline, unmetered, and all three failures); everything else is one
   lane, because a comparison the slide is not making just muddies it.
   The wrong answers are the failure modes the literature actually
   reports — fabrication rather than abstention, and multiplicative
   error compounding (p^n: 90% per step over 12 steps is a 28% chance of
   a clean run) — not gotchas invented to win the point. The reasoning
   example is deliberately the deck's own tok/s formula, so the room can
   check the model's answer themselves.
   **Its clock is a `setInterval`, not `requestAnimationFrame`, and that
   is deliberate** &mdash; the one slide in the deck that breaks the rule.
   Every other animated slide paints a canvas and has to be in step with
   the compositor; this one only inserts DOM nodes, so it gains nothing
   from rAF and loses a great deal: rAF is suspended whenever the browser
   decides the page is not visible, which in a presentation can mean a
   mirrored or extended display the OS thinks is occluded, a backgrounded
   window, or remote desktop. The failure is silent and total &mdash; a
   chat window that never says a word, with no error to find. Do not
   "tidy" this back to rAF.
   §7 leads with the **catch-up** case study (Qwen3.6 27B, Apr 2026, AA
   Intelligence Index 37, Apache 2.0, ~17 GB at 4-bit vs GPT-5 high,
   7 Aug 2025, index 35) before either un-runnable horizon example, so
   the section starts with something the room can actually download.

   > **Verified Aug 2026 against Artificial Analysis directly** — both scores
   > read from AA's own model pages: GPT-5 (high) **35** (proprietary, released
   > Aug 2025) and Qwen3.6 27B (Reasoning) **37** (open weights, Apr 2026). The
   > 27B does exceed it, so the slide's framing stands.
   >
   > A caution for the next refresh: an AA post quoting **GPT-5 (medium) at 42**
   > looks like it contradicts this, and does not — it is a different variant on
   > a differently-scoped leaderboard. AA rebases the index between versions and
   > scopes its rankings differently per page, so **read both numbers from one
   > snapshot on one day** and never mix a figure from a post with one from a
   > model page. The 37 is the *reasoning-mode* score; the slide says so.
7. ~~Post-run polish (Aug 2026), from feedback on the first delivery: the §0
   **definition slide**, the **glossary**, and the **light theme**.~~ The
   feedback that mattered was that the room could recite five reasons to run a
   local model before anyone had said what one *is* — so §0 is now "what it is,
   and why bother", and the definition is mechanical (a file, a runner, your
   memory) because every later section is about one of those three parts.
   Adding it forced a second full renumber of `src/slides/`, and splitting the
   old `02-why-bother.html` into a card file and a reasons file.
8. ~~The §2 **chat-template gotcha** and the three **closing slides**.~~ These were
   the last two things the plan named and the deck did not have. §2's is the
   only interactive in the deck whose subject is a *failure*, and the closers
   are what the deck ends on instead of the diffusion animation stopping.
9. Cover art polish.

## Tech constraints

- **Single-file *output*** (`index.html`). Vanilla JS + CSS. No React, no npm, no
  node_modules. The source lives in `src/` and is assembled by `build.py` — see
  "Source layout" below. The constraint that matters is the artifact, not the source:
  one file you can email, put on a USB stick, or open by double-clicking.
- Must work **offline** (the workshop may have bad wifi, and it's thematically on-brand).
  No CDN dependencies — inline everything.
- Works when opened as a `file://` URL.
- Keyboard navigation between sections (arrow keys), plus a visible section index.
- Readable when projected: large type, high contrast, dark theme default.
- Responsive enough that attendees can follow along on their own laptops.

## Source layout & build

```text
src/index.html          shell; everything else is spliced into it
src/css/NN-name.css     one file per component
src/js/NN-name.js       one file per feature
src/slides/NN-name.html one file per slide
src/assets/             logos/*.svg (one <symbol> each), mlx.png
src/posters/NN-name.html  one file per promo poster (A3)
src/posters/_poster.css   shared poster base; the _ keeps it out of the glob
build.py                stdlib only
index.html              BUILT, committed — never edit by hand
posters/*.html          BUILT, committed — never edit by hand
posters/*.pdf           BUILT on demand (--pdf), gitignored
dist/index.html         BUILT release, gitignored
```

```bash
python3 build.py
```

`--release` writes `dist/index.html` instead. Two directives, usable anywhere:
`<!--#include css/*.css -->` and `<!--#base64 assets/mlx.png -->`. Paths resolve
relative to `src/`, never to the including file. An include matching zero files is a
hard error — a silent no-op here would mean a slide quietly vanishing from the deck.

**The `NN-` prefixes are load-bearing.** Includes glob and sort by filename, so the
prefix *is* the cascade order for CSS, the execution order for JS, and the slide order
for the deck. Renaming without renumbering silently reorders the presentation — that
already happened once, when `01-sampling-cuts` sorted ahead of `01-temperature`.

The JS files are concatenated inside a single shared IIFE, so they behave exactly as
one script: `softmax` and friends are defined once and used across features. Don't add
a per-file IIFE, and don't assume a file is independently loadable.

## Posters

Three A3 promo posters for the event, built by the same script from
`src/posters/`. They are **not deck slides** and must never live in
`src/slides/` — that include is a glob, so a poster dropped there would be
spliced straight into the presentation as slide N.

```bash
python3 build.py --pdf
```

Each is a standalone single file, same as the deck, and they pull the deck's
tokens (`css/00-tokens.css`) and its inlined logos through the same
`#include` directives — so a palette or radius change lands on the posters
too, and nothing is fetched at runtime.

- `00-unplugged` — the cover, on paper. The three flagship configurations
  side by side instead of cross-fading, so the invariance (same 15 GB) is a
  comparison you can make with your eyes rather than your memory. The weight
  field is generated as **vector rects at load**, at `t = 0`: one frame,
  the same frame every print.
- `01-off-net` — "Intelligence, served off-net". Leads with the decode
  formula and prices it out on three memory pools (DRAM 96 / UMA 614 /
  VRAM 1792 GB/s ÷ the same 4.9 GB 8B). The measured-vs-ceiling gap is
  stated on the poster, not hidden.
- `02-in-your-lap` — the fit indicator, on paper. **The one poster where the
  warm range appears**, doing exactly the job it is reserved for: green
  fits, amber spills, red will not load. Nothing else on it is warm — which
  is why the 70B row gets a mono `70B` chip and not the (yellow) Hugging
  Face mark.

- `03-tensor` — near-wordless. The isometric composition every accelerator
  vendor draws: two operands, a core, and the stack of results underneath,
  built by a ~60-line block renderer (one projection, one painter's sort by
  `i + j + k`, three face shades). **The vendor version of this picture is
  green, and green here means "it fits"** — so the operands are neutral,
  the core is filled `--ink`, and only the output stack is cyan. Do not
  recolour it to match the reference. The SVG gets an explicit height and
  derives its width from the viewBox; left to size itself, its intrinsic
  viewBox size sets the box height instead of the reverse and the footer
  walks off the sheet. The wordmark sits *below* the art on this one.

Sizing is in **mm, not vw/vh** — a poster has exactly one size. `rem` is
pinned to `4.05mm` in `_poster.css`; that is the single dial for the lot.
The page box comes from CSS `@page`, so `--pdf` needs no paper-size flag to
keep in sync, and printing from a browser only needs *Background graphics*
ticked. Chrome is the renderer either way; `--pdf` just skips the dialog.

**No blurred `text-shadow` on a poster.** The deck's wordmark glows; the
posters' does not. Past a certain size Chrome's print-to-PDF stops
rasterising a blurred shadow and paints a **filled rectangle** over the type
instead — and it appears only in the PDF, never on screen or in a
`--screenshot`. It hit the 10.4rem wordmark on `03-tensor` while the smaller
ones on the other three came out fine, so there is no safe radius to tune to.
When checking a poster, look at the **PDF**, not just a screenshot of the
HTML (`sips -s format png x.pdf --out x.png`).

**Event details are placeholders** (`THU 00 MONTH`, `ROOM & BUILDING`) and
sit under a marked comment in each source. Edit those, rebuild, do not
hand-edit `posters/*.html`.

**Release mode does only provably-safe things:** strip comments, collapse CSS whitespace
to single spaces, and remove leading indentation from the JS. It deliberately leaves JS
*tokens and comments* untouched. No-npm means any minifier would be hand-rolled without a
parser, and the classic failure — an ASI bug or an eaten regex literal — would appear
*only* in the build you present from. Stripping JS comments would save a further ~35KB
and is not worth that risk.

De-indenting is safe for one specific reason, stated in `slim_js`: **no token in `src/js/`
spans a line boundary.** There are no template literals (every backtick in the tree sits
inside a comment) and no backslash line-continuations, so the start of a line is always
either whitespace or the start of a token, and newlines are preserved so ASI sees the
same line structure. **If you ever add a template literal to `src/js/`, delete `slim_js`**
— a multi-line `` `...` `` would have its indentation silently rewritten. Verify a release
by normalising leading whitespace on both builds' JS and diffing; they must be identical.
Release also leaves `--sans`/`--mono` differing from debug by whitespace inside the
custom-property token stream; every resolved property, including `font-family`, is
identical.

## Interactive elements to build (this is the point of using HTML)

These are the reason we're not using slides. Prioritize them.

### 1. Memory calculator (the centerpiece)
Sliders for **parameter count** (0.5B–70B) and **quantization** (16 / 8 / 4 / 2 bit),
outputting estimated model size in GB.

Must demonstrate the flagship example: **30B@4bit, 15B@8bit, and 7.5B@16bit all weigh
~15GB.** Consider a "compare three configs side by side" mode, or preset buttons that
snap the sliders to those three points.

Show both:
- the clean rule-of-thumb number (`params × bytes_per_param`)
- a "realistic" number (~4.5–4.8 effective bits for Q4_K_M, not exactly 4)

Teaching the gap between napkin math and what LM Studio actually reports **is** a lesson.

### 2. Fit-on-my-machine indicator
Let the user enter their available RAM/VRAM. The calculator colors green/amber/red:
fits in VRAM / fits but spills to system RAM / won't fit. Ties the abstract math to
their actual laptop.

### 3. Decode speed estimator
`decode tok/s ≈ memory bandwidth ÷ model size`

Slider or preset dropdown for hardware bandwidth, with real reference points:
- DDR5 system RAM: ~50–100 GB/s
- M-series unified memory: ~200–800 GB/s depending on tier
- consumer dGPU VRAM: ~500–1000 GB/s

Output theoretical tok/s, with an explicit note that real-world is meaningfully lower.
This is the single most important formula in the workshop — give it room.

### 4. Prefill vs decode visual — BUILT
An animation contrasting the two phases: prefill processes the whole prompt in parallel
(compute/FLOPS-bound), decode emits one token at a time (memory-bandwidth-bound).

This is what justifies the "Mac = great decode, meh prefill; big dGPU = great at both
but capacity-limited by VRAM" conclusion. Make the asymmetry visible, not just stated.

Built as a race between the same two machines as §3's fit/spill slide, on the **real
wall clock** — no slow-motion constant, because prefill and decode are both plain rates
and the honest thing is to make the room wait the nine seconds. Figures are for an 8B at
4-bit: RTX 5090 **10,400 tok/s prefill, 186 tok/s decode** (measured llama.cpp, Qwen3 8B
Q4 @ 4K, Jul 2026); M5 Max **~900 tok/s prefill, ~85 tok/s decode**. The Mac prefill
figure is the *conservative* end on purpose — sources for M5's neural accelerators range
from "+35–40% over M4 Max" to "3–4× on TTFT" depending entirely on whether the runtime
is MLX or llama.cpp, and llama.cpp does not use them yet. The slide says so on its face.
Decode ratio ~2.2×, prefill ratio ~11.6×: that gap *is* the slide.

### 5. KV cache growth chart
Plot total memory vs context length: **fixed weights (flat) + KV cache (linear) +
overhead.** A slider for context length that animates the growing bar.

Include a toggle or footnote for **GQA (grouped-query attention)**, which shrinks the KV
cache substantially versus the naive formula — so beginners who compute it the old way
will over-estimate.

### 6. Quantization quality cliff
A visual showing quality holding up reasonably down to ~4-bit, then falling off sharply
at 3-bit and 2-bit. The takeaway is "4-bit is the sweet spot," **not** "compress
infinitely." Q2 is not a free lunch.

§7's Bonsai slide is the deliberate exception to this, and has to be *framed* as one or
it simply contradicts the cliff. The cliff is a fact about **squashing a 16-bit model
after the fact**; Bonsai is trained at {-1, 0, +1} from the start, so there is nothing to
round away. Same 8B, four rows: fp16 16.4 GB, Q4_K_M 4.9 GB, Q2_K **3.4 GB** (still red,
still the cliff), Ternary Bonsai 1.75 GB.

Every row there must reconcile with the deck's own bits-per-weight table (§4's calculator
and the cliff chart): 8.19 B weights × bpw ÷ 8. Q2_K is 3.35 bpw, so it is 3.4 GB. It
said 2.8 GB until Aug 2026, which quietly undercut the arithmetic on the one slide whose
whole argument is that the arithmetic holds.

### 7. Autoregressive vs diffusion animation (closing section) — BUILT
Side-by-side: tokens appearing left-to-right one at a time, versus a block of masked
tokens being denoised in parallel over a few steps. Supports the DiffusionGemma segment.

512 tokens in both lanes, one shared 2.5x slow-motion divisor so the 4x on screen is
Google's published 4x. The diffusion block commits its cells in **shuffled** order over
16 denoise steps — resolving them left to right would draw exactly the picture the slide
is arguing against — and masked cells must read as clearly present, since "256 tokens
exist before any of them is decided" is half the point.

## Section structure (2 hours, in order)

The spine is: **win first → explain what they just felt → give them the one formula that
explains everything → horizon.**

| # | Section | Time | Notes |
|---|---------|------|-------|
| 0 | What it is, and why bother | 10m | Definition, then hook |
| 1 | First win — hands-on | 20m | Everyone gets a model running |
| 2 | What just happened + where models come from | 15m | |
| 3 | Hardware + the one formula | 20m | |
| 4 | Quantization + napkin math | 20m | |
| 5 | Context window & KV cache | 15m | |
| 6 | What small models are good and bad at | 10m | |
| 7 | The horizon | 10m | |

### 0. What it is, and why bother (10 min)
**Say what a local LLM is before saying why to run one.** The definition slide is
first: an open-weight model whose *inference* runs on hardware you own, and the three
parts that makes it — the weights file, the runner, your memory. It closes on the two
routes a sentence can take (cloud has two hops that local simply does not) and on
**open weights ≠ open source**, which is the misconception a hobbyist room arrives
with. Keep it mechanical; the reasons slide does the persuading.

Then lead with **privacy** (data never leaves the machine), **offline**, **no rate limits**,
**no subscription**, **full control** (swap/customize models).

> **Framing note — important.** An earlier draft opened with "intelligence is becoming
> restricted to governments, paywalls and censorship." Do **not** use that framing. It
> reads as doom/conspiracy and is easy to rebut (free-tier cloud AI is widely available),
> which loses a skeptical beginner in the first minute. "No censorship / no content
> filtering" survives as **one bullet among several**, not the thesis.

### 1. First win — hands-on (20 min)
Install LM Studio → download one small model (safe default: a 4B or 7B at Q4) → send one
message. Dopamine before theory.

**LM Studio, not LM Studio Bionic** (verified Jul 2026). Bionic is a *second, separate*
app from the same team — a local-first coding/document agent in the Claude Code / Codex
mould, built on top of open models. It is not a successor and does not replace the model
manager; the two are meant to coexist, and LM Studio remains the thing that downloads
and serves the weights. The download slide says this explicitly because the name invites
exactly the wrong guess.

The download slide's QR code is a committed asset (`src/assets/qr-lmstudio.svg`),
generated once with `segno` and verified by decoding the rendered code. It is *not*
generated at build time — the build stays stdlib-only. If the URL ever changes, the QR
has to be regenerated and re-verified, not hand-edited.

**Confirmed: every attendee brings their own laptop.** So §1 is a real hands-on exercise,
not a demo — which makes the pre-workshop install message **mandatory, not optional**, and
makes bandwidth the top live risk (N people downloading a multi-GB model over club wifi
simultaneously will not work; plan for USB sticks or a local mirror).

**This is where 80% of live failures happen.** Budget the buffer here and never cut it.

The pre-workshop "install this beforehand" checklist is **deliberately not a slide**
(decided Aug 2026). It has to reach people days before they are in the room, which is not
a job a slide in the deck can do — send it with the event reminder. §1's section card
carries a comment saying so, in place of the old `TO BUILD` marker.

Sampling (temperature, top-p, min-p) gets a ~2 minute aside here — where the knobs are
and what temperature does. Nothing deeper.

### 2. What just happened + where models come from (15 min)
- Hugging Face as the source; the **GGUF** format; who publishes quants (e.g. bartowski).
  Beginners get stuck here constantly.
- One sentence that LM Studio is a wrapper around **llama.cpp** (and **MLX** on Mac), so
  the tool isn't magic and alternatives exist: Ollama, Open WebUI, GPT4All.
- **Chat/prompt template gotcha — BUILT.** The wrong template produces bad output and it
  is an *invisible* failure: nothing errors, the text is just worse.

  Told as before-and-after **on the wire**: the left panel is the literal string handed
  to the model, coloured by whether each marker is a token this model owns (green) or
  one it has never seen (red); the right panel plays what comes back. One model
  (Gemma 3 1B, the §1 download), one prompt, six wrappings.

  The failures are **graded, not uniform** — that is the whole design, and picking six
  presets that all fail the same way would have taught nothing:

  | preset | what breaks |
  |--------|-------------|
  | Gemma 3 | nothing — the baseline the rest is measured against |
  | ChatML | markers not in the vocabulary shred into text; turn structure gone, system prompt ignored, answer drifts |
  | Llama 3 | same class, worse: the model starts *imitating* the marker-shaped text |
  | Mistral | `[INST]` is plain ASCII, tokenizes cleanly, and is read as part of the question |
  | No template | no generation prompt, so it **completes** your sentence instead of replying |
  | Wrong stop | right markers, foreign stop string — it answers, then plays both sides until the token limit |

  Two honesty constraints. The outputs are **illustrations of documented failure
  classes, not captured transcripts**, and the slide says so. And the framing has to
  stay accurate about *when* you meet this: the template lives in the GGUF metadata and
  LM Studio normally applies it, so the real triggers are a hand-overridden preset, an
  oddly converted GGUF, or the raw completion endpoint — not "LM Studio gets this wrong
  every day". Note also that Gemma genuinely has **no system role**; the app folds the
  system prompt into the first user turn, which is worth saying out loud.

### 3. Hardware + the one formula (20 min)
DRAM vs VRAM. dGPU vs SoC, with real examples: traditional PC + discrete GPU versus
Mac / Ryzen APU unified memory. **Two physical machines should be in the room** — they
behave very differently and teaching from only one gives a skewed mental model.

Then the through-line of the entire workshop:

- **Decode is memory-bandwidth bound:** `tok/s ≈ bandwidth ÷ model size`
- **Prefill is compute (FLOPS) bound** — the "thinking before the first token" phase

This explains why Macs punch above their weight for generation (high-bandwidth unified
memory) and why offloading to plain DDR5 feels like wading through mud.

### 4. Quantization + napkin math (20 min)
Centerpiece: the ~15GB trio (30B@4bit / 15B@8bit / 7.5B@16bit). Holding memory constant
while varying params-vs-precision is what makes "bigger-but-more-compressed usually wins"
land.

Also cover:
- rule of thumb vs reality (GGUF block scales/metadata → Q4_K_M ≈ 4.5–4.8 effective bits)
- the **4-bit floor** — quality cliffs at 3/2-bit

### 5. Context window & KV cache (15 min)
`total RAM = fixed weights + KV cache (linear in context) + overhead`

This is the linear-vs-nonlinear relationships section. Include the GQA nuance as a nice
"theory says X, but the model cheats" moment.

### 6. What small models are actually good and bad at (10 min)
- **Good:** summarizing, text transforms, RAG over your own documents, privacy-sensitive
  work, offline use.
- **Bad:** deep reasoning, long agentic tasks, fresh or obscure factual knowledge,
  hallucination-sensitive uses.

Purpose is expectation management — nobody should leave disappointed that their 7B isn't
a frontier cloud model.

The organising line for both columns is **bring the knowledge to the model**: everything
on the "good" list hands it the material, everything on the "bad" list asks it to supply
the material itself. That is one sentence a beginner can carry out of the room, and it
also explains why RAG over your own files beats "what do you know about …" by so much
more than the parameter count would suggest.

**Do not soften the right-hand column into a strawman, and do not let it become a dunk.**
Frontier models hallucinate on roughly 3–19% of fact-seeking questions depending on model
and task (2026 figures), and error compounds across a long run for everyone — a small
model just reaches the edge sooner and says nothing when it does. The slide's caveat says
this, and it is the difference between expectation management and discouragement.

**Scale-slide figures, verified Aug 2026.** Open weights, all vendor-published totals
with active-per-token in brackets: DeepSeek V4 Flash 284B (13B) and V4 Pro 1.6T (49B),
both Apr 2026; MiMo V2.5 Pro 1.02T (42B), Apr 2026; GLM-5.2 753B (40B), MIT, Jun 2026;
Kimi K3 2.8T (104B), Jul 2026, the largest open-weight release to date; earlier anchors
Llama 3.1 405B (Jul 2024) and DeepSeek V3 671B/37B (Dec 2024). Closed: GPT-3.5 175B
(from the GPT-3 paper) and GPT-4 ≈1.8T (2023 SemiAnalysis leak) are the only two
anywhere near confirmed. Everything after that is a band, not a number — see the build
order note above. **Do not turn the bands back into point estimates before presenting,
however tempting a single figure looks on a slide.**

### Closing (in §7, after the horizon)
Three slides, because the deck used to end on the diffusion animation simply stopping.

**"If you remember five things"** — the recap, in §0's own five-tile component so the
deck closes in the shape it opened in: it is a file / fit comes first / speed is
division / the 4-bit floor / bring the knowledge. Every tile is a `data-goto`, which
makes it the board to stand on during questions — someone asks about the cliff, you
press 04 and you are on the cliff.

**"Where to go next"** — the slide that stays up through Q&A, so it has to reward being
looked at for ten minutes: three things to do this week, the rabbit holes this deck
deliberately skipped (speculative decoding, embeddings/RAG internals, fine-tuning and
LoRA, serving a local API), and where to read. The **deck link is a placeholder**
(`[ LINK GOES HERE ]`) under a marked comment, like the posters' event details — fill it
in the source and rebuild.

**"Thank you"** — the cover reprised: same wordmark, same NO CLOUD / NO SUBSCRIPTION /
NO WI-FI strapline, one line of instruction and one line inviting questions. It carries
`data-noglossary`, because nothing on an end frame is being taught and a dotted underline
is an invitation to click one more thing.

### 7. The horizon (10 min)
Two examples, **both presenter-demo only** (see accuracy notes below):

**Bonsai (PrismML)** — natively-trained low-bit models, not post-hoc quantization.
- *1-bit Bonsai*: weights are only -1/+1 (no zero). 8B fits in ~1.15 GB and reportedly
  runs on an iPhone at ~40 tok/s.
- *Ternary Bonsai* (announced 16 Apr 2026): adds the zero back — {-1, 0, +1}, the true
  1.58-bit BitNet-style scheme. 8B scores ~5 points higher on average than 1-bit Bonsai
  for only ~600MB more (1.75 GB vs 1.15 GB). Apache 2.0.
- A 27B generation exists with vision and tool calling.
- **Catch — and this one moved under us, twice.** The original note said no mainstream
  engine could load it at all. Re-checked against `PrismML-Eng/Bonsai-demo` (Aug 2026),
  that is now out of date, and the honest position is narrower:
  - 1-bit `*-Q1_0.gguf` is **merged upstream** — "works out of the box" on CPU, Metal,
    CUDA and Vulkan.
  - Ternary ships in **two** builds. `*-Q2_0_g64.gguf` (group 64) is the format the repo
    calls "the official llama.cpp format": CPU, Metal and Vulkan **merged in mainline**,
    CUDA still "in review upstream". The older group-128 `*-Q2_0.gguf` is fork-only.
  - `*-PQ2_0.gguf` is announced and not yet supported anywhere.
  - The repo says **nothing about LM Studio or Ollama**, so neither does the slide.
    Whether a given LM Studio ships a new-enough llama.cpp is a version question — check
    the machine you will present from, and check it again on the night.

  **Corrected again, Aug 2026 — and this time the vendor contradicts itself.** PrismML's
  own `docs.prismml.com/download/formats` now states that ternary `Q2_0` **requires the
  fork**, that **Vulkan is not available at all**, and that "current Ollama releases
  cannot run ternary Q2_0 yet" — while the `Bonsai-demo` README still claims group-64 is
  merged into mainline. Only **1-bit `Q1_0` is unambiguously upstream** (CPU, Metal, CUDA
  and Vulkan). The slide now says exactly that: 1-bit runs anywhere recent, ternary is
  unsettled, and the two vendor pages disagree. Do not "resolve" the disagreement in
  either direction without a fresh check — that is the third time this fact has moved.

  The teaching point survives the correction and is better for it: the catch is no longer
  "impossible", it is "which build, which backend, which version" — which is a truer
  picture of running frontier formats than the original absolute was.
  **Re-verify this section before every delivery.** It has been wrong in both directions
  now, and the §7 slide copy has to move with it.
- Published throughput, for the §7 slide's honesty note: 82 tok/s on an M4 Pro, 27 tok/s
  on an iPhone 17 Pro Max — about half of what `bandwidth ÷ size` predicts, which is the
  normal ratio and worth saying out loud.

**DiffusionGemma (Google DeepMind, 10 Jun 2026)** — generates text by denoising blocks of
256 tokens in parallel rather than one token at a time. Reported >1,000 tok/s on a single
H100. A 26B-class MoE with ~3.8B active parameters per step. Apache 2.0, weights on
Hugging Face.
- **Catch — corrected Aug 2026.** Two of the three original claims did not survive
  checking. There *is* a hosted way to try it (Vertex AI Model Garden, plus Kaggle and
  Hugging Face, and native vLLM support), so "no hosted API" is gone. "Quality below
  standard Gemma 4" is **unsourced** — Google's own page makes no such claim and
  third-party coverage reports parity with Gemma 4 26B-A4B at 4x the speed; the slide no
  longer asserts it. What remains, and is the real catch, is the hardware.
- On memory, say *whose* ceiling. The **24 GB** figure is a direct quote of Google
  ("the 24GB VRAM limits of a consumer RTX 5090 or 4090 when quantized") and Google are
  loose there: a 5090 actually ships **32 GB**, which is what §3's demo PC has. So the
  slide says "a 4090-class card" rather than naming the 5090, or an attentive attendee
  catches the contradiction with the slide two sections back.

**The closing beat:** *both* examples being un-runnable in LM Studio today is the point —
"everything you learned about bytes-per-parameter is already being rewritten; come back
in six months." Framed as inspiring horizon tech, explicitly **not** tonight's download.

## Accuracy notes for whoever writes this content

- These are fast-moving releases. **Verify names, dates and numbers before presenting**
  rather than trusting anything hardcoded here.
- Do not confuse **DiffusionGemma** (open weights, June 2026, Gemma 4 based) with
  **Gemini Diffusion** (Google's closed research demo shown at I/O in May 2025). At least
  one source online conflates them and mis-dates DiffusionGemma to 2025 / Gemma 2.
- Bandwidth and tok/s figures are order-of-magnitude teaching aids. Label them as
  estimates in the UI, not as benchmarks.

## Cut order if running long

1. **Cut §7's Bonsai slide.** §7 carries seven slides for ten minutes, at the end of a
   two-hour session — it is where the overrun actually lands, and Bonsai is the one beat
   §7 can lose without breaking: the catch-up slide already makes the "open is closing
   the gap" case, and diffusion is the closing image. §5, by contrast, is already the
   thinnest section in the deck at three slides for fifteen minutes.
2. Trim §5 (KV cache) to just the one-line formula.
3. Make §4's math a live demo rather than worked through by hand.
4. **Never cut §1's buffer.** Install problems are the single biggest schedule risk.

Explicitly deferred to "further reading," not built into the main flow:
**speculative decoding** (conceptually heavy, doesn't earn its minutes for beginners),
deep sampling internals, runtime internals beyond the one-sentence llama.cpp/MLX mention.

## Open questions not yet resolved

- Audience **size** (headcount). Every attendee brings a laptop — see below.

**Resolved — the §1 download.** Attendees take a **1B-class model**: Gemma 3 1B or
LFM2.5 1.2B, both flagged RECOMMENDED. Both are under 750MB, which downloads in minutes
over shared wifi and leaves the laptop responsive. **Qwen3.5 9B is presenter-demo only**
and badged as such, so the room sees what a bigger model buys without thirty people
trying to pull 5.6GB at once. Note that its **reasoning is off by default** (it needs
`enable_thinking`) — the slide used to say it "thinks before answering", which described
something a fresh download does not do. Qwen3 4B stays on the slide as an unbadged middle option
to take home. This overrides the older "safe default: a 4B or 7B at Q4" note — bandwidth
in the room beat model quality.
- Whether the presenter is solo or co-teaching with someone whose hardware covers the
  other of dGPU / SoC.
