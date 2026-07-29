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
badge. Do not add a fourth hue without a reason this specific.

**Type:** system font stack (no CDN, no embedded webfont). Sans for prose, monospace for
every number, formula, label and eyebrow. Root font-size scales off `min(vw, vh)` so the
deck is legible both projected at 1080p and on an attendee's 13" laptop.

**Motion:** slide-to-slide is a pure ~260ms opacity fade, nothing else. Within a slide,
**an animation must encode a variable, never decorate one** — if it moves, it is showing
a quantity changing. Respect `prefers-reduced-motion`.

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
5. §6 / §7 content, cover art polish.

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
build.py                stdlib only
index.html              BUILT, committed — never edit by hand
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

**Release mode does only provably-safe things:** strip comments, collapse CSS whitespace
to single spaces. It deliberately leaves JavaScript untouched. No-npm means any minifier
would be hand-rolled without a parser, and the classic failure — an ASI bug or an eaten
regex literal — would appear *only* in the build you present from. Not worth ~6KB.
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

### 4. Prefill vs decode visual
An animation contrasting the two phases: prefill processes the whole prompt in parallel
(compute/FLOPS-bound), decode emits one token at a time (memory-bandwidth-bound).

This is what justifies the "Mac = great decode, meh prefill; big dGPU = great at both
but capacity-limited by VRAM" conclusion. Make the asymmetry visible, not just stated.

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

### 7. Autoregressive vs diffusion animation (closing section)
Side-by-side: tokens appearing left-to-right one at a time, versus a block of masked
tokens being denoised in parallel over a few steps. Supports the DiffusionGemma segment.

## Section structure (2 hours, in order)

The spine is: **win first → explain what they just felt → give them the one formula that
explains everything → horizon.**

| # | Section | Time | Notes |
|---|---------|------|-------|
| 0 | Why bother? | 10m | Hook |
| 1 | First win — hands-on | 20m | Everyone gets a model running |
| 2 | What just happened + where models come from | 15m | |
| 3 | Hardware + the one formula | 20m | |
| 4 | Quantization + napkin math | 20m | |
| 5 | Context window & KV cache | 15m | |
| 6 | What small models are good and bad at | 10m | |
| 7 | The horizon | 10m | |

### 0. Why bother? (10 min)
Lead with **privacy** (data never leaves the machine), **offline**, **no rate limits**,
**no subscription**, **full control** (swap/customize models).

> **Framing note — important.** An earlier draft opened with "intelligence is becoming
> restricted to governments, paywalls and censorship." Do **not** use that framing. It
> reads as doom/conspiracy and is easy to rebut (free-tier cloud AI is widely available),
> which loses a skeptical beginner in the first minute. "No censorship / no content
> filtering" survives as **one bullet among several**, not the thesis.

### 1. First win — hands-on (20 min)
Install LM Studio → download one small model (safe default: a 4B or 7B at Q4) → send one
message. Dopamine before theory.

**Confirmed: every attendee brings their own laptop.** So §1 is a real hands-on exercise,
not a demo — which makes the pre-workshop install message **mandatory, not optional**, and
makes bandwidth the top live risk (N people downloading a multi-GB model over club wifi
simultaneously will not work; plan for USB sticks or a local mirror).

**This is where 80% of live failures happen.** Budget the buffer here and never cut it.
Include a slide with a pre-workshop "install this beforehand" checklist that can be sent
out in advance.

Sampling (temperature, top-p, min-p) gets a ~2 minute aside here — where the knobs are
and what temperature does. Nothing deeper.

### 2. What just happened + where models come from (15 min)
- Hugging Face as the source; the **GGUF** format; who publishes quants (e.g. bartowski).
  Beginners get stuck here constantly.
- One sentence that LM Studio is a wrapper around **llama.cpp** (and **MLX** on Mac), so
  the tool isn't magic and alternatives exist: Ollama, Open WebUI, GPT4All.
- **Chat/prompt template gotcha:** the wrong template produces garbage output, and it's
  an *invisible* failure — nothing errors, the text is just bad. High value, low effort.

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

### 7. The horizon (10 min)
Two examples, **both presenter-demo only** (see accuracy notes below):

**Bonsai (PrismML)** — natively-trained low-bit models, not post-hoc quantization.
- *1-bit Bonsai*: weights are only -1/+1 (no zero). 8B fits in ~1.15 GB and reportedly
  runs on an iPhone at ~40 tok/s.
- *Ternary Bonsai* (announced 16 Apr 2026): adds the zero back — {-1, 0, +1}, the true
  1.58-bit BitNet-style scheme. 8B scores ~5 points higher on average than 1-bit Bonsai
  for only ~600MB more (1.75 GB vs 1.15 GB). Apache 2.0.
- A 27B generation exists with vision and tool calling.
- **Catch:** mainstream engines don't support 1-bit weights yet — it will *not* load in
  LM Studio or stock llama.cpp. Requires PrismML's own demo repo.

**DiffusionGemma (Google DeepMind, 10 Jun 2026)** — generates text by denoising blocks of
256 tokens in parallel rather than one token at a time. Reported >1,000 tok/s on a single
H100. A 26B-class MoE with ~3.8B active parameters per step. Apache 2.0, weights on
Hugging Face.
- **Catch:** ~18 GB VRAM even quantized, quality below standard Gemma 4, no hosted API.
  Above the beginner hardware ceiling.

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

1. Trim §5 (KV cache) to just the one-line formula.
2. Make §4's math a live demo rather than worked through by hand.
3. **Never cut §1's buffer.** Install problems are the single biggest schedule risk.

Explicitly deferred to "further reading," not built into the main flow:
**speculative decoding** (conceptually heavy, doesn't earn its minutes for beginners),
deep sampling internals, runtime internals beyond the one-sentence llama.cpp/MLX mention.

## Open questions not yet resolved

- Audience **size** (headcount). Every attendee brings a laptop — see below.

**Resolved — the §1 download.** Attendees take a **1B-class model**: Gemma 3 1B or
LFM2.5 1.2B, both flagged RECOMMENDED. Both are under 750MB, which downloads in minutes
over shared wifi and leaves the laptop responsive. **Qwen3.5 9B is presenter-demo only**
and badged as such, so the room sees what a bigger model buys without thirty people
trying to pull 5.6GB at once. Qwen3 4B stays on the slide as an unbadged middle option
to take home. This overrides the older "safe default: a 4B or 7B at Q4" note — bandwidth
in the room beat model quality.
- Whether the presenter is solo or co-teaching with someone whose hardware covers the
  other of dGPU / SoC.
