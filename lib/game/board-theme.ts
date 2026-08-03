export const BOARD_THEME_STORAGE_KEY = "chessle-expert:board-theme:v1";
export const CUSTOM_BOARD_COLORS_STORAGE_KEY = "chessle-expert:custom-board-colors:v1";
export const CUSTOM_PIECE_STYLE_STORAGE_KEY = "chessle-expert:custom-piece-style:v1";

export type PieceColor = "w" | "b";
export type PieceKind = "k" | "q" | "r" | "b" | "n" | "p";

interface BoardVisualDefinition {
  readonly light: string;
  readonly dark: string;
  readonly frame: string;
  readonly coordLight: string;
  readonly coordDark: string;
  readonly radius: string;
  readonly shadow: string;
  /**
   * Optional full 8x8 board-area image. Put the file in public/boards and
   * reference it as /boards/file-name.png (or .jpg/.webp/.svg).
   */
  readonly image?: string;
  readonly borderWidth?: string;
  readonly compactBorderWidth?: string;
  readonly pieceScale?: string;
  readonly pieceFilter?: string;
}

export interface BoardDesignDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly pieceStyle: PieceStyleId;
  readonly board: BoardVisualDefinition;
}

interface PieceStyleBase {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly defaultScale: string;
}

interface FilePieceStyleDefinition extends PieceStyleBase {
  readonly renderMode: "files";
  readonly assets: Readonly<Record<PieceColor, Readonly<Record<PieceKind, string>>>>;
}

interface SpritePieceStyleDefinition extends PieceStyleBase {
  readonly renderMode: "sprite";
  readonly spriteImage: string;
  readonly spriteSize: string;
  readonly positions: Readonly<Record<PieceKind, string>>;
  readonly rows: Readonly<Record<PieceColor, string>>;
}

export type PieceStyleDefinition = FilePieceStyleDefinition | SpritePieceStyleDefinition;

/**
 * Single source of truth for every built-in board design.
 *
 * To add an image board:
 * 1. Put its image in public/boards.
 * 2. Add one entry here and set board.image to /boards/your-file.png.
 */
export const BOARD_DESIGNS = [
  {
    id: "forest-classic",
    name: "Forest Classic",
    description: "The original warm wooden board.",
    pieceStyle: "classic",
    board: {
      light: "#d9c2a8",
      dark: "#87503c",
      frame: "#163d2e",
      coordLight: "#62715e",
      coordDark: "#e8dfc8",
      radius: "4px",
      shadow: "0 8px 20px rgb(14 43 32 / 18%)",
      pieceScale: "88%",
    },
  },
  {
    id: "blue-classic",
    name: "Blue Classic",
    description: "Slate blue board with crisp classic pieces.",
    pieceStyle: "classic",
    board: {
      light: "#edf0ef",
      dark: "#7d96c4",
      frame: "#526b9b",
      coordLight: "#52698d",
      coordDark: "#f5f7fa",
      radius: "3px",
      shadow: "0 8px 22px rgb(42 61 96 / 24%)",
      pieceScale: "91%",
      pieceFilter: "drop-shadow(0 1px 0 rgb(255 255 255 / 30%))",
    },
  },
  {
    id: "red-tournament",
    name: "Red Tournament",
    description: "Rounded crimson board with bold retro pieces.",
    pieceStyle: "tournament",
    board: {
      light: "#ddb9b6",
      dark: "#af1730",
      frame: "#b2263b",
      coordLight: "#9f2435",
      coordDark: "#f6d6d2",
      radius: "20px",
      shadow: "0 8px 0 #861325, 0 15px 28px rgb(91 13 31 / 24%)",
      image: "/boards/red-tournament.svg",
      borderWidth: "10px",
      compactBorderWidth: "7px",
      pieceScale: "96%",
    },
  },
] as const satisfies readonly BoardDesignDefinition[];

// Kept as a compatibility alias for existing imports.
export const BOARD_THEME_OPTIONS = BOARD_DESIGNS;

/**
 * Single source of truth for every piece design and all of its asset paths.
 */
export const PIECE_STYLE_OPTIONS = [
  {
    id: "classic",
    name: "Classic",
    description: "Crisp outline pieces",
    renderMode: "files",
    defaultScale: "88%",
    assets: {
      w: {
        k: "/pieces/wK.svg",
        q: "/pieces/wQ.svg",
        r: "/pieces/wR.svg",
        b: "/pieces/wB.svg",
        n: "/pieces/wN.svg",
        p: "/pieces/wP.svg",
      },
      b: {
        k: "/pieces/bK.svg",
        q: "/pieces/bQ.svg",
        r: "/pieces/bR.svg",
        b: "/pieces/bB.svg",
        n: "/pieces/bN.svg",
        p: "/pieces/bP.svg",
      },
    },
  },
  {
    id: "tournament",
    name: "Tournament",
    description: "Bold retro pieces",
    renderMode: "sprite",
    defaultScale: "96%",
    spriteImage: "/pieces/themes/red-tournament.png",
    spriteSize: "600% 200%",
    // The source artwork has uneven horizontal padding, so these positions
    // are calibrated to prevent neighboring silhouettes from bleeding in.
    positions: {
      k: "4.7%",
      q: "24.5%",
      b: "42.1%",
      n: "59%",
      r: "77.8%",
      p: "95.9%",
    },
    rows: {
      w: "0%",
      b: "100%",
    },
  },
] as const satisfies readonly PieceStyleDefinition[];

export type PieceStyleId = (typeof PIECE_STYLE_OPTIONS)[number]["id"];
export type PresetBoardThemeId = (typeof BOARD_DESIGNS)[number]["id"];
export type BoardThemeId = PresetBoardThemeId | "custom";

export interface CustomBoardColors {
  colorOne: string;
  colorTwo: string;
}

export interface ThemeStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export type DesignCssVariables = Record<`--${string}`, string>;

export const DEFAULT_BOARD_THEME: BoardThemeId = "blue-classic";
export const DEFAULT_CUSTOM_BOARD_COLORS: CustomBoardColors = {
  colorOne: "#f0d9b5",
  colorTwo: "#b58863",
};
export const DEFAULT_CUSTOM_PIECE_STYLE: PieceStyleId = "classic";

const CUSTOM_BOARD_DESIGN: BoardDesignDefinition = {
  id: "custom",
  name: "My Checkerboard",
  description: "A checkerboard made with your own two colors.",
  pieceStyle: DEFAULT_CUSTOM_PIECE_STYLE,
  board: {
    light: DEFAULT_CUSTOM_BOARD_COLORS.colorOne,
    dark: DEFAULT_CUSTOM_BOARD_COLORS.colorTwo,
    frame: DEFAULT_CUSTOM_BOARD_COLORS.colorTwo,
    coordLight: "#26312a",
    coordDark: "#f7f7f2",
    radius: "7px",
    shadow: "0 9px 23px rgb(20 28 24 / 22%)",
  },
};

export function isBoardThemeId(value: unknown): value is BoardThemeId {
  return value === "custom" || BOARD_DESIGNS.some((theme) => theme.id === value);
}

export function isPieceStyleId(value: unknown): value is PieceStyleId {
  return PIECE_STYLE_OPTIONS.some((style) => style.id === value);
}

export function getBoardDesign(theme: BoardThemeId): BoardDesignDefinition {
  if (theme === "custom") return CUSTOM_BOARD_DESIGN;
  return BOARD_DESIGNS.find((option) => option.id === theme) ?? BOARD_DESIGNS[0];
}

export function getPieceStyle(pieceStyle: PieceStyleId): PieceStyleDefinition {
  return PIECE_STYLE_OPTIONS.find((option) => option.id === pieceStyle) ?? PIECE_STYLE_OPTIONS[0];
}

export function resolvePieceStyle(
  theme: BoardThemeId,
  customPieceStyle: PieceStyleId = DEFAULT_CUSTOM_PIECE_STYLE,
): PieceStyleId {
  return theme === "custom" ? customPieceStyle : getBoardDesign(theme).pieceStyle;
}

export function withBasePath(assetPath: string, basePath = "") {
  return `${basePath}${assetPath}`;
}

export function boardThemeUsesImage(theme: BoardThemeId) {
  return Boolean(getBoardDesign(theme).board.image);
}

export function pieceAssetPath(
  pieceStyle: PieceStyleId,
  color: PieceColor,
  piece: PieceKind,
  basePath = "",
) {
  const definition = getPieceStyle(pieceStyle);
  if (definition.renderMode !== "files") return null;
  return withBasePath(definition.assets[color][piece], basePath);
}

export function pieceSpriteCssVariables(
  pieceStyle: PieceStyleId,
  color: PieceColor,
  piece: PieceKind,
): DesignCssVariables {
  const definition = getPieceStyle(pieceStyle);
  if (definition.renderMode !== "sprite") return {};
  return {
    "--sprite-x": definition.positions[piece],
    "--sprite-y": definition.rows[color],
  };
}

export function pieceStyleCssVariables(
  pieceStyle: PieceStyleId,
  basePath = "",
): DesignCssVariables {
  const definition = getPieceStyle(pieceStyle);
  if (definition.renderMode !== "sprite") {
    return {
      "--piece-sprite-url": "none",
      "--piece-sprite-size": "600% 200%",
    };
  }
  return {
    "--piece-sprite-url": `url("${withBasePath(definition.spriteImage, basePath)}")`,
    "--piece-sprite-size": definition.spriteSize,
  };
}

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}

export function isCustomBoardColors(value: unknown): value is CustomBoardColors {
  if (!value || typeof value !== "object") return false;
  const colors = value as Partial<CustomBoardColors>;
  return isHexColor(colors.colorOne)
    && isHexColor(colors.colorTwo)
    && colors.colorOne.toLowerCase() !== colors.colorTwo.toLowerCase();
}

function readableTextColor(hex: string) {
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  return (red * 299 + green * 587 + blue * 114) / 1000 > 145 ? "#26312a" : "#f7f7f2";
}

export function customBoardCssVariables(colors: CustomBoardColors): DesignCssVariables {
  return {
    "--board-light": colors.colorOne,
    "--board-dark": colors.colorTwo,
    "--board-frame": colors.colorTwo,
    "--board-coord-light": readableTextColor(colors.colorOne),
    "--board-coord-dark": readableTextColor(colors.colorTwo),
  };
}

export function boardAppearanceCssVariables(
  theme: BoardThemeId,
  customColors: CustomBoardColors = DEFAULT_CUSTOM_BOARD_COLORS,
  customPieceStyle: PieceStyleId = DEFAULT_CUSTOM_PIECE_STYLE,
  basePath = "",
): DesignCssVariables {
  const definition = getBoardDesign(theme);
  const board = definition.board;
  const pieceStyle = resolvePieceStyle(theme, customPieceStyle);
  const pieceDefinition = getPieceStyle(pieceStyle);

  return {
    "--board-light": board.light,
    "--board-dark": board.dark,
    "--board-frame": board.frame,
    "--board-coord-light": board.coordLight,
    "--board-coord-dark": board.coordDark,
    "--board-radius": board.radius,
    "--board-shadow": board.shadow,
    "--board-image": board.image
      ? `url("${withBasePath(board.image, basePath)}")`
      : "none",
    "--board-border-width": board.borderWidth ?? "8px",
    "--board-compact-border-width": board.compactBorderWidth ?? "6px",
    "--piece-scale": board.pieceScale ?? pieceDefinition.defaultScale,
    "--piece-filter": board.pieceFilter ?? "none",
    ...pieceStyleCssVariables(pieceStyle, basePath),
    ...(theme === "custom" ? customBoardCssVariables(customColors) : {}),
  };
}

function getBrowserStorage() {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function loadBoardTheme(storage: ThemeStorageLike | null = getBrowserStorage()): BoardThemeId {
  if (!storage) return DEFAULT_BOARD_THEME;
  try {
    const saved = storage.getItem(BOARD_THEME_STORAGE_KEY);
    return isBoardThemeId(saved) ? saved : DEFAULT_BOARD_THEME;
  } catch {
    return DEFAULT_BOARD_THEME;
  }
}

export function saveBoardTheme(
  theme: BoardThemeId,
  storage: ThemeStorageLike | null = getBrowserStorage(),
) {
  if (!storage) return false;
  try {
    storage.setItem(BOARD_THEME_STORAGE_KEY, theme);
    return true;
  } catch {
    return false;
  }
}

export function loadCustomBoardColors(
  storage: ThemeStorageLike | null = getBrowserStorage(),
): CustomBoardColors {
  if (!storage) return DEFAULT_CUSTOM_BOARD_COLORS;
  try {
    const saved = JSON.parse(storage.getItem(CUSTOM_BOARD_COLORS_STORAGE_KEY) ?? "null");
    return isCustomBoardColors(saved) ? saved : DEFAULT_CUSTOM_BOARD_COLORS;
  } catch {
    return DEFAULT_CUSTOM_BOARD_COLORS;
  }
}

export function saveCustomBoardColors(
  colors: CustomBoardColors,
  storage: ThemeStorageLike | null = getBrowserStorage(),
) {
  if (!storage || !isCustomBoardColors(colors)) return false;
  try {
    storage.setItem(CUSTOM_BOARD_COLORS_STORAGE_KEY, JSON.stringify(colors));
    return true;
  } catch {
    return false;
  }
}

export function loadCustomPieceStyle(
  storage: ThemeStorageLike | null = getBrowserStorage(),
): PieceStyleId {
  if (!storage) return DEFAULT_CUSTOM_PIECE_STYLE;
  try {
    const saved = storage.getItem(CUSTOM_PIECE_STYLE_STORAGE_KEY);
    return isPieceStyleId(saved) ? saved : DEFAULT_CUSTOM_PIECE_STYLE;
  } catch {
    return DEFAULT_CUSTOM_PIECE_STYLE;
  }
}

export function saveCustomPieceStyle(
  pieceStyle: PieceStyleId,
  storage: ThemeStorageLike | null = getBrowserStorage(),
) {
  if (!storage || !isPieceStyleId(pieceStyle)) return false;
  try {
    storage.setItem(CUSTOM_PIECE_STYLE_STORAGE_KEY, pieceStyle);
    return true;
  } catch {
    return false;
  }
}
