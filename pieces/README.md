# Piece design assets

All piece images live in this folder. Their paths and rendering rules are
managed in one place: `lib/game/board-theme.ts`, inside
`PIECE_STYLE_OPTIONS`.

- `wK.svg` through `wP.svg` and `bK.svg` through `bP.svg` are the Classic set.
- `themes/red-tournament.png` is the Tournament sprite sheet.

For a 12-file set, add the white and black king, queen, rook, bishop, knight,
and pawn assets here (a subfolder is fine), then add one `renderMode: "files"`
entry to `PIECE_STYLE_OPTIONS`.

For a sprite sheet, put the image under `themes/`, then add one
`renderMode: "sprite"` entry with its image path, background size, horizontal
piece positions, and white/black row positions.
