# Chuck Yeager's Air Combat — Rebuild

Browser tribute to Electronic Arts' 1991 combat flight sim by Brent Iverson, with Chuck Yeager as technical consultant.

This is an unofficial fan reconstruction. Not affiliated with EA or the Yeager estate.

## Play

Open `index.html` locally (needs a static server because of ES modules) or visit the deployed URL.

```bash
npx serve .
```

## Mission

**Ace in a Day** — 12 October 1944. Fly a P-51D Mustang and destroy five Bf 109s, echoing Yeager's five-kill engagement near Dummer Lake.

Also includes **Free Flight**.

## Controls

| Action | Keys |
| --- | --- |
| Pitch / roll | WASD or arrows |
| Rudder | Q / E |
| Throttle | R / F |
| Guns | Space |
| Camera | C |
| Padlock pipper | T |
| Pause | Esc |

## Stack

Single-page Three.js (r160) module. No build step.

## What this is (and isn't)

The 1991 original had ~50 historical missions across WWII, Korea, and Vietnam, six flyable fighters, a mission builder, and Yeager's digitized voice. This rebuild is a playable slice: one signature WWII dogfight, a readable arcade-sim flight model, HUD, and briefing/debrief in the spirit of the original.
