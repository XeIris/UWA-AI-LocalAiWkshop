# Attributions and third-party assets

Everything listed here is **excluded** from this repository's licences
([LICENSE](LICENSE) for code, [LICENSE-CONTENT](LICENSE-CONTENT) for the deck).
It belongs to its respective owner, on that owner's terms.

**The exclusion follows the assets into the build.** All logos are inlined as
`<symbol>` elements and all images are base64'd, so the same carve-out applies to
`index.html`, `dist/index.html` and `posters/*.html` — not only to `src/assets/`.

**A permissive licence on an icon file is not permission to use a brand.** Most of
the marks below sit in icon sets released under MIT, but the *marks themselves* are
trademarks of Google, Alibaba, Apple, Microsoft, Hugging Face and the rest. That is a
separate body of law from copyright, and nothing in this repository grants you any
right under it. They appear here **nominatively** — to say "this is the model you are
downloading", "this app runs on that OS" — which is the use trademark law makes room
for. Reuse them the same way, or replace them.

## Logos and marks

| Asset | Subject | Source | Upstream terms |
|---|---|---|---|
| `src/assets/logos/0-gemma.svg` | Gemma | [lobehub/lobe-icons](https://github.com/lobehub/lobe-icons) | MIT (icon set) — mark is Google's |
| `src/assets/logos/1-liquid.svg` | Liquid AI / LFM | lobehub/lobe-icons | MIT (icon set) — mark is Liquid AI's |
| `src/assets/logos/2-qwen.svg` | Qwen | lobehub/lobe-icons | MIT (icon set) — mark is Alibaba's |
| `src/assets/logos/3-hf.svg` | Hugging Face | lobehub/lobe-icons | MIT (icon set) — mark is Hugging Face's |
| `src/assets/logos/4-ollama.svg` | Ollama | lobehub/lobe-icons | MIT (icon set) — mark is Ollama's |
| `src/assets/logos/5-openwebui.svg` | Open WebUI | lobehub/lobe-icons | MIT (icon set) — mark is Open WebUI's |
| `src/assets/logos/6-lmstudio.svg` | LM Studio | lobehub/lobe-icons | MIT (icon set) — mark is Element Labs' |
| `src/assets/logos/7-llamacpp.svg` | llama.cpp | [ggml-org/llama.brand](https://github.com/ggml-org/llama.brand) | **CC BY-NC 4.0** — see the note below |
| `src/assets/logos/8-mlx.svg`, `src/assets/mlx.png` | MLX | [ml-explore/mlx](https://github.com/ml-explore/mlx) | MIT (© Apple Inc.) — the project wordmark, adapted here into a square icon |
| `src/assets/logos/9-apple.svg` | Apple platform | drawn for this deck | mark is Apple's |
| `src/assets/logos/a-windows.svg` | Windows platform | lobehub/lobe-icons | MIT (icon set) — mark is Microsoft's |
| `src/assets/logos/b-linux.svg` | Linux platform | redrawn for this deck, after Tux | Tux was created by Larry Ewing (`lewing@isc.tamu.edu`) with The GIMP; his notice permits use and modification provided he and The GIMP are credited on request. "Linux" is a trademark of Linus Torvalds. |
| `SVG/gemma-color.svg`, `SVG/ollama.svg` | Gemma, Ollama | lobehub/lobe-icons | MIT (icon set) — marks as above |

> **`llama.brand` is NonCommercial, and that is the one asset with a live
> restriction.** `ggml-org/llama.brand` ships under **CC BY-NC 4.0**, not the MIT you
> would expect from the llama.cpp source repo. Running this workshop at a hobbyist
> club is plainly non-commercial and fine. Charging for the session, or folding the
> deck into paid training, is not — replace the mark with a text chip first, or seek
> permission from ggml-org. This is a restriction on *their* asset, not on this
> deck's own MIT and CC BY content.

GPT4All appears as a typographic chip rather than a logo, because it has no mark.

## Images

| Asset | What it is | Terms |
|---|---|---|
| `src/assets/lmstudio-app.webp` | The LM Studio application icon, on §1's download slide | Element Labs'. Shown to identify the app attendees are being asked to install. |
| `src/assets/qr-lmstudio.svg` | QR code for `https://lmstudio.ai/download` | Generated for this deck with [segno](https://github.com/heuer/segno) and committed. The file is ours; the destination is not. |

## Things named but not bundled

The deck cites models, papers, engines and vendors throughout — Bonsai/PrismML,
DiffusionGemma, Artificial Analysis' index figures, the arXiv papers in the closing
reading list. Those are references and quoted figures, attributed on the slides
themselves, with no third-party material redistributed here.

## If you are reusing this deck

The simple path: keep the attribution to *AI, Unplugged*, keep this file, and either
keep the marks in the same nominative use or strip them. If you are rebranding the
deck for another event, swap the logos for your own chips — the chip system in
`src/css/` will take a text label wherever it takes a `<use href="#lg-…">`.
