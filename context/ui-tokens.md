# UI Tokens — CampOS

Visual design tokens, color scales, shadow definitions, and component styling values for CampOS. Configured through Tailwind CSS v3 (`tailwind.config.ts`) and global CSS utility rules (`app/globals.css`).

Always use these defined tokens — never invent arbitrary colors or light-mode overrides.

---

## Tailwind Theme Configuration (`tailwind.config.ts`)

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#09090b",
        card: "#121215",
        "card-hover": "#18181c",
        border: "#27272a",
        muted: "#71717a",
        combat: {
          red: "#ef4444",
          "red-dark": "#b91c1c",
          "red-glow": "rgba(239, 68, 68, 0.15)",
          gold: "#f59e0b",
          green: "#10b981",
          blue: "#06b6d4",
        },
      },
      boxShadow: {
        "glow-red": "0 0 20px -5px rgba(239, 68, 68, 0.3)",
        "glow-subtle": "0 4px 20px 0 rgba(0, 0, 0, 0.4)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## Global CSS Utility Classes (`app/globals.css`)

```css
/* Glowing combat accents */
.border-combat-glow {
  border-color: rgba(239, 68, 68, 0.4);
  box-shadow: 0 0 15px -3px rgba(239, 68, 68, 0.25);
}

.glow-card {
  background: linear-gradient(180deg, #141418 0%, #0d0d10 100%);
  border: 1px solid #222227;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.glow-card:hover {
  border-color: #3f3f46;
}

.glow-card-active {
  border-color: #ef4444 !important;
  box-shadow: 0 0 20px -5px rgba(239, 68, 68, 0.35);
}

/* Touch-optimized button ripple and feedback for gym tablets */
button:active {
  transform: scale(0.98);
}
```

---

## Token Reference Palette

### 1. Core Surfaces & Backgrounds
| Token | Hex Value | Utility Class | Purpose |
| :--- | :--- | :--- | :--- |
| `background` | `#09090b` | `bg-background` or `bg-[#09090b]` | Master page background, dark canvas |
| `card` | `#121215` | `bg-card` | Standard card and modal content container |
| `card-hover` | `#18181c` | `hover:bg-card-hover` | Interactive list item or card hover state |
| `glow-card` | Gradient | `glow-card` | Elevated feature card with subtle border transition |
| `surface-zinc` | `#18181b` / `#27272a` | `bg-zinc-900` / `bg-zinc-800` | Toolbars, pill containers, sub-panels |

### 2. Combat Functional Accents
| Token | Hex Value | Utility Class | Purpose |
| :--- | :--- | :--- | :--- |
| `combat.red` | `#ef4444` | `text-red-500` / `bg-red-600` | Primary brand accent, active role tab, danger line |
| `combat.red-dark` | `#b91c1c` | `bg-combat-red-dark` | Deep red button hovers, gradient stops |
| `combat.red-glow` | `rgba(239, 68, 68, 0.15)` | `bg-red-500/10` / `bg-combat-red-glow`| Active tab backgrounds, warning halos |
| `combat.gold` | `#f59e0b` | `text-amber-400` / `bg-amber-500/20` | Cut protocol warnings, moderate soreness, cautions |
| `combat.green` | `#10b981` | `text-emerald-400` / `bg-emerald-500/20` | Optimal health status, target weights, live sync |
| `combat.blue` | `#06b6d4` | `text-cyan-400` / `bg-cyan-500/20` | Hydration logs, electrolyte intake, ice recovery |

### 3. Borders & Separators
| Token | Hex Value | Utility Class | Purpose |
| :--- | :--- | :--- | :--- |
| `border` | `#27272a` | `border-zinc-800` | Primary component borders, table dividers |
| `border-subtle` | `#1f1f23` | `border-zinc-800/60` | Subtle internal card dividers |
| `border-active` | `#ef4444` | `border-red-500` | Active selection border, focused inputs |
| `border-combat-glow` | RGBA + Shadow | `.border-combat-glow` | Glowing highlight for active fighters & alerts |

### 4. Typography & Foreground Colors
| Token | Hex / Class | Purpose |
| :--- | :--- | :--- |
| `text-primary` | `text-zinc-100` / `text-white` | Headings, fighter names, primary values |
| `text-secondary`| `text-zinc-300` / `text-zinc-400` | Subtitles, descriptions, secondary metadata |
| `text-muted` | `text-zinc-500` / `text-zinc-600` | Inactive labels, table headers, placeholders |
| `text-accent` | `text-red-400` / `text-red-500` | Brand highlights, championship callouts |

---

## Status Badge Presets

Used for fighter status, check-in severity, and biomechanical checkpoints:

```tsx
// Optimal / Green
<span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/30">
  Optimal
</span>

// Warning / Amber
<span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/30">
  Warning
</span>

// Critical / Red
<span className="rounded bg-red-500/20 px-2 py-0.5 text-xs font-bold text-red-400 border border-red-500/30 animate-pulse">
  Critical
</span>
```

---

## Tablet Touch Scaling Token

```css
/* Gym Tablet Kiosk interaction feedback */
button:active {
  transform: scale(0.98);
}
```

Any interactive tile or numeric button in the kiosk must have a minimum size of `h-11 w-11` (44px) up to `h-16 w-16` (64px) on numeric keypads to ensure friction-free tapping on touchscreens.
