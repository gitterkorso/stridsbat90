# Bygg Windows-programmet

Windows-versionen paketerar `dist/index.html` med Electron. Samma källkod används i webbläsaren och skrivbordsprogrammet. Programmet laddar endast den lokala sidan; renderingens Node.js-integration är avstängd och processen är isolerad.

På Windows med Node.js 24:

```powershell
npm ci
npm start
```

Bygg och verifiera en release:

```powershell
npm run release:win
$env:CB90_EXECUTABLE = (Resolve-Path 'release/win-unpacked/CB90 H.exe').Path
npm run test:desktop
node tools/portable-test.cjs
```

`release/` innehåller en portabel `.exe`, ett installationsprogram och `SHA256SUMS.txt`. Mappen `win-unpacked` är endast till för testning. Distribuera de två fristående EXE-filerna och kontrollsummorna, inte arbetsmappen, lokala referenser eller testbilder.

Bygget använder låsta beroendeversioner i `package-lock.json`. Nätåtkomst behövs vid första bygget för att hämta Electron och paketeringsverktygen. Användaren behöver ingen nätanslutning för att köra det färdiga programmet. Licenser för projektet, Three.js, Electron och Chromium följer med paketet.

Releasen 1.0.0 är osignerad. Kodsignering kan konfigureras via electron-builders normala certifikatinställningar; lägg aldrig certifikat eller lösenord i repot.

Höj `version` i `package.json`, uppdatera låsfil och releaseinformation, bygg och testa innan nästa version publiceras på GitHub Releases. Källkodstaggen ska motsvara exakt de filer som byggdes.

Paketeringsformaten beskrivs i [electron-builders dokumentation](https://www.electron.build/nsis.html). Processisoleringen följer [Electrons säkerhetsrekommendationer](https://www.electronjs.org/docs/latest/tutorial/security).
