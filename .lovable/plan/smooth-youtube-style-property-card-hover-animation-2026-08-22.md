# Smooth YouTube-Style Property Card Hover Animation

Implementing a more refined "YouTube-style" hover animation for property cards. Instead of a sudden zoom-in, the card will smoothly scale up and gain a colorful border effect, appearing to "lift" slowly with a delay before reaching its final state.

## Changes

### Styling
- Update `.hover-lift` and card styles in `src/styles.css` to use a smoother, slower `0.6s` cubic-bezier transition.
- Implement a "colorful" glow effect using a subtle animated border or shadow that activates on hover.
- Refine the scale factor to be less aggressive and more "pop-out" focused.

### Components
- Modify `src/components/site/PropertyCard.tsx` to remove hardcoded Tailwind scale classes that might conflict with the refined CSS.
- Ensure the z-index transition is handled correctly to avoid clipping issues during the animation.

## Technical Details
- Use `cubic-bezier(0.16, 1, 0.3, 1)` for the animation curve to match high-end UI patterns.
- Add a custom utility for the "colorful" glow using the primary and gold theme variables.
- Adjust `will-change` properties to optimize performance for the scaling transformation.
