export const BOARD_THEME_STORAGE_KEY = "chessle-expert:board-theme:v1";
export const CUSTOM_BOARD_COLORS_STORAGE_KEY = "chessle-expert:custom-board-colors:v1";

export const BOARD_THEME_OPTIONS = [
  {
    id: "forest-classic",
    name: "Forest Classic",
    description: "The original warm wooden board.",
  },
  {
    id: "blue-classic",
    name: "Blue Classic",
    description: "Slate blue board with crisp classic pieces.",
  },
  {
    id: "red-tournament",
    name: "Red Tournament",
    description: "Rounded crimson board with bold retro pieces.",
  },
] as const;

export type PresetBoardThemeId = (typeof BOARD_THEME_OPTIONS)[number]["id"];
export type BoardThemeId = PresetBoardThemeId | "custom";

export interface CustomBoardColors {
  colorOne: string;
  colorTwo: string;
}

export interface ThemeStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const DEFAULT_BOARD_THEME: BoardThemeId = "blue-classic";
export const DEFAULT_CUSTOM_BOARD_COLORS: CustomBoardColors = {
  colorOne: "#f0d9b5",
  colorTwo: "#b58863",
};

export function isBoardThemeId(value: unknown): value is BoardThemeId {
  return value === "custom" || BOARD_THEME_OPTIONS.some((theme) => theme.id === value);
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

export function customBoardCssVariables(colors: CustomBoardColors) {
  return {
    "--board-light": colors.colorOne,
    "--board-dark": colors.colorTwo,
    "--board-frame": colors.colorTwo,
    "--board-coord-light": readableTextColor(colors.colorOne),
    "--board-coord-dark": readableTextColor(colors.colorTwo),
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
