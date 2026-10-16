# UI Rules — CampOS

Visual design rules, component construction guidelines, and interaction patterns for CampOS. Follow these rules consistently to ensure the gym floor experience remains fast, readable, and athletic.

---

## 1. Dark Athletic Theme Rule

- **Always Dark**: The UI is strictly dark-mode-only. The base page canvas is `#09090b` (`bg-[#09090b]`). Never render light or white background cards.
- **Card Surfaces**: Primary cards use `bg-card` (`#121215`) with a `border border-zinc-800` (or `border-[#27272a]`).
- **Feature Cards**: For highlighted sections or selected fighter cards, apply `.glow-card` with active state `.glow-card-active` (`border-color: #ef4444`).
- **Text Contrast**:
  - Headings & Primary Values: `text-zinc-100` or `text-white`
  - Body & Descriptions: `text-zinc-300` or `text-zinc-400`
  - Captions & Inactive Labels: `text-zinc-500` or `text-zinc-600`
  - Brand & Danger Accents: `text-red-400` / `text-red-500`

---

## 2. Touch-First Gym Usability

Combat sports athletes and coaches interact with CampOS while wearing hand wraps, light gloves, or with sweaty fingers on wall-mounted gym tablets.

- **Minimum Touch Target**: Every interactive element (buttons, tabs, checkboxes) must have a minimum bounding box of `44px x 44px`.
- **PIN Keypad**: Numeric keypad buttons in `PinLogin.tsx` must be at least `64px x 64px` (`h-16 w-16`) with clear numeric font sizing (`text-2xl font-bold font-mono`).
- **Tactile Feedback**: Interactive buttons must include `button:active { transform: scale(0.98); }` to provide immediate physical feedback on tap.
- **Single-Tap Actions**: Favor single-tap preset buttons over text fields where possible (e.g. `+8 oz`, `+16 oz`, `+32 oz` quick fluid loggers).

---

## 3. Global Navigation & Header

The global header in `components/ui/Header.tsx` is fixed at the top (`sticky top-0 z-40`) with a dark frosted glass effect (`bg-[#09090b]/90 backdrop-blur-md border-b border-zinc-800/80`).

- **Left**: CampOS logo with glowing red flame icon (`Flame`), "PRO" badge, and active fight matchup banner.
- **Center**: 3-button role switcher (`Coach Command`, `Fighter App`, `Video & Biomechanics`). The active tab uses `bg-red-600 text-white shadow-sm`; inactive tabs use `text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50`.
- **Right**:
  - `Log Weigh-In` scale shortcut button (visible in Coach role).
  - `Cut Protocol` modal trigger button.
  - `LBS / KG` toggle button.
  - Real-time `Gym Sync` / `Offline Cache` ping indicator.
  - State reset icon button (`RefreshCw`).

---

## 4. Dual Weight Unit Handling

Every component displaying weight must support both Pounds (`lbs`) and Kilograms (`kg`) seamlessly:

```tsx
const { weightUnit } = useCampStore();

// Conversion helper
const displayWeight = (weightLbs: number) => {
  if (weightUnit === 'kg') {
    return `${(weightLbs * 0.45359237).toFixed(1)} kg`;
  }
  return `${weightLbs.toFixed(1)} lbs`;
};
```

- Weight values must always be formatted to **1 decimal place** (`.toFixed(1)`).
- Never hardcode `lbs` into user-facing labels without checking `weightUnit`.

---

## 5. Status & Severity Color System

All statuses across the roster, check-ins, and video analysis follow a consistent 3-tier semantic color system:

| Status Tier | Border & BG Class | Text Class | Indicator Dot |
| :--- | :--- | :--- | :--- |
| **Optimal / Safe** | `bg-emerald-500/20 border-emerald-500/30` | `text-emerald-400` | `bg-emerald-500` |
| **Warning / Caution** | `bg-amber-500/20 border-amber-500/30` | `text-amber-400` | `bg-amber-500` |
| **Critical / Danger** | `bg-red-500/20 border-red-500/30` | `text-red-400 animate-pulse` | `bg-red-500 animate-ping` |

- **Weight Cut Trajectory Chart**:
  - Target Trajectory Line: `stroke="#10b981"` (Emerald)
  - Actual Weigh-In Area: `fill="url(#weightGradient)" stroke="#ef4444"` (Combat Red)
  - Physiological Danger Zone Line: `stroke="#ef4444" strokeDasharray="5 5"` (Dashed Red)
  - Division Limit Line: `stroke="#f59e0b" strokeDasharray="3 3"` (Amber)

---

## 6. Modals & Overlay Conventions

- **Z-Index Layering**: Modals use `z-50` with an overlay backdrop of `bg-black/80 backdrop-blur-sm fixed inset-0`.
- **Dismissibility**: Modals must be dismissible via a visible top-right `X` button and by clicking the backdrop overlay.
- **Scroll Behavior**: Modal inner content must be contained in `max-h-[85vh] overflow-y-auto` with styled dark scrollbars (`::-webkit-scrollbar`).

---

## 7. Video Analyzer & Floating HUD Rules

- **Video Player Panel**:
  - Dark frame container with rounded borders (`rounded-xl border border-zinc-800 bg-black`).
  - Biomechanical telemetry overlay placed cleanly above or alongside the video frame.
  - Video scrub bar: custom range slider with red progress fill.
- **Background Job HUD**:
  - Docked in bottom-right corner (`fixed bottom-6 right-6 z-50`).
  - Must remain unobtrusive while active, showing percentage progress and current stage badge.
  - Allows single-click expansion to view logs and single-click inspection when analysis finishes.
