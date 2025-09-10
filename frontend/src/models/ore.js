export class Ore {
  constructor(id, name) {
    this.id = id;
    this.name = name;
  }
}

// 提供一组默认矿石（兼容现有 ABCDE 文案）
export const ALL_ORES = [
  new Ore('A', '水灵石'),
  new Ore('B', '火灵石'),
  new Ore('C', '风灵石'),
  new Ore('D', '土灵石'),
  new Ore('E', '以太石'),
];

export function ensureOres(list) {
  // 将字符串数组转换为 Ore 对象数组，或直接返回 Ore 对象数组
  if (!Array.isArray(list)) return ALL_ORES;
  return list.map(o => (typeof o === 'string' ? new Ore(o, o) : o));
}

