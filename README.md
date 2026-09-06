# Gregg’s AS CS Playground

A standalone AS 9618 classroom demo project, starting with **Vector Drawing Studio**. The two existing AS classroom projects are not included. This prototype shares the visual language and Vite/React foundation of Gregg’s IGCSE CS Playground; it does not change the IGCSE project.

## Teaching focus

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

Vite uses a relative asset base, so the build supports a GitHub Pages project path without hard-coding a repository name. The single demo has no server or account dependency. Fonts are self-hosted.

Recommended structure: keep this AS repository separate from the IGCSE 0478 repository, with links between the two homepages when the AS catalogue is added. This keeps each syllabus and publishing schedule independent while retaining Gregg’s Playground branding.

## Project map

- `src/App.tsx`: classroom page and interactions
- `src/model.ts`: drawing model, geometry, SVG validation and export
- `src/styles.css`: responsive studio layout
- `tests/`: geometry, input validation and linked classroom interaction checks
- `.github/workflows/deploy-pages.yml`: static GitHub Pages deployment

Fonts are distributed under SIL OFL 1.1. See `THIRD_PARTY_NOTICES.md` and `LICENSES/OFL-1.1.txt`.
