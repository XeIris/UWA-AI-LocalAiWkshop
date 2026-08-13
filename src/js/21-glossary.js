/* ==========================================================
   GLOSSARY
   A beginner hits eight unfamiliar nouns before §1 is over, and the
   presenter cannot stop for each one. Every term below is marked in
   the prose with a faint dotted underline and defines itself in place
   on click.

   Terms are marked BY A PASS OVER THE DOM, not by hand in the slide
   source. Thirty-odd slides written by hand would drift the moment a
   sentence was reworded, and marking is exactly the kind of work that
   should not be someone's job. The pass is deliberately timid:

     - prose containers only (see PROSE) — never a heading, a readout,
       a control or a canvas label, where an underline would read as
       part of the number;
     - one mark per definition per slide, so a slide that says
       "quantization" six times gets one dotted word, not a rash — and
       "open weights" does not mark twice under two spellings;
     - PER_SLIDE marks at most, because past half a dozen the treatment
       stops reading as faint and starts reading as a page of links;
     - the budget is spent in READING ORDER, not in order of term
       length. It used to be the latter, and that is what made the
       marking look arbitrary from the back of the room: whichever six
       glossary keys happened to be longest took the slide, so a
       beginner met "mixture of experts" underlined and "token", four
       words earlier, not. Now the first six terms a reader actually
       reaches are the six that answer. Where two terms start at the
       same character the longer still wins, so "memory bandwidth"
       beats "bandwidth" and "KV cache" beats "cache";
     - anything inside [data-noglossary], or inside a link, is left
       alone — a dotted word inside an anchor is two things to click
       occupying one word, and nesting a button in an <a> is invalid
       besides.

   Which terms lost the budget on which slide is not something to guess
   at: 23-glossary-audit.js reports it, along with terms defined and
   never used and jargon used and never defined. Open the deck with
   ?audit, or run tools/glossary-audit.py.

   Definitions are one sentence, in the deck's own terms, and say what
   the thing IS rather than why it matters — the slide is already doing
   the second job.
   ========================================================== */

/* term -> { d: definition, s: section to jump to, t: tier,
             vs: [[thing, how it differs], ...] }

   TIER. Everything defaults to tier 1 — the deck's own subject
   vocabulary, the words it exists to teach. Tier 2 (t: 2) is general
   computing: bit, RAM, GPU, API, licence. They are in here because the
   room is a hobbyist club and not a CS cohort, and the terms that need
   defining are never the ones that feel advanced to whoever wrote the
   slide — but they must not take the marking budget away from the
   deck's own words. A slide spends its budget on tier 1 first and only
   then, with whatever is left, on tier 2.

   The "not the same as" list is the half people actually need. Nearly
   every wrong mental model in this room is a COLLISION between two
   neighbouring words — quantization with distillation, the context
   window with memory, fine-tuning with RAG, llama.cpp with Llama — and
   a definition that only says what a thing is leaves the collision
   intact. Where a term has a famous twin, name the twin. */
var GLOSSARY = {
  'llm': { s: 0,
    d: 'Large language model. Given some text, it predicts what token comes next; run that over and over and you get a paragraph. Everything else — chat, summarising, code — is that one trick wrapped in a template.' },

  'local llm': { s: 0,
    d: 'A language model whose weights you hold and whose inference runs on your own hardware. No account, no request leaving the machine, and no version change unless you choose one.',
    vs: [['A smaller/dumber model', 'Local is about WHERE it runs, not how good it is. The size limit comes from your memory, not from the idea.']] },

  'weights': { s: 0,
    d: 'The numbers inside a model — billions of them, learned during training and then frozen. A model file is essentially nothing but weights, which is why its size in gigabytes is just a count of weights times the bits each one is stored in.',
    vs: [['Your data', 'Nothing you type is written back into them. The file is identical after a year of use.']] },

  'open weights': { s: 0,
    d: 'The finished weights are published for anyone to download, run, inspect and fine-tune.',
    vs: [['Open source', 'The training data and the code that produced the weights usually stay private, and the license can still restrict commercial use or outputs. Read the model card.']] },
  'open-weight': { s: 0,
    d: 'The finished weights are published for anyone to download, run, inspect and fine-tune.',
    vs: [['Open source', 'The training data and the code that produced the weights usually stay private, and the license can still restrict commercial use or outputs. Read the model card.']] },

  'inference': { s: 0,
    d: 'Running a trained model to get an answer out of it — the only half of the job your laptop is doing here.',
    vs: [['Training', 'Making the weights in the first place: thousands of GPUs, weeks, and millions of dollars. Nothing you do in LM Studio changes a weight.']] },

  'parameters': { s: 4,
    d: 'The weights, counted rather than described. "8B" means eight billion of them, and that count is the first half of every memory calculation in this deck.',
    vs: [['Active parameters', 'In a mixture-of-experts model only a slice runs per token. The active count sets the speed; the total still sets the memory.']] },
  /* Singular as an alias, not an entry of its own: the deck writes
     "parameters" in prose and "parameter" only inside compounds like
     "active-parameter", which the pass will not mark. */
  'parameter': { s: 4,
    d: 'The weights, counted rather than described. "8B" means eight billion of them, and that count is the first half of every memory calculation in this deck.',
    vs: [['Active parameters', 'In a mixture-of-experts model only a slice runs per token. The active count sets the speed; the total still sets the memory.']] },

  'token': { s: 1,
    d: 'The chunk of text a model reads and writes — roughly three quarters of a word in English, so a common word is one token and an unusual one is three or four.',
    vs: [['A word', 'Close enough for estimating, wrong for arithmetic. Context limits, speeds and prices are all counted in tokens, never words.']] },
  'tokens': { s: 1,
    d: 'The chunks of text a model reads and writes — roughly three quarters of a word in English, so a common word is one token and an unusual one is three or four.',
    vs: [['Words', 'Close enough for estimating, wrong for arithmetic. Context limits, speeds and prices are all counted in tokens, never words.']] },
  'tokenizer': { s: 1,
    d: 'The lookup table that cuts your text into tokens and turns them back afterwards. Every model ships its own, which is why a token count differs slightly between models.' },

  'temperature': { s: 1,
    d: 'The sampling knob that flattens or sharpens the probability distribution before a token is drawn from it. Near 0 it always takes the most likely token; higher, and unlikely ones get a real chance.',
    vs: [['Creativity or intelligence', 'It changes nothing about what the model knows. High temperature is not a better writer, just a less predictable one.']] },
  'top-p': { s: 1,
    d: 'Keep the most likely tokens until their probabilities add up to p, then sample from just those — so the tail gets cut, and how much of it depends on how confident the model is.',
    vs: [['Temperature', 'Temperature reshapes the whole distribution; top-p deletes part of it. They are usually used together.']] },
  'min-p': { s: 1,
    d: 'Discard any token less likely than a set fraction of the best one. Adapts to the model’s confidence: strict when it is sure, generous when it is not.' },
  'sampling': { s: 1,
    d: 'Choosing the next token from the distribution the model produced. The model never picks a word — it produces probabilities for every token in the vocabulary, and the sampler picks.' },

  'system prompt': { s: 1,
    d: 'A standing instruction placed before the conversation, setting the model’s role, tone and rules. LM Studio lets you edit it per model.',
    vs: [['The chat template', 'The system prompt is WHAT you say. The template is HOW it gets wrapped in the markers the model was trained on. A wrong template can make a perfect system prompt invisible.']] },
  'chat template': { s: 2,
    d: 'The exact markers and punctuation a model was trained to see around a conversation — who is speaking, where a turn ends, where the model should start writing. It normally lives in the GGUF’s metadata and the app applies it for you.',
    vs: [['The system prompt', 'That is the content. This is the envelope, and the wrong envelope fails silently: no error, just fluent output that stops obeying you.']] },

  'hugging face': { s: 2,
    d: 'The site nearly every open-weight model is published on. A "model card" is a repo — a folder of files, a license and some usage notes — not a product page.' },
  'gguf': { s: 2,
    d: 'The single-file model format llama.cpp reads: weights, tokenizer, chat template and metadata in one file you can copy to a USB stick. Quantized builds are distributed this way.',
    vs: [['safetensors', 'The full-precision format models are published in first. A GGUF is usually converted and quantized FROM safetensors.'],
         ['GGML', 'The older format GGUF replaced in 2023. Old links and old blog posts still say GGML; the file will not load.']] },
  'llama.cpp': { s: 2,
    d: 'The C++ inference engine most local apps are built on, LM Studio and Ollama included. No dependencies, runs on anything from a Raspberry Pi to a server, and reads GGUF.',
    vs: [['Llama', 'Meta’s family of models. The engine is named after them but runs almost every open model, and you never have to touch a Llama to use it.']] },
  'mlx': { s: 2,
    d: 'Apple’s array framework, built around unified memory. Meaningfully faster than llama.cpp on Apple silicon, and useless anywhere else — it has its own model format, so you download a different file.' },
  'lm studio': { s: 1,
    d: 'The desktop app used in this workshop: it finds models, downloads them, and runs them through llama.cpp or MLX behind a chat window.',
    vs: [['LM Studio Bionic', 'A separate app from the same team — a local coding and document agent. It is not a newer LM Studio and does not replace the model manager. The name invites exactly the wrong guess.']] },
  'ollama': { s: 2,
    d: 'A command-line-first model runner, also built on llama.cpp. Popular for serving a model to other programs rather than chatting with it yourself.',
    vs: [['Open WebUI', 'A browser front end with no engine of its own — it needs Ollama or something like it behind it.']] },

  'quantization': { s: 4,
    d: 'Storing each weight in fewer bits — 16 down to 8, 4 or 2 — so the file shrinks and the whole model can be read from memory faster. The model gets a little worse in a way that is nearly free down to about 4 bits, and expensive below it.',
    vs: [['Distillation', 'Training a smaller model to imitate a bigger one. That makes a NEW model; quantization keeps the same one and rounds it.'],
         ['Zipping the file', 'A quantized model is smaller in memory while it runs, which is the whole point. A zip has to be unpacked back to full size first.']] },
  'quantized': { s: 4,
    d: 'Stored at reduced precision: fewer bits per weight, a smaller file, and a small loss of quality that is negligible at 4 bits and severe at 2.' },
  /* Plurals as aliases, for the same reason "tokens" is one. The regex
     ends a term at a word boundary, so the entry does NOT cover its own
     plural — and the deck writes "dozens of files at different
     quantizations", which is where a beginner actually meets the word.
     Until these existed that sentence went unmarked on a slide with two
     spare slots in its budget. */
  'quantizations': { s: 4,
    d: 'Storing each weight in fewer bits — 16 down to 8, 4 or 2 — so the file shrinks and the whole model can be read from memory faster. The model gets a little worse in a way that is nearly free down to about 4 bits, and expensive below it.',
    vs: [['Distillation', 'Training a smaller model to imitate a bigger one. That makes a NEW model; quantization keeps the same one and rounds it.'],
         ['Zipping the file', 'A quantized model is smaller in memory while it runs, which is the whole point. A zip has to be unpacked back to full size first.']] },
  'quant': { s: 4,
    d: 'One quantized build of a model, named for its scheme — Q4_K_M, Q8_0, IQ4_XS. One model produces dozens of them, and picking the right one is the skill.' },
  'quants': { s: 4,
    d: 'One quantized build of a model, named for its scheme — Q4_K_M, Q8_0, IQ4_XS. One model produces dozens of them, and picking the right one is the skill.' },
  'q4_k_m': { s: 4,
    d: 'The usual 4-bit build, and the default recommendation. "K" is the block-scale scheme, "M" the medium variant that keeps a few sensitive tensors at higher precision.',
    vs: [['Exactly 4 bits', 'It averages about 4.83 bits per weight once the per-block scales are counted — which is why the download is bigger than the napkin says.']] },
  'bits per weight': { s: 4,
    d: 'The real average storage cost of one weight, block scales and metadata included — the honest version of "4-bit", and the number that makes a download page agree with your arithmetic.' },
  /* The deck uses "block" in two unrelated senses, four sections apart,
     and a definition that picked one would be wrong on the other slide.
     Naming both is the honest version, and the collision is exactly what
     the "not the same as" half of an entry is for. */
  'block': { s: 4,
    d: 'A small run of weights — 32 or 256 of them — that share one full-precision multiplier inside a quantized file. Those shared scales are the whole reason a "4-bit" model is really 4.83 bits per weight.',
    vs: [['A block of tokens', 'Section 07’s diffusion models denoise a block of 256 TOKENS at once. Same word, different thing entirely: one is a chunk of the file, the other a chunk of the answer.']] },

  /* "Typically 5–10x", not a single figure: the honest range. The two
     machines in §3 happen to be 1792 against 96, which is nearer 19x,
     but that is one desktop pairing — a laptop dGPU against fast DDR5
     can be five, and quoting either end as THE number would make the
     glossary contradict whichever machine is in the room. */
  'vram': { s: 3,
    d: 'The memory soldered to a discrete graphics card. Very fast, and a hard ceiling: what does not fit has to be read from system RAM instead, typically five to ten times slower.',
    vs: [['System RAM', 'Plentiful and cheap, and far slower. Spilling from one to the other is the cliff you can watch on the two-machines slide.'],
         ['Unified memory', 'On a Mac there is only one pool, shared by CPU and GPU. Large capacity, no copying, and no cliff — until the pool itself is full.']] },
  'unified memory': { s: 3,
    d: 'One pool of RAM shared by CPU and GPU, as on Apple silicon and AMD APUs. Capacity a graphics card cannot match, at bandwidth a plain PC cannot match — which is why Macs punch above their weight at generation.',
    vs: [['VRAM', 'A separate pool that has to be filled by copying across the PCIe bus, and that runs out sooner.']] },
  'dram': { s: 3,
    d: 'Ordinary system RAM. Plentiful, cheap, and typically five to ten times slower than a graphics card’s memory — which is exactly what a model spilling out of VRAM feels like.' },

  'memory bandwidth': { s: 3,
    d: 'How many gigabytes per second the machine can read from memory. Because every weight is read once per token, this number divided by the size of the model is the speed ceiling for generation — the one formula the whole workshop hangs off.',
    vs: [['Capacity', 'Gigabytes, not gigabytes per second. Capacity decides whether the model runs at all; bandwidth decides how fast. They are different numbers on the same spec sheet.']] },
  'bandwidth': { s: 3,
    d: 'How many gigabytes per second the machine can read from memory. Every weight is read once per token, so this divided by the model size is the speed ceiling for generation.',
    vs: [['Capacity', 'Gigabytes, not gigabytes per second. Capacity decides whether the model runs at all; bandwidth decides how fast.'],
         ['Network bandwidth', 'Nothing to do with your internet connection. This is the bus between the chip and its memory.']] },

  'prefill': { s: 3,
    d: 'The first phase: the whole prompt is read in one pass, all tokens at the same time. Limited by raw arithmetic, and it is what the pause before the first word is made of.',
    vs: [['Decode', 'The second phase, one token at a time and limited by memory bandwidth instead. A Mac is good at decode and modest at prefill; a big GPU is good at both until the model stops fitting.']] },
  'decode': { s: 3,
    d: 'The second phase: one token at a time, with every weight in the model read from memory for each one. Limited by memory bandwidth, which is why the size of the file sets the speed.',
    vs: [['Prefill', 'Reading your prompt, which happens in parallel and is limited by compute. Same model, two completely different bottlenecks.']] },
  'tok/s': { s: 3,
    d: 'Tokens per second — the rate words appear once the model has started. Roughly memory bandwidth divided by model size, and always meaningfully lower than that ceiling in practice.',
    vs: [['Time to first token', 'How long you wait before anything appears. That is prefill, and a slow prefill with fast decode still feels sluggish.']] },

  /* Two spellings, one definition — the deck's own slides say "context
     length"; "context window" is what everyone else's UI calls it, and
     an entry nobody can reach is not an entry. Keep the strings
     byte-identical: sharing a definition is what makes the pass treat
     them as one term. */
  'context window': { s: 5,
    d: 'The maximum number of tokens the model can have in front of it at once: the conversation so far, anything you pasted, and the reply it is writing. Everything outside it does not exist as far as the model is concerned.',
    vs: [['Memory', 'It does not remember you between chats, and nothing in the window is learned. Close the window and it is gone.'],
         ['The KV cache', 'The window is the limit. The cache is the RAM that filling it actually costs, and it grows with every token.']] },
  'context length': { s: 5,
    d: 'The maximum number of tokens the model can have in front of it at once: the conversation so far, anything you pasted, and the reply it is writing. Everything outside it does not exist as far as the model is concerned.',
    vs: [['Memory', 'It does not remember you between chats, and nothing in the window is learned. Close the window and it is gone.'],
         ['The KV cache', 'The window is the limit. The cache is the RAM that filling it actually costs, and it grows with every token.']] },
  'context': { s: 5,
    d: 'Everything the model can see at once: the conversation plus whatever you pasted. Measured in tokens, and it costs memory that grows as you talk.',
    vs: [['Long-term memory', 'There is none by default. A fresh chat starts from nothing, however long the last one was.']] },
  'kv cache': { s: 5,
    d: 'The saved intermediate state for every token so far, so the model does not have to re-read the whole conversation for each new word. It grows linearly with context, lives in the same RAM as the weights, and is why a long chat can push a model that fitted an hour ago out of memory.',
    vs: [['The context window', 'That is the limit in tokens; this is the memory bill for using it.'],
         ['RAG', 'Retrieval fetches passages into the prompt. The cache is just the running state of whatever is already there.']] },
  'gqa': { s: 5,
    d: 'Grouped-query attention. Several attention heads share one set of keys and values, which cuts the KV cache several-fold against the textbook formula — so a beginner computing it the old way over-estimates badly.',
    vs: [['MHA', 'The original, where every head keeps its own keys and values — much larger cache.'],
         ['MQA', 'The extreme version: one shared set for all heads. GQA sits between the two and is what nearly everything ships with now.']] },

  'rag': { s: 6,
    d: 'Retrieval-augmented generation: search your own files for the passages that match the question, then hand those passages to the model along with it. This is why a 1B model can answer questions about your documents far better than its size suggests.',
    vs: [['Fine-tuning', 'Fine-tuning teaches style and format by changing weights. RAG changes nothing and supplies facts at question time — for "what do my files say", RAG is almost always the right answer.'],
         ['A bigger context window', 'Pasting everything in works until it does not: the cache cost is linear and attention quality falls off long before the limit does.']] },
  /* Alias of RAG: §6 makes the argument in plain English ("retrieval
     over your own files") and only ever writes the acronym elsewhere. */
  'retrieval': { s: 6,
    d: 'Retrieval-augmented generation: search your own files for the passages that match the question, then hand those passages to the model along with it. This is why a 1B model can answer questions about your documents far better than its size suggests.',
    vs: [['Fine-tuning', 'Fine-tuning teaches style and format by changing weights. RAG changes nothing and supplies facts at question time — for "what do my files say", RAG is almost always the right answer.'],
         ['A bigger context window', 'Pasting everything in works until it does not: the cache cost is linear and attention quality falls off long before the limit does.']] },
  'hallucination': { s: 6,
    d: 'A fluent, confident answer that is simply wrong. The failure mode of asking a model for facts it was never given, and small models reach it sooner because they were given less.',
    vs: [['Lying', 'There is no intent and no awareness. The model has no separate store of "things I know" to check an answer against.']] },
  'hallucinate': { s: 6,
    d: 'A fluent, confident answer that is simply wrong. The failure mode of asking a model for facts it was never given, and small models reach it sooner because they were given less.',
    vs: [['Lying', 'There is no intent and no awareness. The model has no separate store of "things I know" to check an answer against.']] },
  'fine-tune': { s: 6,
    d: 'Continue training a published model on your own data to specialise it — tone, format, a domain’s vocabulary. Cheaper than training from scratch, and still not a weekend job.',
    vs: [['RAG', 'If the goal is "know about my documents", retrieval beats fine-tuning on cost, freshness and accuracy. Fine-tune for HOW it answers, retrieve for WHAT it answers with.']] },
  'fine-tuning': { s: 6,
    d: 'Continue training a published model on your own data to specialise it — tone, format, a domain’s vocabulary. Cheaper than training from scratch, and still not a weekend job.',
    vs: [['RAG', 'If the goal is "know about my documents", retrieval beats fine-tuning on cost, freshness and accuracy. Fine-tune for HOW it answers, retrieve for WHAT it answers with.']] },
  'lora': { s: 6,
    d: 'Low-rank adaptation: fine-tuning that freezes the original weights and trains a small extra layer alongside them, so the result is a file of a few tens of megabytes rather than a second copy of the model.',
    vs: [['A quant', 'Both produce a small file. A quant is the same model stored coarser; a LoRA is a patch that changes what the model does.']] },
  'speculative decoding': { s: 7,
    d: 'A trick where a small fast model drafts several tokens and the real model checks them all in one pass, keeping whatever it agrees with. Same output as the big model alone, arrived at faster.',
    vs: [['Using a smaller model', 'The big model still decides every token. Nothing is traded away for the speed except memory for the second model.']] },
  'training': { s: 0,
    d: 'The one-time process that produced the weights: thousands of GPUs reading a very large amount of text over weeks. It happened before you downloaded the file, and nothing you do afterwards repeats any part of it.',
    vs: [['Inference', 'Running the finished model, which is all your laptop ever does. Chatting with a model does not train it.'],
         ['Fine-tuning', 'A short continuation of training on your own data. Far cheaper, and still not something that happens by using the model.']] },
  'attention': { s: 5,
    d: 'The step where every token being generated looks back over the tokens already there and weighs which of them matter. It is the reason a model needs the whole conversation in memory, and the reason that memory is called the KV cache.',
    vs: [['Paying attention in the everyday sense', 'Nothing is being noticed or ignored on purpose. It is a weighted sum, computed for every token, every time.']] },
  'head': { s: 5,
    d: 'One of the parallel attention channels in a layer — a model has dozens, each looking back over the conversation for something different. How many of them share a set of keys and values is what GQA is about.' },

  'mixture of experts': { s: 6,
    d: 'A model split into many sub-networks where a router runs only a few per token. Enormous total parameter counts with modest work per token — but every expert still has to be in memory, so it buys speed, not space.',
    vs: [['A dense model', 'Every weight runs for every token. Same memory rules, more compute per token.'],
         ['The active count', 'A 1T model with 40B active needs memory for the trillion and runs at roughly the speed of the forty billion. Both numbers matter, for different reasons.']] },
  /* Alias, sharing the definition above verbatim. "Active parameters"
     used to be an entry of its own and no slide ever writes the phrase —
     it lives in the two "not the same as" lines instead, which is where
     someone actually meets the confusion. */
  'moe': { s: 6,
    d: 'A model split into many sub-networks where a router runs only a few per token. Enormous total parameter counts with modest work per token — but every expert still has to be in memory, so it buys speed, not space.',
    vs: [['A dense model', 'Every weight runs for every token. Same memory rules, more compute per token.'],
         ['The active count', 'A 1T model with 40B active needs memory for the trillion and runs at roughly the speed of the forty billion. Both numbers matter, for different reasons.']] },
  /* Alias of mixture of experts: §6's scale slide says "sparse" in prose
     and never spells the phrase out, so without this the word the slide
     actually uses had no definition behind it. */
  'sparse': { s: 6,
    d: 'A model split into many sub-networks where a router runs only a few per token. Enormous total parameter counts with modest work per token — but every expert still has to be in memory, so it buys speed, not space.',
    vs: [['A dense model', 'Every weight runs for every token. Same memory rules, more compute per token.'],
         ['The active count', 'A 1T model with 40B active needs memory for the trillion and runs at roughly the speed of the forty billion. Both numbers matter, for different reasons.']] },
  /* The counterpart, and the one §3 needs: the formula's denominator is
     the ACTIVE size, which for everything in the room is just the file
     size. Section 3, not 6, because that is where the word first lands. */
  'dense': { s: 3,
    d: 'Every weight in the model runs for every token, so the active size and the file size are the same number and bandwidth ÷ size is the whole story. Everything on the download slide is dense.',
    vs: [['Sparse / mixture of experts', 'There the two come apart: the whole file still has to fit in memory, but only a slice of it is read per token. Same capacity cost, much better speed.']] },

  'autoregressive': { s: 7,
    d: 'One token at a time, each conditioned on everything before it. How every model in this deck writes, and the reason decode is bandwidth-bound.',
    vs: [['Diffusion text models', 'They denoise a whole block of tokens in parallel over a few passes, which breaks the one-weight-read-per-token arithmetic entirely.']] },
  'diffusion': { s: 7,
    d: 'Generating text by denoising a whole block of masked tokens in parallel over a handful of steps, instead of left to right one at a time.',
    vs: [['Gemini Diffusion', 'Google’s closed research demo from 2025. DiffusionGemma is the 2026 open-weights model — at least one source online conflates the two and mis-dates it.'],
         ['Image diffusion', 'Same idea, different medium. Nothing here generates pictures.']] },
  /* Alias of diffusion: the verb is what §7's slide copy actually uses. */
  'denoise': { s: 7,
    d: 'Generating text by denoising a whole block of masked tokens in parallel over a handful of steps, instead of left to right one at a time.',
    vs: [['Gemini Diffusion', 'Google’s closed research demo from 2025. DiffusionGemma is the 2026 open-weights model — at least one source online conflates the two and mis-dates it.'],
         ['Image diffusion', 'Same idea, different medium. Nothing here generates pictures.']] },
  'ternary': { s: 7,
    d: 'Weights that may only be −1, 0 or +1, so one weight costs about 1.58 bits instead of 16. Models are TRAINED this way from the start rather than rounded down to it afterwards.',
    vs: [['2-bit quantization', 'That takes a finished 16-bit model and rounds it, which is the cliff §4 warns about. A ternary model never had the decimal places to lose, so the cliff does not apply to it.']] },

  'benchmark': { s: 6,
    d: 'A fixed test set used to score models. Useful for ranking, weak evidence for how a model will do on your particular job — and every published number was produced at a precision and context length that may not match yours.',
    vs: [['Your use case', 'The only benchmark that decides anything is running your own prompts on your own machine.']] },

  /* ---- tier 2: general computing ----------------------------------
     Not the deck's subject, but words it uses on the way there. The
     room is a hobbyist club: some of it writes firmware for fun and
     some of it has never opened a terminal, and the second half is the
     half that goes quiet rather than asking what a bit is. These never
     take a marking slot from tier 1 — see markSlide. */

  /* Both numbers, one definition. Standalone "bit" is rare in the deck —
     it is nearly always the tail of "4-bit", which is exactly what the
     pass must NOT mark — so the plural is the spelling that earns its
     place, and the singular is here for the day a sentence uses it. */
  'bit': { s: 4, t: 2,
    d: 'One binary digit, a single 0 or 1 — the smallest thing a computer stores. Eight of them make a byte, which is why a model held at 8 bits per weight weighs one byte per weight, and a 4-bit one weighs half that.',
    vs: [['A byte', 'Eight bits. Model sizes are quoted in bits per weight and file sizes in gigabytes, and the ÷8 between them is where most napkin arithmetic goes wrong.']] },
  'bits': { s: 4, t: 2,
    d: 'One binary digit, a single 0 or 1 — the smallest thing a computer stores. Eight of them make a byte, which is why a model held at 8 bits per weight weighs one byte per weight, and a 4-bit one weighs half that.',
    vs: [['A byte', 'Eight bits. Model sizes are quoted in bits per weight and file sizes in gigabytes, and the ÷8 between them is where most napkin arithmetic goes wrong.']] },
  'ram': { s: 3, t: 2,
    d: 'The fast working memory a running program lives in — measured in gigabytes, and emptied every time you shut down. A model has to be in it, in full, to run.',
    vs: [['Storage', 'Your SSD holds the file when nothing is running. It is roughly a hundred times slower, which is why "it fits on disk" says nothing about whether it will run.']] },
  'gpu': { s: 3, t: 2,
    d: 'The graphics chip. It does thousands of simple sums at once, which is exactly the shape of the arithmetic a model is made of, so it is the part doing nearly all the work.',
    vs: [['The CPU', 'A handful of fast general-purpose cores. It can run a model — just several times slower, because it does far fewer sums at a time.']] },
  /* Defined because §7's Bonsai catch now names a backend list — "CPU and
     Metal only" — and the audit was right that a room told the GPU does
     the work has never been told what the other one is. */
  'cpu': { s: 3, t: 2,
    d: 'The general-purpose processor every computer has. A handful of fast cores that do one thing after another, as against a GPU’s thousands doing one thing at once.',
    vs: [['The GPU', 'A model will run on the CPU alone, several times slower, because decode wants many simple sums at once rather than a few complicated ones in a row.']] },
  'cuda': { s: 3, t: 2,
    d: 'NVIDIA’s way of running general-purpose code on their graphics cards, and the backend most local inference uses on a PC.',
    vs: [['Metal / Vulkan / ROCm', 'The same job on Apple, cross-vendor and AMD hardware. A build that says "CUDA only" is saying "NVIDIA only".']] },
  'compute': { s: 3, t: 2,
    d: 'Raw arithmetic throughput — how many sums per second the chip can do. It is what prefill runs out of, and it is a different limit from memory bandwidth, which is what decode runs out of.',
    vs: [['Memory bandwidth', 'How fast numbers can be fetched, rather than how fast they can be multiplied. Nearly every surprise in this deck comes from confusing the two.']] },
  'prompt': { s: 1, t: 2,
    d: 'Everything you hand the model for one turn — your question, the system prompt, and the conversation so far. It is read in one pass before any reply starts, which is the phase called prefill.',
    vs: [['Your question alone', 'The app quietly sends far more than you typed. That is why a long chat gets slower to start each reply.']] },
  'api': { s: 2, t: 2,
    d: 'A way for one program to ask another for something, over the network or on your own machine. LM Studio and Ollama can both expose one, so other software can use your local model as if it were a cloud service.',
    vs: [['A cloud API key', 'Nothing here needs an account. A local API listens on your own machine and answers nobody else.']] },
  'endpoint': { s: 2, t: 2,
    d: 'One specific address an API answers on. The distinction that matters here is the chat endpoint, which applies the model’s template for you, versus the raw completion endpoint, which hands your text over exactly as typed.' },
  'runtime': { s: 2, t: 2,
    d: 'The program that actually runs the model — llama.cpp or MLX here. LM Studio is the window around it, and the runtime is the part that has to understand a new format before you can open one.' },
  'metadata': { s: 2, t: 2,
    d: 'The information a file carries about itself. In a GGUF that means the tokenizer, the chat template and the architecture — which is why a single file is enough for an app to know how to talk to the model inside it.' },
  'repo': { s: 2, t: 2,
    d: 'A repository: one folder of files published under an owner’s name, on Hugging Face or GitHub. A model page is a repo, not a product page, which is why two "same" models can differ file by file.' },
  'model card': { s: 2, t: 2,
    d: 'The README on a model’s repo — what it was trained for, how to prompt it, what it must not be used for, and the licence. The one page worth reading before a multi-gigabyte download.' },
  'model cards': { s: 2, t: 2,
    d: 'The README on a model’s repo — what it was trained for, how to prompt it, what it must not be used for, and the licence. The one page worth reading before a multi-gigabyte download.' },
  'license': { s: 0, t: 2,
    d: 'The terms the weights are published under: whether you may use them commercially, redistribute them, or train other models on their output. It is a property of the download, not of the app you run it in.',
    vs: [['Open source', 'A licence can be permissive without the model being open source in the usual sense — the training data and code are normally still private.']] },
  'apache 2.0': { s: 0, t: 2,
    d: 'A permissive licence: use it commercially, modify it, redistribute it, keep the notice. On a model page it is about as unrestricted as published weights get.',
    vs: [['A community licence', 'Meta’s and others add conditions — user thresholds, naming, acceptable-use terms. Same download button, different terms.']] },
  'open source': { s: 0, t: 2,
    d: 'Software published with the source code anyone can read, change and redistribute. llama.cpp and LM Studio’s engine are open source; a model’s weights are a different thing under a different licence.',
    vs: [['Open weights', 'You get the finished numbers, not the recipe. The training data and the code that made them are usually private, which is why "open-source model" is nearly always the wrong phrase.']] },
  /* §2's alternatives slide and §7's Bonsai slide both hand a beginner a
     small pile of ordinary software vocabulary in one breath — server,
     front end, self-host, fork, upstream. None of it is this deck's
     subject, all of it is load-bearing for the sentence it sits in, and
     it is exactly the sort of word people do not put their hand up
     about. Tier 2, so none of it can take a slot from tier 1. */
  'server': { s: 2, t: 2,
    d: 'A program that sits waiting and answers requests. Ollama runs one on your own machine so other apps can ask it for text — nothing here involves a datacentre or a second computer.',
    vs: [['A server in a rack', 'Same word, and the reason the sentence sounds bigger than it is. This one is a background process on your laptop.']] },
  'front end': { s: 2, t: 2,
    d: 'The part you look at and click, with the actual work happening in a separate program behind it. Open WebUI is a front end: it draws the chat window and asks a server elsewhere for the words.' },
  'self-host': { s: 2, t: 2,
    d: 'Run a piece of web software on your own machine instead of paying somebody to run it for you. It usually means installing a bit more than a single app, in exchange for owning the thing outright.' },
  'toolchain': { s: 2, t: 2,
    d: 'The stack of programs a piece of software needs in order to build and run — here, Python and its packages rather than a single installer. Worth knowing before you start, because it is the step that goes wrong.' },
  'completion': { s: 2, t: 2,
    d: 'The model’s original job: you give it text and it keeps writing from there. Chat is that same trick with a template wrapped around it, which is why a missing template makes a model finish your sentence instead of answering it.' },
  'fork': { s: 7, t: 2,
    d: 'A separate copy of an open-source project, changed by someone else and built separately. Useful, and not the same as the version your app ships — "it works in the fork" can mean you have to compile it yourself.' },
  'upstream': { s: 7, t: 2,
    d: 'Merged into the project everyone downloads, rather than living only in somebody’s private copy. It is the difference between "a build exists" and "your app can already open it".',
    vs: [['A fork', 'A separate copy of the project with its own changes. Code in a fork works, for the people who build that fork — which is not the same as it reaching you.']] },
  'mainline': { s: 7, t: 2,
    d: 'Merged into the project everyone downloads, rather than living only in somebody’s private copy. It is the difference between "a build exists" and "your app can already open it".',
    vs: [['A fork', 'A separate copy of the project with its own changes. Code in a fork works, for the people who build that fork — which is not the same as it reaching you.']] },
  'agent': { s: 6, t: 2,
    d: 'A model given tools and a loop — search, read a file, run a command — so it takes several steps on its own instead of answering once. Every step is another chance to be wrong, which is why long agent runs are where small models struggle most.',
    vs: [['A chatbot', 'One turn, one answer, nothing done on your behalf. That is what your download is until you wire something up to it.']] }
};

var glossPanel = null;
var glossTerm = null;

/* Only prose. A dotted underline inside a readout or a control reads as
   part of the value, and inside a heading it reads as a typo. */
var PROSE = '.slide p, .slide li, .tile .v, .toc-w, .srow .body p, .anat-part p, .dis p';

function glossKeys() {
  return Object.keys(GLOSSARY).sort(function (a, b) { return b.length - a.length; });
}

/* \b does not do what you want next to a dot or a slash: "llama.cpp" and
   "tok/s" end at a non-word character, so the trailing \b never matches.
   Guard with explicit "not a word character" lookarounds instead.

   The space in a multi-word term is NOT a space. In the slide source it
   is as often a newline and an indent, or an &nbsp; holding "context
   window" together at a line break — so a literal space matched almost
   none of them, and every two-word entry in the glossary was quietly
   dead. That is where "some words are underlined and some are not"
   came from, and it is why the audit's first category is entries that
   never match anything. */
/* HYPH is every character that joins two halves of a compound: the
   ASCII hyphen and the Unicode ones the slide source actually uses. The
   deck writes "4&#8209;bit" with a NON-BREAKING hyphen, so that a
   quantization never wraps across a line — and with only "-" in the
   boundary class, the term "bit" matched the tail of every one of them.
   Six slides underlined the last three letters of "4‑bit" and offered
   to explain what a binary digit is. A term must not match half a
   compound word, whichever dash is holding it together. */
var HYPH = '\\u002d\\u2010\\u2011\\u2212';

function glossRe(term) {
  /* Same argument inside the term: an entry written "fine-tune" has to
     match a slide that wrote it with a non-breaking hyphen. */
  var esc = term.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&')
                .replace(/ /g, '[\\s\\u00a0]+')
                .replace(/-/g, '[' + HYPH + ']');
  return new RegExp('(^|[^\\w' + HYPH + '])(' + esc + ')(?![\\w' + HYPH + '])', 'i');
}

/* Built once. The reading-order pass tests every key against every prose
   node, which is a few hundred thousand execs over the whole deck —
   cheap on short strings, and not cheap at all if each one also compiles
   a regex first. */
var GLOSS_RE = {};
glossKeys().forEach(function (term) { GLOSS_RE[term] = glossRe(term); });

var PER_SLIDE = 6;

/* Where each term first appears in this node, or null. Positions are
   taken once and stay valid: marking splits text nodes and wraps a word
   in a <button> with the same text, so textContent never changes. */
function glossHits(node) {
  var text = node.textContent;
  var hits = [];
  glossKeys().forEach(function (term) {
    var m = GLOSS_RE[term].exec(text);
    if (m) hits.push({ term: term, at: m.index + m[1].length, len: term.length });
  });
  /* Reading order, longer term first on a tie. */
  hits.sort(function (a, b) { return a.at - b.at || b.len - a.len; });
  return hits;
}

/* One reading-order pass over the slide, restricted to one tier. Called
   twice: the deck's own vocabulary gets first refusal on the budget, and
   general computing terms take whatever is left. Within a tier the order
   is the reader's. */
function markPass(nodes, tier, used, n) {
  for (var i = 0; i < nodes.length && n < PER_SLIDE; i++) {
    var node = nodes[i];
    var hits = glossHits(node);
    for (var h = 0; h < hits.length && n < PER_SLIDE; h++) {
      var entry = GLOSSARY[hits[h].term];
      if ((entry.t || 1) !== tier) continue;
      /* Two spellings of one idea share a definition and count as one. */
      if (used[entry.d]) continue;
      /* A term can match the node's text and still be unmarkable — the
         only occurrence sits inside a <code> or a word already marked.
         Leave it unused so a later node on the slide may still take it. */
      if (markIn(node, GLOSS_RE[hits[h].term], hits[h].term)) {
        used[entry.d] = true;
        n++;
      }
    }
  }
  return n;
}

function markSlide(slide) {
  var nodes = Array.prototype.slice.call(slide.querySelectorAll(PROSE))
    .filter(function (node) {
      return !node.closest('[data-noglossary], button, a, .gl');
    });
  var used = {};
  markPass(nodes, 2, used, markPass(nodes, 1, used, 0));
}

function markIn(el, re, term) {
  var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
  var node;
  while ((node = walker.nextNode())) {
    if (node.parentNode.closest('.gl, button, a, code, [data-noglossary]')) continue;
    var m = re.exec(node.nodeValue);
    if (!m) continue;

    var at = m.index + m[1].length;
    var tail = node.splitText(at);
    tail.nodeValue = tail.nodeValue.slice(m[2].length);

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gl';
    btn.dataset.gl = term;
    btn.setAttribute('aria-expanded', 'false');
    btn.textContent = m[2];              /* keep the sentence's own casing */
    node.parentNode.insertBefore(btn, tail);
    return true;
  }
  return false;
}

function buildGlossPanel() {
  var el = document.createElement('div');
  el.className = 'gloss';
  el.id = 'gloss';
  el.setAttribute('role', 'dialog');
  /* Without a name this announces as an unlabelled dialog. The term itself
     is the only sensible label, and it is already the first thing in it. */
  el.setAttribute('aria-labelledby', 'gloss-k');
  /* Focusable but not tabbable: it is announced and reachable when the
     panel opens, and stays out of the tab order the rest of the time. */
  el.tabIndex = -1;
  el.hidden = true;
  el.innerHTML =
    '<div class="gloss-k" id="gloss-k"></div>' +
    '<p class="gloss-d"></p>' +
    '<div class="gloss-vs" hidden><span class="gloss-vs-k">Not the same as</span>' +
    '<dl></dl></div>' +
    '<button type="button" class="gloss-go" hidden></button>';
  document.body.appendChild(el);
  return el;
}

/* restore: hand focus back to the word the panel came from. Only the
   keyboard path (Escape) asks for it. Doing it on EVERY close would be
   wrong twice over — a slide change would move focus onto a button on a
   now-hidden slide, and a focused button makes the deck's keydown guard
   hand the arrow keys to that button instead of navigating. */
function closeGloss(restore) {
  if (!glossPanel || glossPanel.hidden) return;
  glossPanel.hidden = true;
  if (glossTerm) {
    glossTerm.setAttribute('aria-expanded', 'false');
    glossTerm.removeAttribute('aria-controls');
    if (restore && glossTerm.closest('.slide.active')) glossTerm.focus();
  }
  glossTerm = null;
}

function openGloss(btn) {
  var entry = GLOSSARY[btn.dataset.gl];
  if (!entry) return;
  if (!glossPanel) glossPanel = buildGlossPanel();

  glossPanel.querySelector('.gloss-k').textContent = btn.dataset.gl;
  glossPanel.querySelector('.gloss-d').textContent = entry.d;

  /* The distinctions, where the term has a famous twin. Built as a
     definition list because that is what it is, and because a term and
     its correction have to stay visibly paired when it wraps. */
  var vs = glossPanel.querySelector('.gloss-vs');
  var dl = vs.querySelector('dl');
  dl.textContent = '';
  vs.hidden = !entry.vs;
  if (entry.vs) {
    entry.vs.forEach(function (pair) {
      var dt = document.createElement('dt');
      dt.textContent = pair[0];
      var dd = document.createElement('dd');
      dd.textContent = pair[1];
      dl.appendChild(dt);
      dl.appendChild(dd);
    });
  }

  var go = glossPanel.querySelector('.gloss-go');
  if (entry.s === null || entry.s === undefined) {
    go.hidden = true;
    go.removeAttribute('data-goto');
  } else {
    go.hidden = false;
    go.textContent = 'Section 0' + entry.s;
    /* data-goto is handled by the deck's delegated listener, so the
       jump costs nothing here — and the slide change closes this. */
    go.dataset.goto = entry.s;
  }

  glossPanel.hidden = false;
  glossTerm = btn;
  btn.setAttribute('aria-expanded', 'true');
  btn.setAttribute('aria-controls', 'gloss');
  placeGloss(btn);
  /* The panel is appended to <body>, nowhere near the word in the tab
     order, so without this a keyboard user opens a definition they then
     cannot reach. Focusing a div (not a control) also keeps the deck's
     arrow keys working while it is open. */
  glossPanel.focus();
}

/* Anchored under the word, clamped to the viewport, and flipped above
   when the word is low enough that the panel would sit under the rail. */
function placeGloss(btn) {
  var r = btn.getBoundingClientRect();
  var p = glossPanel.getBoundingClientRect();
  var pad = 12;

  var left = r.left + r.width / 2 - p.width / 2;
  left = Math.max(pad, Math.min(left, window.innerWidth - p.width - pad));

  var below = r.bottom + 10;
  var top = (below + p.height > window.innerHeight - 80)
    ? r.top - p.height - 10
    : below;
  top = Math.max(pad, top);

  glossPanel.style.left = Math.round(left) + 'px';
  glossPanel.style.top = Math.round(top) + 'px';
}

Array.prototype.slice.call(document.querySelectorAll('.slide')).forEach(markSlide);

document.addEventListener('click', function (e) {
  var btn = e.target.closest && e.target.closest('.gl');
  if (btn) {
    if (glossTerm === btn) closeGloss(); else openGloss(btn);
    return;
  }
  if (!e.target.closest || !e.target.closest('.gloss')) closeGloss();
});

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeGloss(true);
});
/* Navigating away from the word the panel is pointing at would leave it
   floating over an unrelated slide. */
/* Wrapped, not passed directly: as a listener, closeGloss receives the
   Event as its `restore` argument, which is truthy — so both of these
   took the focus-restoring path the comment above it rules out. The
   slide-change case was saved by the `.slide.active` guard; resize was
   not, so resizing with a panel open put focus on the term button and
   the deck's keydown guard then handed it the arrow keys. */
document.addEventListener('deck:slide', function () { closeGloss(); });
window.addEventListener('resize', function () { closeGloss(); });
/* The panel is fixed and anchored once. On a narrow screen the slide itself
   scrolls, so it would otherwise drift away from its word — capture, because
   that scroll happens on the slide, not the window.

   Only a scroll that actually MOVED the word counts. Three slides auto-scroll
   a pane to follow streaming text (§3's decode passage, §2's template output,
   §6's chat threads), and those panes do not contain any marked word — but a
   blanket close treated their every frame as "the reader scrolled away" and
   shut the panel the instant it opened. §3 is where it was unmissable: its
   passage loops forever, so the scrolling never stops, while the other two
   settle once their scenario finishes. */
document.addEventListener('scroll', function (e) {
  if (!glossTerm) return;
  var t = e.target;
  if (t === document || t === document.documentElement || t === window ||
      (t.contains && t.contains(glossTerm))) closeGloss();
}, true);
