import assert from "node:assert/strict";
import test from "node:test";
import {
  BOARD_THEME_STORAGE_KEY,
  CUSTOM_BOARD_COLORS_STORAGE_KEY,
  DEFAULT_CUSTOM_BOARD_COLORS,
  DEFAULT_BOARD_THEME,
  customBoardCssVariables,
  loadCustomBoardColors,
  loadBoardTheme,
  saveCustomBoardColors,
  saveBoardTheme,
  type ThemeStorageLike,
} from "../lib/game/board-theme";

class MemoryStorage implements ThemeStorageLike {
  private readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

test("uses the blue image-inspired set for a new device", () => {
  assert.equal(loadBoardTheme(new MemoryStorage()), DEFAULT_BOARD_THEME);
  assert.equal(DEFAULT_BOARD_THEME, "blue-classic");
});

test("keeps the selected board and piece set on this device", () => {
  const storage = new MemoryStorage();

  assert.equal(saveBoardTheme("red-tournament", storage), true);
  assert.equal(loadBoardTheme(storage), "red-tournament");
});

test("keeps two different custom checker colors on this device", () => {
  const storage = new MemoryStorage();
  const colors = { colorOne: "#f5e6ca", colorTwo: "#345c72" };

  assert.equal(saveCustomBoardColors(colors, storage), true);
  assert.deepEqual(loadCustomBoardColors(storage), colors);
  assert.deepEqual(customBoardCssVariables(colors), {
    "--board-light": "#f5e6ca",
    "--board-dark": "#345c72",
    "--board-frame": "#345c72",
    "--board-coord-light": "#26312a",
    "--board-coord-dark": "#f7f7f2",
  });
});

test("does not accept identical colors because the checker pattern would disappear", () => {
  const storage = new MemoryStorage();

  assert.equal(saveCustomBoardColors({ colorOne: "#123456", colorTwo: "#123456" }, storage), false);
  assert.deepEqual(loadCustomBoardColors(storage), DEFAULT_CUSTOM_BOARD_COLORS);
});

test("ignores damaged custom color data", () => {
  const storage = new MemoryStorage();
  storage.setItem(CUSTOM_BOARD_COLORS_STORAGE_KEY, JSON.stringify({
    colorOne: "red",
    colorTwo: "#112233",
  }));

  assert.deepEqual(loadCustomBoardColors(storage), DEFAULT_CUSTOM_BOARD_COLORS);
});

test("ignores unknown saved theme values", () => {
  const storage = new MemoryStorage();
  storage.setItem(BOARD_THEME_STORAGE_KEY, "not-a-theme");

  assert.equal(loadBoardTheme(storage), DEFAULT_BOARD_THEME);
});

test("still allows an in-session theme when local storage is unavailable", () => {
  const blockedStorage: ThemeStorageLike = {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("blocked");
    },
  };

  assert.equal(loadBoardTheme(blockedStorage), DEFAULT_BOARD_THEME);
  assert.equal(saveBoardTheme("forest-classic", blockedStorage), false);
});
