# Atmosphere refinement: distance, time, light, and motion

**Implemented on the homepage (October 6):** the owner approved all three
effects together at a noticeable but natural level. `OrbitSky` now mounts
the balanced `SkyAtmosphericMotion` mix: eight sailing-cloud surfaces,
eight flowing-mist surfaces, and one world-aligned shaft sphere. Shared
artwork is loaded once and reused by fixed and moving clouds. Near/far speeds
and staggered long loops are retained. Combined opacity is lower than the
individual studies, with lighter mist at noon/night. Light shafts sway more
slowly and rise/fall over a 72-second ambient cycle, strongest at dawn/dusk.
Read [integration and browser validation](validation/integrated-motion-2026-10-06/README.md).
The preview-only statements below describe earlier selection rounds.

**Latest motion-preview direction (October 6):** the owner rejected the subtle
studies as barely visible. Wind-driven clouds and mist must travel visibly
even while the user is idle. Scrolling changes the day forward/backward; it
does not reverse, accelerate, freeze, or reset wind. World time supplies the
palette, sun/moon placement, lighting, shadows, and effect visibility. Ambient
seconds drive cloud translation, mist curl, shaft sway, twinkling, and transient
meteor travel. Existing navigation stays intact. `/motion-preview` provides
stronger sailing clouds, flowing mist, moving light shafts, and a clouds/mist
combination for selection; these are not yet enabled on the homepage.
The owner then selected the moving-cloud direction, requesting different
layer speeds with a restrained overall pace so the limited source shapes
do not feel repetitive. Preview bank speeds are 8.4/4.8 scene units per second
at near/far depths, with staggered 40/56-second loops; mist uses 10.8/6.0
and 32/46-second loops. Different atlas shapes are used at the two depths.
The foreground passes faster in the view, while the distant banks drift slowly.

**October 6 correction:** the owner found the first implementation too subtle.
All four moods now receive equal dominant travel, with long full-color cores
and gradual transitions. Golden sunrise is distinct from pink sunset; shadows,
stars, meteors and continuous cloud travel are visibly stronger. Meteors now
continue throughout night, superseding the earlier midnight cutoff. See
[current implementation and actual motion proof](validation/atmosphere-visibility-2026-10-06/README.md).
The October 5 proposal and scored implementation below are historical where
they differ from that correction.

October 5, 2026. The owner selected **rank 1: continuous celestial paths with
soft fades**, and approved the proposed atmosphere effects for implementation.
The later instruction explicitly relaxes exact distance/time and shadow
proportionality: the result should make visual sense, avoid obvious errors,
and remain performance friendly. That instruction supersedes the strict
mathematical requirements in the original brainstorming proposal below.

The implementation retains the established eased, user-travel-driven clock
and parked idle time. It uses art-directed sun/moon arcs and safe shadow
elevations, without attempting an astronomical simulation. Compact views use
a narrower world-space arc; camera orbit remains unrestricted. The requested
Astra High review has a maximum of three formal rounds and an 8/10 target on
the owner's professional/award-caliber benchmark. An actual score and any
remaining limitations must be reported honestly; the target is not a guarantee.

**Completed local result:** [implementation, final screenshots and validation](validation/atmosphere/README.md).
The three formal Astra High scores were **7.2 → 7.5 → 7.8/10**. The 8.0 target
was not reached. Visual iteration stopped at the requested three-round limit.

## A clearer way to describe the idea

“Let vertical travel carry the scene smoothly through a full day. Sky
color, illumination, shadow direction, reflections, and the visibility of the
sun, moon, and stars should feel coordinated with that journey. Favor
believable visual transitions and efficient rendering over exact physical or
mathematical synchronization. Sunrise, bright
daylight, sunset, and night should be beautiful moments within one continuous
transition, rather than separate scenes.”

The concise phrase is **a travel-driven day–night cycle with visually coherent
lighting and shadows**. Shared timing keeps the atmosphere connected while
allowing artistic easing, safe shadow angles, and composition adjustments.

## Baseline inspected during planning

- The local page on port 3000 was visually inspected in this planning turn.
  The current marble, dark metal, tinted glass, and floating composition remain
  the reference. The concept board uses the saved actual material-depth
  daylight capture, with the camera held constant across its studies.
- `sanctuaryAtmosphere.ts` uses eight user-driven ribbon turns per day,
  starting at noon, with one shared palette/light snapshot.
- `useRibbonMotion.ts` feeds `motion.userPosition` into a second atmosphere
  smoothing step. Visible ribbon motion also contains idle cruise. This means
  the existing implementation is not an exact mapping of total visible travel
  to world time, especially during idle motion and transient input.
- Dawn and dusk currently share one `dusk` palette. The requested warm
  red/gold sunrise and pink/lavender sunset need distinct color anchors.
- Clouds currently have fixed silhouettes with internal flow. Stars and
  meteors already exist; improved motion and scheduling are refinements.
  A visibly coordinated sun/moon system remains proposed work.

## Travel coordinate — original strict proposal, relaxed by the selection above

Let `u` be continuous signed vertical journey distance in ribbon turns,
oriented so ascent advances time. Proposed initial scale: eight turns per
24-hour day, retaining the current overall cycle length. One turn represents
three world hours. With the current pitch of 10.6 scene units, one day spans
84.8 vertical scene units; these are scene units, not physical meters.

`unwrappedHours = 12 + 3 × u`

Wrap only the sampled time into 0–24 hours. Never reset the journey coordinate
when recycling geometry. Derive time from the final eased travel coordinate,
not raw wheel pixels, input-event counts, or a second independently eased
clock. Wheel/touch acceleration affects how quickly distance is covered; it
must not alter how much world time that distance represents. Camera focus and
presentation transforms are not journey distance.

At the same journey coordinate, sky, light, celestial placement, and shadows
must return to the same state. Reverse travel reverses the time cycle.
Cloud drift and transient meteor events may continue independently.

**Selected implementation policy:** retain the existing parked world time
during idle cruise. Explicit navigation advances/reverses the eased clock;
ambient cloud drift continues independently. This is consistent with the
owner's relaxed relationship requirement and preserves existing navigation.

**October 6 direction clarification:** scrolling down, experienced as the
camera moving upward through the scene, advances time. Ribbon input stores
that direction as negative travel, so atmosphere travel is its negation.
Starting at noon the order is daylight → pink sunset → night → golden sunrise
→ daylight. Scrolling up reverses this order. Geometry and camera input keep
their established directions; only the mapping into world time changes.

## Four visual anchors within a continuous day

These times are art-direction anchors, not astronomical predictions. Starting
at the existing noon view, the journey is noon → sunset → midnight → sunrise
→ noon. The same four anchors repeat smoothly in either direction.

| Anchor | World time | Travel from initial noon | Visual direction |
| --- | --- | --- | --- |
| Pearl daylight | 12:00 | 0 / 8 turns | Cool pearl white, faint ice-blue sky, calm luminous clouds, readable marble veins and soft gray shadows. Soft sun glow is sufficient; omit a prominent disc at noon. |
| Pink sunset | 18:00 | 2 turns / 25% | Rose and blush clouds, peach horizon, lavender shadowed cloud faces; restrained warm metal glints and long soft shadows. |
| Moonlit night | 00:00 | 4 turns / 50% | Deep blue/indigo, a modest softly textured moon, sparse stars, silver-blue cloud rims and enough fill to retain marble and dark-metal separation. |
| Red/gold sunrise | 06:00 | 6 turns / 75% | Warm coral-red horizon, amber-gold cloud rims, fresh warm illumination and long shadows from the opposite horizon to sunset. |

Suggested palette regions: dawn 04:30–08:00; pearl daylight 08:00–16:00;
pink sunset 16:00–19:30; blue hour 19:30–21:00; night 21:00–04:30.
Boundaries blend; they are not cuts, stops, scrolling sections, or forced
holds. Do not slow the clock to linger on a favorite view. Broaden its palette
curve instead, preserving the distance/time ratio.

“Pure white” describes the daylight mood, not clipped white pixels. Preserve
the material-depth pass's readable veins, glass edges, and shaped highlights.

## Sun and moon: ranked choices

Scores are subjective fit estimates for this brief, not measured benchmarks.
Weights: lighting/shadow coherence 35%, calm visual quality 30%, composition
control 20%, implementation simplicity 15%. Each criterion is 0–10; allow
roughly ±5 points on totals until viewing a real prototype.

| Rank | Option | Coherence | Calm quality | Composition | Simplicity | Total |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| 1 | Continuous world-space paths, with horizon/atmosphere fades | 10 | 9 | 8 | 7 | 89.5 → **90/100** |
| 2 | Fixed world-space appearance locations, fading in/out | 6 | 9 | 10 | 9 | **81/100** |

**Selected: option 1.** One shared celestial direction can locate the
visible body, its directional light, cloud lighting cues, and reflected
highlights. The current scene already rotates a shadow light. The hard part is
the visual handover between sun and moon and the cloud artwork's baked light,
not independently animating every shadow.

Use slow, art-directed paths in world space. Celestial motion follows journey
time, not a second real-time clock. Objects can pass outside the camera view;
never pin a moon to a screen corner or limit the existing unrestricted orbit
to keep it visible. Fade the sun into bright haze around noon; retain a small
warm disc near dawn/dusk only if it improves the composition. At night the
moon and stars remain legible from suitable viewing directions.

A stylized sun/moon opposition is acceptable for this dreamlike world. It is
not a physically accurate lunar calendar. Use a coherent sun-lit moon phase
and avoid an unrelated decorative crescent.

Option 2 provides excellent framing, but does not eliminate shadow matching:
while a disc is visible, its light must point from that same world direction.
Holding the light fixed weakens continuous directional progression; rotating
it while the disc stays fixed creates a visible contradiction. Repositioning
only when a disc is fully hidden can disguise the change, with carefully
softened shadows, but this compromises the continuous-world premise.

For either option, avoid abrupt key-light flips and two strong competing
shadow sets. Through twilight, reduce directional dominance, keep sky fill,
and softly transfer the dominant shadow source from sun to moon. Directional
light position/target defines its direction in
[Three.js](https://threejs.org/docs/pages/DirectionalLight.html); tying the
visible body to that vector is the proposed application design.

## Effects and their distribution

Start with the owner's requested effects and a few related refinements. All
numbers below are prototype tuning ranges, not measured current behavior.

| Effect | When | Proposed behavior |
| --- | --- | --- |
| Traveling cloud wisps | All day | Two restrained depth layers in one prevailing world wind. Near vapor visibly drifts; distant structure moves much more slowly. Start around 1–3% of viewport width per 10 seconds in a representative crosswind view, with near/far speeds around 2:1. These are appearance checks, not screen-locked motion. |
| Cloud-edge illumination | Dawn/dusk strongest | Warm gold rims at dawn, pink/peach rims at dusk, silver-blue edges at night. Low intensity; no continuous flashing or rubbery pulsing. |
| Moon and stars | Evening through dawn | Moon emerges through twilight. Stars increase as the sky darkens and disappear gradually into dawn. Sparse, varied brightness; only a minority subtly twinkle. |
| Shooting stars | **18:00–00:00 only** | Eligibility/intensity rises from near zero at 18:00 to its peak around 21:00, then fades from 22:30 to zero by midnight. No new events in daylight, dawn, or after midnight. |
| Meteor cadence | Within eligible evening | Near peak, try one short visible event per 30–50 real seconds, with at least 15 seconds between events and at most one prominent trail. Near sunset and midnight, much rarer and dimmer. No immediate event on every threshold crossing. |
| Moon halo | Night | Very soft atmospheric halo, restrained size; moon texture stays legible. |
| Cloud-filtered light | Optional later pilot | Very low-amplitude, slow changes in local softness/illumination as vapor passes; no whole-scene exposure pumping. Select only if it improves the calmer baseline. |

Meteor frequency is an artistic schedule, not a claim about real meteor
astronomy. World time sets eligibility and intensity; active elapsed seconds
control the brief animation and spacing. Existing trails fade gracefully when
leaving eligibility, rather than popping or leaving bright trails after
midnight. Pause event timers when the page is hidden; do not replay a backlog
on return. Reverse scrubbing must not cause a meteor burst.

## Seamless clouds: what to preserve and what to move

Yes to flowing clouds, provided they belong to the existing cloud world.
Retain the quiet broad sky and recognizable distant composition. Add or
extract thin vapor and wisps with soft alpha, subtle parallax, and sustained
translation. Start with a light optical presence (roughly 5–15% over the
background in representative wisps); decide by image quality rather than
layer count. Dense banks may need slower coherent displacement in the pilot.

Do not slide a second copy of the whole flattened image over the first: it
would double cloud silhouettes and carry the sky gradient with it. If an
identifiable formation moves, remove its stationary duplicate. Match cloud
edge color, haze, alpha, illumination and perspective across all four moods.
Cloud assets with strongly baked directional highlights may need relightable
layers or depth/normal approximations; tint alone cannot reverse their light.

Moon, stars and meteor trails sit behind the appropriate cloud opacity. Glass
must see the same composed sky. Keep world-space order and seamless coverage
through full camera orbits. The historical cloud continuity fixes remain
requirements, not grounds to accept popping or stationary “flow.”

## Original preview and selection sequence — completed; see implementation record

[Four-mood concept board](../assets/design-directions/atmosphere/four-moods.png)
was produced with the built-in image generator from the actual
[daylight capture](validation/material-depth/after-day.jpg). The
[generation prompt](../assets/design-directions/atmosphere/prompt.txt) is saved
beside it. It reinterprets cloud detail and is not a pixel-faithful lighting
simulation. The daylight sky is still bluer than the most restrained pearl
target; the selected final daylight can move closer to white while preserving
material contrast. The moon size and halo are also review choices.

1. Review the generated four-mood contact sheet for color, luminance, moon
   scale, celestial restraint, and retention of marble/metal depth. It is an
   illustrative concept, not a renderer capture or motion proof.
2. Compare the two celestial behaviors in the accompanying schematic. It
   illustrates coupling and placement tradeoffs, not final 3D shadow fidelity.
3. Select path behavior and idle-time policy. Keep sunrise, pearl daylight,
   pink sunset, moon/stars and evening meteors as the requested core. Treat
   halo, twinkle and cloud-filtered light as adjustable refinements.
4. After selection, implement the shared coordinate first, distinct dawn/dusk
   palettes second, celestial/light coordination third, cloud pilot fourth,
   and event scheduling last. Review actual fixed-camera captures and moving
   previews before replacing the accepted baseline broadly.

Acceptance later: equal actual travel gives equal time; reversing returns to
the same lighting; no seam across a full day or geometry recycling; shadows
agree with visible celestial directions; all four moods preserve material
detail; cloud drift is visible while parked; stars/meteors are occluded by
clouds; midnight events taper cleanly; reduced motion keeps composed still
clouds and disables ambient drift/twinkle/meteor animation.

The generated board remains a reference. Actual implementation captures,
review scores, and validation will be recorded in `validation/atmosphere/`.
New sound and deployment are outside this local refinement pass.
