# Hashtag Labs design language (v1.0)

One look across every app on quattroventi.xyz: the landing page, Hub, Rento and Stradeo.
The landing page (quattroventi.xyz) is the reference. If something here and the landing page disagree, the landing page wins.

## Rules

1. **Yellow is a fill, never text.** `#FFD600` is only ever a background. Text on yellow is always `#0B0B0A`.
2. **One yellow thing per screen:** the main action (Sign in, Start exam, Add bill). Everything else is neutral.
3. **Status colours are separate from the brand.** Correct/paid = green, warning/due soon = orange, wrong/overdue = red, info = blue. Warning is orange, never yellow.
4. **Cards are border-only.** 1px border, no shadows, no gradients.
5. **Radius scale:** 6 (chips, small buttons) · 8 (inputs, controls) · 10 (buttons, inner boxes) · 14 (cards, tiles). Nothing else.
6. **Type:** Titillium Web 400 / 600 / 700 only (no 500, no 800). JetBrains Mono for numbers: scores, money, times, counts, IDs.
7. **Theme:** a Light / Auto / Dark switch on every app, defaulting to Auto (follows the device).
8. **Emphasis is ink, not colour.** A selected tab, chip or answer is shown with the ink colour (black in light, off-white in dark), not with orange or blue.
9. **Base size 16px.** Controls are 40px high (comfortable) or 32px (compact tools).

## Colour tokens

| Token | Light | Dark | Use |
|---|---|---|---|
| bg | `#FAFAF8` | `#0B0B0A` | Page background |
| card | `#FFFFFF` | `#171716` | Cards, inputs |
| subtle | `#F2F2EE` | `#1F1F1D` | Tracks, icon tiles, quiet boxes |
| border | `#E6E5E0` | `#2A2A27` | All borders |
| ink | `#0B0B0A` | `#F4F4F1` | Text, selected states |
| muted | `#6B6B65` | `#8A8A83` | Secondary text |
| brand | `#FFD600` | `#FFD600` | Main action fill only |
| on-brand | `#0B0B0A` | `#0B0B0A` | Text on brand |
| success | `#1F8A4C` | `#4CC27F` | Correct, paid, done |
| warning | `#C2540A` | `#F08A43` | Due soon, middling |
| danger | `#C0262D` | `#EF6A6F` | Wrong, overdue, errors |
| info | `#2563C9` | `#6F9EF0` | Translations, hints |

Status backgrounds use the status colour at about 10% opacity.

## Marks

- **quattroventi:** yellow rounded tile with a bold, square-cut black #.
- **Apps:** the app's line icon on a neutral tile (subtle background, 1px border). Rento = house, Stradeo = road, Hub = lock.

## Do / don't

- Do: one yellow button, everything else outlined or ink.
- Do: put numbers in JetBrains Mono.
- Don't: gradients, glows, coloured shadows, emoji-as-icons in navigation, yellow text, a second yellow button.
