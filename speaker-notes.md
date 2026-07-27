# Speaker notes — AI, Unplugged

Presenter-only. **Nothing in this file belongs on a slide.** Timings, warnings and
what-to-say live here so the deck stays readable from the back of the room.

## Running order

Total 120 minutes. The clock is the presenter's problem, not the audience's.

| # | Section | Budget | Running total |
|---|---------|-------:|--------------:|
| 0 | Why bother? | 10m | 0:10 |
| 1 | First win — hands-on | 20m | 0:30 |
| 2 | What just happened | 15m | 0:45 |
| 3 | Hardware + the one formula | 20m | 1:05 |
| 4 | Quantization + napkin math | 20m | 1:25 |
| 5 | Context window & KV cache | 15m | 1:40 |
| 6 | Good at / bad at | 10m | 1:50 |
| 7 | The horizon | 10m | 2:00 |

No buffer is built into that table. In practice §1 will eat 30 minutes, so treat the
back half as compressible and know the cut order before you start.

### Cut order if running long

1. Trim §5 to the one-line formula only.
2. Make §4's math a live demo instead of working it through by hand.
3. **Never cut §1's buffer.** Install problems are the biggest schedule risk in the room.

### Checkpoints

- **0:30** — if not everyone has sent a message to a local model, stop advancing and
  fix it. Everything after this point assumes the hands-on worked.
- **1:05** — if §3 has not landed, §4 and §5 will not either; they both build on
  `tok/s ≈ bandwidth ÷ model size`.

## Section 0 — Why bother?

Five keys on the slide, one clause each. You supply the rest.

- **Privacy** — your notes, client data, medical questions. No request is made, so
  there is nothing to log, leak or subpoena. This is the strongest reason for most
  people in the room; give it the most air.
- **Offline** — no network, no outage, no "service is at capacity." The model is a
  file on disk.
- **No limits** — run it all night over ten thousand documents. Cost is electricity.
- **Control** — different model for different jobs, fine-tune one, and keep a version
  that can't be deprecated out from under you.
- **Unfiltered** — fiction, security research, medicine. Hosted models refuse
  legitimate work in all three. Say it once, move on; it is one reason among five,
  not the thesis.

**Do not** open with "intelligence is being restricted to governments and paywalls."
It reads as conspiracy, it is trivially rebutted by free-tier cloud AI, and it loses a
skeptical beginner inside the first minute.

## Section 1 — First win

The pre-workshop install email is **mandatory**, not a nicety. Every attendee brings a
laptop, which makes the network the single point of failure.

**Top live risk:** N people downloading a multi-GB model over club wifi at the same
moment. This does not work. Mitigate before the day:

- Model pre-downloaded as part of the install email (best, if people comply).
- USB sticks with the GGUF, passed around (reliable, needs prep).
- Local mirror on the presenter machine (fastest, needs setup and testing).

Assume some fraction turn up with nothing installed. Have a plan for them that does not
stall the other 90% of the room.

### The four models on the picker slide

All figures are the published 4-bit builds, pulled from the Hugging Face API. Re-check
before the workshop — quant repos get re-uploaded.

| Model | Params | MLX 4-bit | GGUF Q4 | Comfortable in |
|---|---|---|---|---|
| Gemma 3 (Google) | 1B | 730 MB | 720 MB (Q4_0, QAT) | ~1.5 GB |
| LFM2.5 (Liquid AI) | 1.2B | 660 MB | 730 MB | ~1.5 GB |
| **Qwen3 (default pick)** | 4B | 2.3 GB | 2.5 GB | ~4 GB |
| Qwen3.5 | 9B | 6.0 GB | 5.6 GB | ~8 GB |

**Say out loud that MLX is Apple-silicon only.** It is the single most common confusion
on this slide — a Windows attendee will otherwise download an MLX build and wonder why
nothing loads.

"Comfortable in" is weights plus room for context, not the raw file size. It is
deliberately more generous than LM Studio's own "minimum system memory" figure, which
for Qwen3-4B reads 2 GB — *below* the 2.5 GB file it is describing. Do not quote LM
Studio's number; it assumes a tiny context and will strand people.

Gemma 3 1B is quantization-aware trained, which is a nice forward reference to §4: it
was trained expecting to be squeezed, so it holds up at 4-bit better than a model
quantized after the fact.

### Sampling — two slides, roughly two minutes

Do not teach the maths. Drive the sliders and narrate what moves.

- **Temperature.** Drag to 0.15: one bar eats everything, "the model will say *orange*
  every single time." Drag to 2.0: the field levels out, "now *blue* gets a turn, and
  that is where nonsense comes from." Land on ~1.0 and move on.
- **Top-p vs min-p.** The lesson is the contrast, not either mechanism. Top-p counts
  area from the left; min-p sets a height floor relative to the best token. Then hit
  the Confident/Torn toggle — min-p keeps 1 candidate when the model is sure and 8 when
  it is torn, while top-p cannot tell the difference. That adaptivity is the whole
  reason min-p exists.

The numbers on both slides are real softmax over hand-picked scores, so they are
internally consistent if someone checks your arithmetic. The *scenario* is invented.

If short on time, cut the top-p/min-p slide entirely and leave temperature. Tell them
where the sliders live in LM Studio and that the defaults are fine.

## Section 2 — What just happened

Three slides: provenance, engines, alternatives.

- **Provenance.** Hugging Face is the source, GGUF is the format, and community
  packagers (bartowski, lmstudio-community, mlx-community) publish the quants — model
  authors usually do not. The point beginners miss: one model name produces dozens of
  files, and choosing among them is the actual skill.
- **Engines.** LM Studio is a face on top of llama.cpp, or MLX on a Mac. Worth one
  sentence so nobody thinks the app is the magic. It also sets up §3 — MLX exists
  because unified memory behaves differently, which is the whole hardware section.
- **Alternatives.** Ollama, Open WebUI, GPT4All. Emphasise that all of them load the
  same GGUF files, so switching costs nothing but a re-download they have already done.
- **Chat template gotcha.** Wrong template produces garbage, and nothing errors. The
  failure is invisible, which is what makes it worth the minute. *Still to build.*

## Section 3 — Hardware + the one formula

Two physical machines in the room if at all possible. A discrete-GPU PC and a Mac or
Ryzen APU behave completely differently, and teaching from only one gives a skewed
mental model.

- Decode is **memory-bandwidth bound**: `tok/s ≈ bandwidth ÷ model size`.
- Prefill is **compute bound** — the pause before the first token.

That asymmetry is what makes Macs punch above their weight for generation, and what
makes offloading to plain DDR5 feel like wading through mud.

Every tok/s number on the slide is an order-of-magnitude teaching aid. Say so out loud.
Someone will benchmark it afterwards and find you optimistic.

## Section 4 — Quantization

The centrepiece is the ~15GB trio: 30B@4bit, 15B@8bit, 7.5B@16bit. Holding memory
constant while trading parameters against precision is what makes
"bigger-but-more-compressed usually wins" actually land.

Also cover the gap between napkin math and reality — GGUF block scales and metadata put
Q4_K_M nearer 4.5–4.8 effective bits — and the 4-bit floor, where quality cliffs at 3
and 2 bit. Q2 is not a free lunch.

## Section 5 — Context & KV cache

`total = fixed weights + KV cache (linear in context) + overhead`

The GQA nuance is a good "theory says X, but the model cheats" beat: grouped-query
attention shrinks the cache substantially versus the naive formula, so anyone computing
it the old way over-estimates.

## Section 6 — Good at / bad at

Pure expectation management. Good: summarizing, text transforms, RAG over your own
documents, privacy-sensitive and offline work. Bad: deep reasoning, long agentic tasks,
fresh or obscure facts, anything hallucination-sensitive.

Nobody should leave disappointed that their 7B is not a frontier model.

## Section 7 — The horizon

Presenter demo only — neither example runs on attendee hardware, and that is the point.

**Verify every name, date and number in this section before presenting.** These are
fast-moving releases and the figures below will drift.

- **Bonsai (PrismML)** — natively-trained low-bit, not post-hoc quantization. 1-bit is
  -1/+1 with no zero; ternary adds the zero back for the true 1.58-bit BitNet scheme.
  Will *not* load in LM Studio or stock llama.cpp.
- **DiffusionGemma (Google DeepMind)** — denoises blocks of tokens in parallel instead
  of emitting one at a time. Needs ~18GB VRAM even quantized, so it is above the
  beginner hardware ceiling.

Do not confuse DiffusionGemma with **Gemini Diffusion**, the closed research demo from
I/O 2025. At least one source online conflates them and mis-dates the release.

**Closing beat:** both examples being un-runnable tonight *is* the message. Everything
they just learned about bytes-per-parameter is already being rewritten. Come back in
six months.
