# Kotta — brand mark

The mark is a staff: four rules cut out of a solid ink square, with one red note
head sitting **on** the third line. The kotta is the written, executable score —
the lines are the record, the red head is the machine's position in it.

## Files

| File | Grid | Use |
| --- | --- | --- |
| `kotta-mark.svg` | 96 | Primary mark — ink square, light staff. Any ground, 24px and up. |
| `kotta-mark-reverse.svg` | 96 | Reverse — light square, ink staff. For dark app bars where the primary would disappear into the ground. |
| `kotta-favicon.svg` | 20 | Two-line reduction for 16–20px. Swaps ground and staff under `prefers-color-scheme: dark`. |

Both apps inline the mark in markup rather than loading these files, so that the
staff count and the ground colour can follow the surface they sit on. These files
are the canonical geometry and the export for anything outside the apps (npm,
GitHub, docs).

## Colours

- Ink `#201e1d`
- Paper `#f3f2f2`
- Accent (note head) `#ec3013`

## Rules

- The red head always stands **on** a line, never in the gap between two.
- One head, one voice sounding now — the red marks the machine, the same as in the console.
- Below 24px use three lines instead of four; below 18px use two. The head stays.
- The wordmark is Archivo 800, all caps, aligned to the height of the mark — never centred on it.

Source: Claude Design — *Kotta Logo* (direction 1a, "Staff — filled").
