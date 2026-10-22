# Säkerhet och publicering

Programmet körs lokalt i webbläsaren och behöver inga API-nycklar, konton eller serverhemligheter. Utvecklingsservern binder till `127.0.0.1` och serverar endast appens HTML och källfiler.

Inför publiceringen den 22 oktober 2026 granskades arbetsfiler, Git-objekt och komprimerade säkerhetskopior. Gitleaks 8.30.1 och en separat mönstergranskning identifierade inga API-nycklar, token, lösenord eller privata nycklar. En skanning är inte en garanti för att allt har upptäckts.

Den publika historiken börjar med en rensad kodversion. Lokalt referensmaterial, äldre säkerhetskopior, testexporter och personlig dator-/commit-metadata ingår inte. Commit-adresser använder GitHubs noreply-format. Tredjepartsmaterial beskrivs i [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Lägg inte hemligheter i källkod, felrapporter eller skärmbilder. `.gitignore` undantar vanliga hemlighetsfiler, men redan spårade filer måste granskas separat. Kontrollera både diffen och historiken innan nya filer publiceras.
