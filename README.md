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
- **2.1 Networks including the internet → Thin & Thick Client Lab:** planned; its card describes cloud gaming versus locally installed single-player gaming and cannot be launched yet.

Routes use a hash so direct links and refreshes work on GitHub Pages without server rewrites:

- Catalogue: `/#/`
- Chapter: `/#/chapters/1`
- Syllabus section: `/#/chapters/1#section-1-2`
- Vector demo: `/#/chapters/1/vector-drawing-studio`

The studio links back to its chapter and the catalogue. The old `#top` and `#code-lab` fragments still lead to the studio.

## Adding a demo

1. Add its page under `src/pages/` and a route in `src/App.tsx`.
2. Add one entry to `demos` in `src/data/syllabus.ts`, with the matching `chapterId` and `sectionId`, a title, description and concepts. For an available demo use `status: 'live'` and its route as `path`; for an idea use `status: 'planned'` without a path.
3. Link the demo back to its chapter/section. The catalogue counts, navigation indicators and chapter cards update from the registry automatically.
4. Add an appropriate interaction check and run the checks below.

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

Vite uses a relative asset base, so the build supports a GitHub Pages project path without hard-coding a repository name. The catalogue and vector studio have no server or account dependency. Fonts are self-hosted.

The AS catalogue footer links to the separate IGCSE 0478 Playground. Each repository retains its own syllabus and publishing schedule.

## Project map

- `src/App.tsx`: course and demo routes
- `src/data/syllabus.ts`: chapter, section and demo registry
- `src/components/CourseLayout.tsx`: shared chapter navigation
- `src/pages/CataloguePage.tsx`: Paper 1 and Paper 2 chapter catalogue
- `src/pages/ChapterPage.tsx`: section groups and demo cards
- `src/pages/VectorStudioPage.tsx`: vector classroom page and interactions
- `src/catalogue.css`: responsive catalogue and chapter layouts
- `src/model.ts`: drawing model, geometry, SVG validation and export
- `src/styles.css`: responsive studio layout
- `tests/`: syllabus navigation, GitHub Pages hash routes, planned/empty chapters, geometry, input validation and linked classroom interaction checks
- `.github/workflows/deploy-pages.yml`: static GitHub Pages deployment

Fonts are distributed under SIL OFL 1.1. See `THIRD_PARTY_NOTICES.md` and `LICENSES/OFL-1.1.txt`.
