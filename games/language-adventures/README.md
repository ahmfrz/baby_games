# Little Adventures — V2

Little Adventures is a toddler-friendly language and social-learning game built around five short adventures. The Home adventure now uses a short animated video as its story layer, with pause points and large touch hotspots layered over the video.

## Adventures

- **At Home** — tidying, finding Teddy, sharing, and bedtime
- **In the Park** — meeting a puppy, spotting nature, sharing, and following a path
- **At School** — greeting friends, packing school items, sharing supplies, and opening a book
- **In Nature** — discovering scenery, protecting nature, recycling, and caring for Earth
- **Around the World** — boarding a plane, matching landmarks, greeting the world, and exploring a map

## Gameplay

Each adventure contains four short activities using toddler-friendly tap, choice, and drag interactions. The Home adventure is the first video-driven prototype: a 10-second animated sequence is reused across four learning checkpoints, pausing for the toddler to find the ball, put it away, find Teddy, and put Teddy away.

Non-video adventures retain the explorer/globe reaction system. Video checkpoints use the animation itself for character movement and add lightweight success effects around the interactive target.

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

## Legacy character art

The existing reusable character assets remain available for the non-video adventures and completion/map surfaces. The Home video prototype does not depend on those character overlays; its toddler character is embedded in the generated video.

## V2.1 character art integration

The main explorer is based on the supplied toddler reference and is available as reusable transparent pose assets under `assets/new/characters/toddler/`. Mumma is based on the supplied reference and is available under `assets/new/characters/mumma/`.

- The map hero uses the toddler character.
- The Home adventure card uses Mumma.
- The active game uses toddler idle/point/happy/surprised poses.
- The Home adventure also shows Mumma as a supporting character.
- The completion screen uses the toddler celebration pose and Mumma encouragement pose.
- Original character-sheet source images are preserved under `assets/new/source/`.

## V2.2.2 video prototype fix

- The Home scenario explicitly declares `video: 'home-tidy-room.mp4'`, so the renderer reliably enters the video gameplay path.
- The Home MP4 is copied into `public/games/language-adventures/video/` so Vite copies it into the production deployment at a stable GitHub Pages URL.
- Video prompts and target hotspots stay hidden while the story is playing and appear only when the video reaches the configured pause checkpoint.
- Home checkpoints were aligned to the supplied 10-second Gemini clip: 1.85s, 5.00s, 6.85s, and 8.55s.
- Completing the final Teddy interaction now lets the video play through its final celebratory moment before showing the adventure completion screen.
- A visible video-load error state with Retry was added for failed production asset loads.
