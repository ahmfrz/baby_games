# Little Adventures — V2

Little Adventures is a toddler-friendly language and social-learning game built around five short adventures.

## Adventures

- **At Home** — tidying, finding Teddy, sharing, and bedtime
- **In the Park** — meeting a puppy, spotting nature, sharing, and following a path
- **At School** — greeting friends, packing school items, sharing supplies, and opening a book
- **In Nature** — discovering scenery, protecting nature, recycling, and caring for Earth
- **Around the World** — boarding a plane, matching landmarks, greeting the world, and exploring a map

## Gameplay

Each adventure contains four short activities using toddler-friendly tap, choice, and drag interactions. Activities have distinct visual surfaces and success choreography rather than relying on one generic interaction layout.

The explorer and globe companion react to instructions, correct answers, mistakes, and completion. Success effects are contextual to the activity.

## Architecture

The game keeps interaction state in `LanguageAdventureGame.js`, content in `languageData.js`, and presentation in `styles.css`. Artwork lives under `assets/new/`, including the reusable vector target library.

## Accessibility

- Large pointer targets
- Text prompts paired with audio narration when available
- Pointer/touch drag support
- `prefers-reduced-motion` support


## V2.1 polish

- Persistent total-star counter and adventure completion progress.
- Sound preference toggle with speech cancellation when muted.
- Live-region feedback for success/error states.
- Keyboard-visible focus treatment and touch-friendly controls.
- Session timer cleanup on timeout.
- Responsive compact HUD for small screens.

## V2.1 character art integration

The main explorer is based on the supplied toddler reference and is available as reusable transparent pose assets under `assets/new/characters/toddler/`. Mumma is based on the supplied reference and is available under `assets/new/characters/mumma/`.

- The map hero uses the toddler character.
- The Home adventure card uses Mumma.
- The active game uses toddler idle/point/happy/surprised poses.
- The Home adventure also shows Mumma as a supporting character.
- The completion screen uses the toddler celebration pose and Mumma encouragement pose.
- Original character-sheet source images are preserved under `assets/new/source/`.
