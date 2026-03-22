# OKRAI — design manifesto

## Product experience

OKRAI is a **calm executive companion** for personal objectives: measurable key results, weekly check-ins, and AI coaching that feels like a thoughtful human, not a chatbot feed. The emotional promise is **momentum without shame** — progress should be legible, reflection should feel safe, and the UI should never punish inconsistency with noisy dashboards or guilt copy.

## Visual language

- **Quiet confidence**: generous whitespace, strong typographic hierarchy, restrained color used to *direct attention*, not decorate every row.
- **Soft depth**: subtle elevation and hairline borders — glass/blur only where it sharpens focus (e.g. pills, optional sheets).
- **Palette**: cool neutrals with a single **teal accent** and a **warm momentum** gold for sparing highlights — no neon, no crypto gradients.
- **Motion**: short, purposeful transitions; springs for interactive controls; no decorative looping animation.

## Platform stance

- **iOS**: clarity, deference, depth — native navigation patterns, readable dynamic type scaling.
- **Android**: Material 3 discipline — expressive touch feedback, clear ripples, adaptive color via semantic tokens.
- **Shared**: one design language; diverge only where platform HIG/M3 require it (navigation, back behavior, keyboard).

## Accessibility & trust

- Contrast-safe semantic colors in light and dark; **44pt** minimum touch targets; accessibility labels on sliders and primary actions.
- Loading: **skeletons** over spinners; errors: plain language with a single recovery path.

## AI coaching UX

Coach is framed as a **session**: structured prompts, reflection cards, and a slim composer — not an endless chat stream dumped on a screen.

---

Tokens live in `constants/tokens.ts`; runtime theme in `providers/ThemeProvider.tsx`. Prefer `useTheme().colors` in new UI.
