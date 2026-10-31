# PlayGround

## 💋 Midnight Hearts

A tiny pixel romance arcade game for phones, tablets, and browsers.

The city is full of heartbreakers, and Milo only has one night. Dodge their love,
then get close enough to **kiss** them. Every kiss restores life, builds a combo,
and buys a little more time before sunrise. Land **12 kisses** to win.

### Play

```sh
python3 -m http.server 3002
# or
npm start
```

Open <http://localhost:3002>. No install or build step required.

### Controls

| Action | Touch / mouse | Keyboard |
| --- | --- | --- |
| Move | Drag the on-screen joystick | `A` / `D` or `←` / `→` |
| Jump | `JUMP` button | `Space`, `W`, or `↑` |
| Kiss | `KISS` button | `E`, `F`, or `K` |
| Pause | `PAUSE` button | `P` / `Esc` |
| Mute | `SND` button | `M` |
| Tilt | `TILT` button | `T` |

Tilt is optional. It uses the device accelerometer in portrait and asks for the
iOS **Motion & Orientation** permission directly from the button tap. Touch and
keyboard controls remain available while tilt is on. On iPhone and iPad, serve
the game over HTTPS (localhost is exempt) so Safari can grant motion access.

### Features

- Hand-drawn pixel art rendered at a crisp low resolution on a responsive canvas.
- Four heartbreaker types with distinct hair, outfits, speed, and heart attacks.
- Kiss-based healing, combo scoring, escalating waves, and a 75-second sunrise goal.
- Synthesized chiptune soundtrack and sound effects — no audio files needed.
- Local high-score saving, pause/restart flow, haptics on supported devices,
  safe-area-aware layout, and reduced-motion support.
- Fully offline after the page loads, with the bundled Silkscreen font.

### Credits

Silkscreen typeface by Jason Kottke and contributors, licensed under the
[SIL Open Font License](assets/OFL.txt). All game art, code, and sound are
generated in this repository.

<!-- omgithub:readme:start -->
## 🚀 Build, play, and remix with OMGithub

**Created using [OMGithub.com](https://omgithub.com).**

[![OMGithub](https://img.shields.io/badge/OMGithub-Open%20project-orange?style=for-the-badge)](https://omgithub.com/MODY-2004/PlayGround)
[![GitHub](https://img.shields.io/badge/GitHub-Source-181717?logo=github&style=for-the-badge)](https://github.com/MODY-2004/PlayGround)

- 🎮 [Open the project](https://omgithub.com/MODY-2004/PlayGround).
- ✨ [Remix this project](https://omgithub.com/?remix=MODY-2004%2FPlayGround).
- 💻 [Explore the source](https://github.com/MODY-2004/PlayGround).
- 🛠️ [Check build runs](https://github.com/MODY-2004/PlayGround/actions).
- 🐛 [Report an issue](https://github.com/MODY-2004/PlayGround/issues).
- 👤 [Explore the creator's projects](https://omgithub.com/MODY-2004).
- 🌍 [Create with OMGithub](https://omgithub.com).
<!-- omgithub:readme:end -->
