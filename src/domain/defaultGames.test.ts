import { describe, expect, it } from "vitest";
import { makeGame } from "../test/testData";
import { DEFAULT_GAMES, mergeWithDefaultGames } from "./defaultGames";

describe("default games", () => {
  it("contains every ticket type shown by the user", () => {
    expect(DEFAULT_GAMES.map((game) => game.name)).toEqual([
      "正当红",
      "骏马迎春",
      "超给力",
      "喜相逢-国泰民安",
      "幸运88",
      "好运来",
      "喜相逢-喜事连连",
      "多喜乐",
      "富贵6",
      "喜相逢-财运亨通",
      "耀出彩",
      "喜相逢-心想事成",
      "好运十倍",
    ]);
  });

  it("keeps existing saved games while filling missing defaults", () => {
    const savedGame = makeGame({
      id: "default-good-luck-10",
      name: "好运十倍",
      price: 10,
      topPrize: 400000,
    });

    const merged = mergeWithDefaultGames([savedGame]);

    expect(merged).toHaveLength(13);
    expect(merged.filter((game) => game.id === "default-good-luck-10")).toEqual([savedGame]);
  });
});
