export const REALMS = [
  '炼气期','筑基期','金丹期','元婴期','化神期','炼虚期','合体期','大乘期','渡劫期',
  '真仙境','天仙境','金仙境','太乙金仙境','大罗金仙境','道祖境','混元道祖境'
];

export function levelName(l){
  const n = (l|0) - 1;
  return REALMS[n] || `境界${l}`;
}

