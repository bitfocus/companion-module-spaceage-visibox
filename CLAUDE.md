# CLAUDE.md

Bitfocus Companion module for Visibox, published by Spaceage. Everything in
`companion/manifest.json` and `companion/HELP.md` is shown to users on
bitfocus.io and inside Companion, so it follows the brand rules below.

## Brand rules

- The company is **Spaceage**: one word, capital S only. Never "SpaceAge",
  "Space Age", or "SpaceAge TV". The legal name is "Spaceage, LLC".
- The product is **Visibox**. Never "VisiBox" or "VISIBOX".
- The website is **https://spaceage.tv**. `visibox.tv` is not ours and does
  not resolve. Link the manual at https://manual.spaceage.tv.
- The module id `spaceage-visibox` is lowercase and permanent. Do not change
  it: Companion uses it to match existing connections.

## Releasing

Bitfocus lists whatever version was last submitted from a tag, so a change to
`manifest.json` or `HELP.md` shows on bitfocus.io only after a version bump
and a new release.
