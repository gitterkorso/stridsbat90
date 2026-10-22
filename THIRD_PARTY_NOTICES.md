# Licenser och referenser

Projektets egen källkod, verktyg och egen dokumentation omfattas av [MIT-licensen](LICENSE).

## Three.js och OrbitControls

`src/vendor/three.min.js` och `src/vendor/OrbitControls.js` kommer från **Three.js r128**, Copyright © 2010–2021 Three.js Authors, och distribueras under MIT. Fullständig ursprunglig licens finns i [src/vendor/LICENSE.threejs](src/vendor/LICENSE.threejs). Byggverktyget inkluderar projektets och Three.js licenstexter i de genererade HTML-filerna.

- [Three.js r128](https://github.com/mrdoob/three.js/tree/r128)
- [Ursprunglig licens](https://github.com/mrdoob/three.js/blob/r128/LICENSE)

## Windows-programmets körmiljö

Windows-releasen paketeras med [Electron 45.0.0](https://github.com/electron/electron/tree/v45.0.0) och innehåller Chromium och Node.js. Electron distribueras under MIT; körmiljön innehåller även tredjepartskomponenter med egna licenser. Electrons `LICENSE.electron.txt` och Chromiums `LICENSES.chromium.html` följer med programmet. Byggverktyg och låsta versionsnummer listas i `package.json` och `package-lock.json`.

## Visuella referenser

Båtmodellen är projektets kodbaserade rekonstruktion. Tillverkarfoton, ritningar, rapporter och andra externa källor som använts för jämförelse omfattas av sina respektive upphovsrätter och villkor. Projektets MIT-licens ger inga rättigheter till dessa original eller till varumärken.

Nedladdade referensfiler, PDF-utdrag, arbetskopior och äldre bildarkiv distribueras inte i den publika versionen. [Källförteckningen](docs/research/cad-source-search.md) innehåller länkar till ursprungliga utgivare. Filnamn i äldre granskningsrapporter avser lokalt referensmaterial.

Detta är ett fristående projekt utan officiell anknytning till tillverkaren eller Försvarsmakten.
