# Sanctuary performance and loading brief

Status: implemented and locally validated, October 6, 2026. The owner selected **Keep the current balance of detail and smoothness** after opening the preview. Physical low-end-device coverage remains unverified. See [implementation evidence](validation/performance-2026-10-06/README.md).

## Objective

Deliver the best visual experience each visitor's browser can sustain. Judge success by the combined experience of smooth motion, responsive interaction, coherent loading, and visual quality. Optimize from evidence rather than pursuing scores or reducing effects indiscriminately.

Preserve the complete authored presentation on capable devices. Remove unnecessary work for everyone; reduce visible quality only when sustained performance indicates a need. Device model names and the mobile/desktop distinction must not determine graphics quality by themselves.

## Experience requirements

- Keep the white marble ribbon, black and gold frames, tinted glass, composition, and project interactions intact.
- Preserve continuous independent cloud, mist, and lighting motion. Downward travel advances Daylight → pink sunset → night → golden sunrise; atmospheric wind remains independent of scrolling.
- Adapt layout and input to viewport and input capabilities separately from graphics quality. Touch, mouse, keyboard, resizing, and orientation changes must remain usable.
- Prefer smooth, stable motion over intermittent peaks in detail. Aim near 60 fps where sustainable; tolerate a modestly lower stable cadence on constrained devices before sacrificing the identity of the scene.
- Treat frame targets as engineering budgets, not a claim about every device. Provisional review bands: near 60 fps preferred, sustained 40–50 fps potentially acceptable after interaction and visual review, and persistent sub-30 fps or repeated long stalls requiring investigation.
- Do not force a 60 fps interpretation onto higher-refresh displays or mistake hidden-tab throttling, loading, or reduced-motion behavior for weak hardware.
- Honor reduced-motion preferences independently of performance. Audio must remain controlled by user consent.

## Loading as part of the design

The eye communicates preparation; it is not an arbitrary delay or a simulated percentage bar.

1. **Immediate eye:** show the lightweight eye as early as practical, independently of the 3D bundle. While essential content prepares, use restrained partial blinks. With reduced motion, use a calm static state.
2. **Readiness-driven opening:** fully open once essential visible assets, the control, core sky, and shaders are usable. Do not wait for every optional enhancement, and do not add a mandatory extra blink cycle after readiness.
3. **Control handoff:** use the eye-to-central-control transition to prepare secondary effects without interrupting the handoff or changing the audio interaction.
4. **Travel and background reveal:** use the central object's movement and gradual background appearance as further preparation time. Newly ready enhancements must blend into the existing scene without flashes, missing objects, replacement skies, or sudden lighting changes.
5. **Usable scene:** allow normal interaction when the entrance finishes. Failures must provide readable project access and a recovery path rather than an indefinite animation.

The entrance duration should follow actual work. Fast visits should not be deliberately stretched; slow visits should retain visible feedback and a bounded path to useful content. Avoid competing CPU/GPU tasks during the most visually sensitive transitions.

## Optimization policy

- Establish a reproducible baseline before changing expensive paths.
- Separate network, CPU, GPU, and memory bottlenecks. A smaller download is not necessarily cheaper rendering.
- Prioritize high cost with low perceptual benefit: repeated allocations, redundant asset requests, excess pixel work, unchanged render passes, and unnecessary per-frame calculations.
- Keep changes whose measured or demonstrable benefit justifies their complexity. Avoid speculative rewrites and micro-optimizations without practical impact.
- Use browser capability hints only as optional starting information. Missing hints mean unknown capability.
- Adapt from sustained observed performance with warmup, multiple-frame windows, cooldowns, and slower recovery than degradation. Avoid visible oscillation and repeated failed quality upgrades.
- Prefer reversible resolution and rendering-budget adjustments before removing authored effects or changing materials. Preserve full quality when sufficient headroom exists.
- Keep diagnostics out of ordinary product UI. Development tools may expose readiness, quality, and workload measurements for validation.

## Validation and acceptance

Use the same scene seed, viewport, travel path, and rendering mode for comparisons. Distinguish production measurements from development overhead. Record both warm and cold entry, scroll/drag, selection and return, sustained atmosphere motion, and failure/recovery behavior.

Review desktop and compact layouts, available browser engines, reduced motion, constrained CPU/network conditions, and quality recovery. Inspect actual screenshots and interact with the scene; passing unit tests or a build does not establish visual acceptance.

Use the iOS Simulator when available to check Safari, viewport, touch behavior, and orientation. Emulation and Simulator results do not certify physical-phone graphics performance, battery consumption, or thermal stability. Record the exact tested environments and unresolved coverage gaps.

Acceptance requires:

- No regressions in the authored high-quality presentation or interaction contract.
- A visible, readiness-driven loading sequence without indefinite stalls.
- Bounded adaptation that improves constrained rendering without unnecessary detail loss on capable systems.
- Meaningful tests for readiness and quality-policy edge cases, plus lint and production build.
- Browser evidence for perceived motion, responsiveness, continuity, and appearance; honest disclosure of untested physical devices.

## Working method

The lead frontend SWE owns integration and the user experience. Delegate bounded entrance, rendering, and verification tasks where useful, using capable models and careful reasoning. Preserve unrelated work and existing assets. Document measured outcomes separately from these durable requirements.
