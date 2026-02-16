

# Add Celebration Experience on Registration Submission

## Overview
Enhance the "Registration Submitted" success screen with a confetti celebration effect and improved animations to create a delightful user experience.

## Changes

### 1. New Component: `src/components/referral/RegistrationSuccess.tsx`
Create a dedicated success component with:
- **Canvas-based confetti animation** that fires on mount -- colorful particles falling across the screen for 3-4 seconds
- **Animated checkmark** with a scale-in + pulse effect
- **"Thank You!" heading** above the existing "Registration Submitted" text, styled larger and in the primary brand color
- **Fade-in animations** on the text content (staggered delays for heading, subtext, and shield badge)
- The confetti will use lightweight custom canvas logic (no extra dependency needed)
- Upscaled text to match the kiosk-style design (2X sizing convention)

### 2. Update: `src/pages/vendor/VendorReferralRegistration.tsx`
- Replace the inline success state block (lines 250-268) with the new `<RegistrationSuccess />` component
- Keep the same `ReferralHeader` wrapper

## Technical Details

### Confetti Implementation
- A `<canvas>` overlay renders ~150 colorful particles with gravity, rotation, and fade-out
- Uses `requestAnimationFrame` for smooth 60fps animation
- Auto-cleans up after ~4 seconds
- Colors will use the Capital India brand palette (gold, teal, green accents)

### Animation Sequence
1. Confetti bursts immediately on mount
2. Checkmark icon scales in (0.3s delay)
3. "Thank You!" heading fades in (0.5s delay)
4. "Registration Submitted" subtitle fades in (0.7s delay)
5. Description text fades in (0.9s delay)
6. Security badge fades in (1.1s delay)

### No New Dependencies
All animations are implemented with CSS keyframes and a small canvas-based confetti script within the component -- no external libraries required.

