export class Ore {
  constructor(id, name) {
    this.id = id;
    this.name = name;
  }
}

// 提供一组默认矿石（兼容现有 ABCDE 文案）
export const ALL_ORES = [
  new Ore('A', '雾凝草'),
  new Ore('B', '铁魄石'),
  new Ore('C', '精元果'),
  new Ore('D', '灵脉菇'),
  new Ore('E', '古蝉壳'),
];

export function ensureOres(list) {
  // 将字符串数组转换为 Ore 对象数组，或直接返回 Ore 对象数组
  if (!Array.isArray(list)) return ALL_ORES;
  return list.map(o => (typeof o === 'string' ? new Ore(o, o) : o));
}

