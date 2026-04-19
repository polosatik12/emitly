

## Plan: Fix Long/Short voting — animations and red glow

### Problem
- No visual feedback animation when pressing Long/Short buttons
- Short button has no red glow effect — only the Long button gets a green highlight
- Overall voting interaction feels broken and unresponsive

### Changes

**File: `src/components/NewsDetailDrawer.tsx`** — voting block rework

1. **Add glow/shadow effects to both buttons:**
   - Long (active): green box-shadow glow (`0 0 16px hsl(var(--news-positive) / 0.4)`)
   - Short (active): red box-shadow glow (`0 0 16px hsl(var(--news-negative) / 0.4)`)

2. **Add smooth transition animations:**
   - `transition-all duration-300` on both buttons for color, shadow, and scale changes
   - Scale pulse on click via `active:scale-[0.93]`
   - Smooth background color transition between active/inactive states

3. **Fix the sentiment bar to show both colors:**
   - Green portion from the left for Long
   - Red portion from the right for Short (add a red bar from the right side)

4. **Add ring/border accent on selected vote:**
   - Active Long: green border ring
   - Active Short: red border ring

### Technical details
- All changes in one file: `NewsDetailDrawer.tsx`, specifically the `votingBlock` variable (lines 193-232)
- Uses existing CSS variables `--news-positive` and `--news-negative`
- No new dependencies needed

