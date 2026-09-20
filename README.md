# Gregg’s AS CS Playground

A standalone classroom demo collection organised by the **12 AS chapters of the Cambridge Computer Science 9618, 2027–2029 syllabus**. Each chapter has its own page, with demonstrations grouped under the matching syllabus section. It shares the visual language of Gregg’s IGCSE CS Playground. The separate binary-fractions and P2P classroom projects are not included.

## Course catalogue

The homepage and chapter navigation separate the two AS papers:

| Paper                                                        | Chapters                                                                                                                                                                            |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Paper 1 · Theory Fundamentals                                | 1 Information representation; 2 Communication; 3 Hardware; 4 Processor Fundamentals; 5 System Software; 6 Security, privacy and data integrity; 7 Ethics and Ownership; 8 Databases |
| Paper 2 · Fundamental Problem-solving and Programming Skills | 9 Algorithm Design and Problem-solving; 10 Data Types and Structures; 11 Programming; 12 Software Development                                                                       |

Chapter and section names follow the AS subject content in the 2027–2029 syllabus, printed pages 14–31. Empty chapters remain browsable so future demos have a clear home.

- **1.2 Multimedia → Vector Drawing Studio:** available now.
- **2.1 Networks including the internet → CSMA/CD: Six Steps:** an English-only shared Ethernet demonstration.
- **2.1 Networks including the internet → Thin & Thick Client Lab:** available now; play the same Packet Run maze through a simulated cloud stream and as an installed single-player game.

Routes use a hash so direct links and refreshes work on GitHub Pages without server rewrites:

- Catalogue: `/#/`
- Chapter: `/#/chapters/1`
- Syllabus section: `/#/chapters/1#section-1-2`
- Vector demo: `/#/chapters/1/vector-drawing-studio`
- CSMA/CD demo: `/#/chapters/2/csma-cd`
- Thin/thick client demo: `/#/chapters/2/thin-thick-client-lab`

The studio links back to its chapter and the catalogue. The old `#top` and `#code-lab` fragments still lead to the studio.

## Packet & Frame Journey

Chapter 2.1 includes `/#/chapters/2/packet-frame-journey`: a bilingual, step-by-step Ethernet / IPv4 / TCP encapsulation demonstration. Switch between same-subnet and routed delivery, play or scrub the sequence, and inspect header fields. The five-layer teaching view maps to the four TCP/IP layers. Routing changes Ethernet addresses, FCS, TTL and the IPv4 header checksum; this example excludes NAT, fragmentation and errors.

## Adding a demo

1. Add its page under `src/pages/` and a route in `src/App.tsx`.
2. Add one entry to `demos` in `src/data/syllabus.ts`, with the matching `chapterId` and `sectionId`, a title, description and concepts. For an available demo use `status: 'live'` and its route as `path`; for an idea use `status: 'planned'` without a path.
3. Link the demo back to its chapter/section. The catalogue counts, navigation indicators and chapter cards update from the registry automatically.
4. Add an appropriate interaction check and run the checks below.

## CSMA/CD: Six Steps

An English-only demonstration follows **Listen → Transmit → Detect collision → Stop → Wait → Retransmit**. Use **Next event** or **Play / Pause** to follow two workstations on one shared half-duplex Ethernet channel. Separate scenarios show that a busy channel prevents transmission and that one sender can succeed without collision handling.

After a collision, both data frames are aborted and a jam signal is shown. Each workstation independently draws a random back-off. At step 5, teaching controls can redraw the waits, force equal waits (causing another collision), or force different waits (showing recovery). Retries always include carrier sense; an expired wait does not permit transmission while another frame occupies the channel. Either workstation can retry first.

The possible random values are 0–1 after collision 1, 0–3 after collision 2, then 0–7. The range uses `2^min(n, 10) - 1` and each random value represents that many slot times. It is the **range**, not necessarily every individual draw, that increases. After 16 unsuccessful attempts the frames are abandoned. A table retains the choices made in each round.

The animation is a protocol-event model, not a timing-accurate Ethernet implementation. A successful frame occupies three illustrative slot times to show why a later retry may need to defer; propagation, jam and inter-frame timing are compressed. The explanations distinguish shared half-duplex Ethernet from switched full-duplex Ethernet and Wi-Fi.

## Thin & thick client lab

Two copies of the same maze receive identical arrow-key, WASD or on-screen button input. Collect three packets and reach the exit. **Run example route** resets both games and supplies the same complete route; **Reset both** also cancels pending work.

- Change round-trip network delay (0–800 ms). Cloud input travels to the server, game logic/rendering/encoding happens there, then a video frame returns for client decoding and display. The local game does not wait for this network.
- Choose the same client hardware for both screens. The gaming PC uses 32 ms per local move and 12 ms for cloud decoding; the basic laptop uses 240 ms and 24 ms respectively. Server work remains 24 ms. These are illustrative timings, not measured benchmarks or frame-rate claims.
- Disconnect during play. The cloud screen retains its last frame while the installed single-player game continues. Reconnection sends the last processed server state to the screen. Offline inputs and discarded in-flight transfers are not replayed.
- Follow active processing stages, compare the server position with the displayed position, and read simulated input-to-display latency. Queued moves add waiting time; each side accepts up to 24 pending moves to bound rapid key input. Changes to timing settings apply to newly submitted moves.

Both architectures are simulated locally; GitHub Pages needs no game server. The model does not measure the user's connection and does not simulate bandwidth, video quality, jitter or packet loss. A thin client still captures input and decodes video. Thick clients may also use networks; offline continuity here is specific to an installed single-player game. This lab compares processing allocation, not mutually exclusive device types.

## Vector studio teaching focus

Cambridge 9618, 2027–2029 syllabus, section **1.2 Multimedia → Graphics**, printed page 15: understand how vector graphic data are encoded using the terms **drawing object**, **property**, **drawing list**.

The studio connects a selectable SVG canvas, an ordered drawing list and editable object properties. Rewind and draw one object at a time; reorder objects to explain overlap. Zoom to show that geometry can be redrawn at a different scale. The display ultimately uses screen pixels; the stored SVG describes shapes rather than recording each pixel’s colour.

## Drawing tools and syntax

- Draw rectangles, circles, ellipses and lines by dragging. Circle drags start at the centre.
- Select a shape on the canvas or in the list. Change position, dimensions, fill, stroke and stroke width.
- The canvas supports arrow-key movement; hold Shift for 10-unit movement. The syntax examples also have an Add button, so drawing does not require a pointer.
- Edit real SVG shape elements and apply them to the same drawing model. Unsupported syntax is explained, and the previous image remains intact on errors. Pending source edits are protected from canvas and property edits until applied or discarded.
- Three examples: overlapping shapes, a robot portrait and concentric circles. A blank canvas is available in the example selector.
- Save a standalone SVG without editor grid or selection overlays. Undo retains up to 30 drawing changes within the current session.

SVG is a teaching example, **not a claim that Cambridge requires this exact syntax**. Supported elements are `rect`, `circle`, `ellipse`, `line`; supported colours are `#RGB`, `#RRGGBB`, or `none`. Geometry and colours are validated before creating display elements. No arbitrary markup or script is executed.

The list shows first-drawn objects first. Later objects may cover earlier ones. This is drawing order, rather than a reversed top-layer-first convention used by some design software. Selection boxes and the coordinate grid are editor guides, not drawing objects.

## Project location

Canonical working folder: `/Users/rubber/Desktop/Github/Gregg-s-playground-9618`.

GitHub repository: https://github.com/Nic98/Gregg-s-playground-9618

Run development, checks and Git operations from this repository root.

## Local preview

Use Node 22.13+:

```sh
npm ci
npm run dev
```

```sh
npm run lint
npm test
npm run build
```

## GitHub Pages

The project includes a GitHub Actions workflow that checks, builds and publishes pushes to `main`. The repository is `Nic98/Gregg-s-playground-9618`. Set **Settings → Pages → Source: GitHub Actions** to enable publication. The workflow publishes the validated site when changes are pushed to `main`.

Vite uses a relative asset base, so the build supports a GitHub Pages project path without hard-coding a repository name. The catalogue and demos have no server or account dependency. Fonts are self-hosted.

The AS catalogue footer links to the separate IGCSE 0478 Playground. Each repository retains its own syllabus and publishing schedule.

## Project map

- `src/App.tsx`: course and demo routes
- `src/pages/CsmaCdPage.tsx`: English six-step CSMA/CD classroom demonstration
- `src/demos/csma.ts`: carrier sense, collision handling, random back-off and retry events
- `src/csma-cd.css`: shared channel diagram and responsive lesson layout
- `src/data/syllabus.ts`: chapter, section and demo registry
- `src/components/CourseLayout.tsx`: shared chapter navigation
- `src/pages/CataloguePage.tsx`: Paper 1 and Paper 2 chapter catalogue
- `src/pages/ChapterPage.tsx`: section groups and demo cards
- `src/pages/VectorStudioPage.tsx`: vector classroom page and interactions
- `src/pages/ClientLabPage.tsx`: shared game controls, experiments and processing comparison
- `src/clientGame.ts`: common maze, movement and collection rules
- `src/clientSimulation.ts`: deterministic cloud/local timing, queues and connection state
- `src/components/ClientGameBoard.tsx`: shared accessible game display
- `src/client-lab.css`: responsive two-screen game lab
- `src/catalogue.css`: responsive catalogue and chapter layouts
- `src/model.ts`: drawing model, geometry, SVG validation and export
- `src/styles.css`: responsive studio layout
- `tests/`: syllabus navigation, GitHub Pages hash routes, empty chapters, client processing and disconnection, geometry, input validation and linked classroom interaction checks
- `.github/workflows/deploy-pages.yml`: static GitHub Pages deployment

Fonts are distributed under SIL OFL 1.1. See `THIRD_PARTY_NOTICES.md` and `LICENSES/OFL-1.1.txt`.
