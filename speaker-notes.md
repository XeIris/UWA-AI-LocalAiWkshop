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

Sampling gets roughly two minutes here: where temperature lives, what it does, leave it
at the default. Nothing deeper.

## Section 2 — What just happened

- Hugging Face is the source; GGUF is the format; people like bartowski publish the
  quants. Beginners get stuck at exactly this step.
- One sentence: LM Studio wraps llama.cpp (and MLX on Mac). The tool is not magic and
  alternatives exist — Ollama, Open WebUI, GPT4All.
- **Chat template gotcha.** Wrong template produces garbage, and nothing errors. The
  failure is invisible, which is what makes it worth the minute.

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
