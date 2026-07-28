import type { Game } from "./types";

const CREATED_AT = "2026-07-29T00:00:00.000Z";

export const DEFAULT_GAMES: Game[] = [
  defaultGame("default-zhengdanghong-50", "正当红", 50, 1000000),
  defaultGame("default-junma-yingchun-50", "骏马迎春", 50, 1000000),
  defaultGame("default-chaogeili-50", "超给力", 50, 1000000),
  defaultGame("default-xixiangfeng-guotaiminan-50", "喜相逢-国泰民安", 50, 1000000),
  defaultGame("default-xingyun-88-30", "幸运88", 30, 880000),
  defaultGame("default-haoyunlai-30", "好运来", 30, 1000000),
  defaultGame("default-xixiangfeng-xishilianlian-30", "喜相逢-喜事连连", 30, 1000000),
  defaultGame("default-duoxile-30", "多喜乐", 30, 1000000),
  defaultGame("default-fugui-6-20", "富贵6", 20, 1000000),
  defaultGame("default-xixiangfeng-caiyunhengtong-20", "喜相逢-财运亨通", 20, 800000),
  defaultGame("default-yaochucai-20", "耀出彩", 20, 800000),
  defaultGame("default-xixiangfeng-xinxiangshicheng-10", "喜相逢-心想事成", 10, 300000),
  defaultGame("default-good-luck-10", "好运十倍", 10, 400000),
];

export function mergeWithDefaultGames(savedGames: Game[]): Game[] {
  const savedById = new Map(savedGames.map((game) => [game.id, game]));
  const defaults = DEFAULT_GAMES.map((game) => savedById.get(game.id) ?? game);
  const customGames = savedGames.filter((game) => !DEFAULT_GAMES.some((defaultGame) => defaultGame.id === game.id));

  return [...defaults, ...customGames];
}

function defaultGame(id: string, name: string, price: number, topPrize: number): Game {
  return {
    id,
    name,
    price,
    topPrize,
    active: true,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  };
}
