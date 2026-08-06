# Third-Party Software Licenses

## Bundled runtime libraries

The supplied package includes local browser runtime files for Three.js, Cannon.js, and the Teal 3D dice renderer family. Their retained license/source records are in:

- `DICE_RENDERER_AND_SRD_LICENSES.md`
- `DICE_SOURCE_LICENSE.json`
- `../source-manifests/DICE_SOURCE_MANIFEST.json`

Three.js and Cannon.js are permissively licensed software. The dice renderer's exact retained provenance and license notice are preserved from the supplied package rather than inferred from filename alone.

## Previously researched lobby repositories

License notices retained from the supplied package are stored as separate files:

- `aarav-mishra-discord-clone-LICENSE.txt`
- `issam-seghir-nextjs-discord-clone-LICENSE.txt`
- `maheshnath09-discord-clone-LICENSE.txt`

No complete repository, `.git` history, demo application, dependency cache, tests, or unrelated examples from those projects are included in this production package.

## New dependencies

No new third-party JavaScript engine was imported during this merge. Phaser, PixiJS, and EasyStar.js were evaluated as research references, but the production build uses the existing project renderer plus original structured pathfinding/runtime code to avoid adding an unnecessary dependency and license surface.
