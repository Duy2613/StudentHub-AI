# Asset usage policy

## Non-authoritative visual references

All supplied visual references are concept art. They communicate atmosphere, composition, material language, and the Khai Minh visual metaphor. They do not establish:

- a real case, source, citation, expert, portrait, testimonial, statistic, community count, price, learning record, or outcome;
- a product status, verdict, trust score, confidence value, date, location, or backend record;
- a supported route, feature, navigation item, or data contract.

## Allowed use

- Use the generated text-free hero as a visual background with real text layered by the app.
- Use clean, text-free supplied scenes as very low-opacity atmospheric backgrounds behind live product surfaces.
- Use crops, masks, blur, duotone treatment, and scrims to remove attention from any incidental source text.
- Keep all meaningful UI copy, numbers, labels, identities, and state badges in React components backed by the route contract.
- Mark a human figure or portrait as illustrative unless it is supplied by the actual identity or expert backend.

## Prohibited use

- Never reproduce embedded concept-art copy as if it were a StudentHub result.
- Never expose embedded statistics, fake citations, fake expert portraits, testimonials, map labels, case titles, pricing, or community activity as live data.
- Never use a concept-art panel as a clickable product control or fake screenshot.
- Never point `next/image`, CSS, metadata, or a route registry at the original PNGs in `originals/`.
- Never make an image imply that an expert directory, case archive, or community record is populated when the backend returns an empty state.

## Responsive and accessibility rules

- Prefer desktop/tablet/mobile AVIF derivatives from the registry.
- Keep decorative images `aria-hidden` and give them empty alt text.
- Use a truthful short alt description when the image carries non-text meaning.
- Reduce opacity and remove parallax, camera motion, and large transforms under `prefers-reduced-motion: reduce`.
- Preserve readable contrast by placing text on a separate scrim or product surface.
