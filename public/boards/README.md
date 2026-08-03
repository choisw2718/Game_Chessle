# Board image assets

This is the folder for full checkerboard images.

To add a board design:

1. Add a square image here (`.png`, `.jpg`, `.webp`, or `.svg`).
2. Open `lib/game/board-theme.ts`.
3. Add one item to `BOARD_DESIGNS`.
4. Set `board.image` to `/boards/your-file-name.png`.

The image should contain only the 8x8 board area. Do not include pieces,
coordinates, or an outer frame because the app draws those on top. A
1024x1024 image is recommended. Keep the first (top-left) square light.

Example:

```ts
{
  id: "my-image-board",
  name: "My Image Board",
  description: "A board loaded from public/boards.",
  pieceStyle: "classic",
  board: {
    light: "#f0d9b5", // fallback while the image loads
    dark: "#b58863",  // fallback while the image loads
    frame: "#6f4e37",
    coordLight: "#4c3728",
    coordDark: "#fff7e8",
    radius: "8px",
    shadow: "0 8px 22px rgb(0 0 0 / 20%)",
    image: "/boards/my-image-board.png",
  },
}
```
