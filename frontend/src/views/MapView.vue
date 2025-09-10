<template>
  <div class="row map-row" :class="{ stacked }">
    <div class="col">
      <div class="panel">
        <h2>地图</h2>
        <div class="map-wrap" ref="mapWrapRef">
          <div class="grid" :style="{ gridTemplateColumns: `repeat(${preview.cols}, ${cellSize}px)` }">
            <div
              v-for="cell in cells"
              :key="cell.id"
              class="cell"
              :style="{
                width: `${cellSize}px`,
                height: `${cellSize}px`,
                background: terrainColors[cell.terrain],
                color: '#0b0f1f',
                borderColor: '#0b0f1f'
              }"
              @mouseenter="onHover(cell)"
              @mousemove="onHover(cell)"
              @mouseleave="onLeave()"
              :title="terrainName(cell.terrain) + ` (${cell.x},${cell.y})`"
            >
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="col" :style="stacked ? { flex: '1 1 auto', width: '100%' } : { flex: '0 0 auto', width: infoWidth + 'px' }">
      <div class="panel" ref="infoPanelRef" :style="{ height: infoHeight + 'px', overflow: 'auto' }">
        <h3>信息</h3>
        <template v-if="hovered">
          <p class="stat">坐标：({{ hovered.x }}, {{ hovered.y }})</p>
          <p class="stat">地形：{{ terrainName(hovered.terrain) }}</p>
          <p class="stat">说明：{{ terrainDesc[hovered.terrain] }}</p>
        </template>
        <template v-else>
          <p class="stat">将鼠标移动到棋盘上的格子以查看详情。</p>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, ref, onMounted, nextTick } from 'vue';
import { ALL_ORES } from '../models/ore.js';

const TERRAINS = [
  { id: 'plain', name: '平原' },
  { id: 'forest', name: '森林' },
  { id: 'mountain', name: '山脉' },
  { id: 'dungeon', name: '地宫入口' },
  { id: 'village', name: '村庄' },
];
const terrainColors = {
  plain: '#a3d977',
  forest: '#3c8d40',
  mountain: '#8e8e99',
  dungeon: '#d946ef',
  village: '#f59e0b',
};
const terrainDesc = {
  plain: '开阔地带，行动方便。',
  forest: '林木茂密，视野受限。',
  mountain: '地势崎岖，不易通行。',
  dungeon: '神秘入口，通向地宫深处。',
  village: '补给与情报的聚集地。',
};

const preview = reactive({ rows: 10, cols: 10, mines: 20, ores: [], cells: [] });
const cellSize = ref(22);
const infoWidth = ref(500);
const infoHeight = ref(0);
const stacked = ref(false);

function pickRandomOres(k){
  const pool = [...ALL_ORES];
  const res = [];
  const count = Math.max(1, Math.min(k, pool.length));
  while(res.length < count){
    const i = Math.floor(Math.random()*pool.length);
    res.push(pool.splice(i,1)[0]);
  }
  return res;
}
async function reroll(){
  // 1) 确定布局与信息面板尺寸（仅初始化时）
  computeLayout();
  await nextTick();
  // 先测量信息面板的自然高度
  const Padding = 16;
  const VerticalInfoPanelHeight = 160;

  // 2) 计算地图面板可用宽高
  const mapWrap = mapWrapRef.value;
  if(!mapWrap) return;
  const mapPanelRect = mapWrap.getBoundingClientRect();
  const infoPanelRect = infoPanelRef.value.getBoundingClientRect();
  const containerW = mapWrap.clientWidth; // 左侧区域宽度
  const GRID_PAD = 12; // grid padding: 6px*2
  const GRID_GAP = 1;

  // 垂直可用高度：需考虑视口、标题与信息面板（当上下布局时）
  let availableV = Math.max(120, window.innerHeight - infoPanelRect.top - Padding);
  if(stacked.value){
    // 如自然高度过大，限制到可视范围内
    infoHeight.value = VerticalInfoPanelHeight;
    availableV = Math.max(120, availableV - (infoHeight.value + 12));
  } else {
    // 侧栏布局：信息面板高度占满可视高度
    infoHeight.value = availableV;
    availableV -= mapPanelRect.top - infoPanelRect.top;
  }

  // 3) 根据区域推导行列数量（尽量填满），行列一旦确定，就不会因刷新而变化
  const BASE_CELL = 22; // 目标单元格大小
  const contentW = Math.max(0, containerW - GRID_PAD);
  const contentH = Math.max(0, availableV - GRID_PAD);
  const cols = Math.max(1, Math.floor((contentW + GRID_GAP) / (BASE_CELL + GRID_GAP)));
  const rows = Math.max(1, Math.floor((contentH + GRID_GAP) / (BASE_CELL + GRID_GAP)));
  preview.cols = cols;
  preview.rows = rows;
  preview.mines = Math.max(1, Math.floor(rows * cols * 0.20));
  preview.ores = pickRandomOres(Math.min(5, ALL_ORES.length));

  // 4) 锁定行列后，回算单元格尺寸以尽量铺满区域
  const cellW = Math.floor((contentW - GRID_GAP * Math.max(0, cols - 1)) / cols);
  const cellH = Math.floor((contentH - GRID_GAP * Math.max(0, rows - 1)) / rows);
  cellSize.value = Math.max(8, Math.min(cellW, cellH));

  // 5) 生成地形棋盘（固定行列）
  const total = rows * cols;
  const cells = Array.from({ length: total }, (_, i) => ({
    id: i,
    x: i % cols,
    y: Math.floor(i / cols),
    terrain: 'plain'
  }));
  // 随机分配（偏向平原/森林/山脉）
  for(let i=0;i<total;i++){
    if(cells[i].terrain !== 'plain') continue;
    const r = Math.random();
    if(r < 0.45) cells[i].terrain = 'plain';
    else if(r < 0.75) cells[i].terrain = 'forest';
    else cells[i].terrain = 'mountain';
  }
  // 放置一个村庄、多个地宫入口（数量与地图尺寸相关，至少 1 个）
  const randIndex = () => Math.floor(Math.random()*total);
  const villageIdx = randIndex();
  cells[villageIdx].terrain = 'village';
  const dungeonCount = Math.max(1, Math.round((rows + cols) / 12));
  let placed = 0; const used = new Set([villageIdx]);
  while(placed < dungeonCount){
    const di = randIndex();
    if(used.has(di)) continue;
    used.add(di);
    cells[di].terrain = 'dungeon';
    placed++;
  }
  // 保证存在一条从村庄到至少一个入口的不穿越山脉的路径：必要时“清理”路径上的山脉为平原
  ensureVillageToDungeonPath(cells, rows, cols);
  preview.cells = cells;
}

const cells = computed(()=> preview.cells || []);
function terrainName(id){
  return (TERRAINS.find(t => t.id === id) || {}).name || id;
}

const hovered = ref(null);
function onHover(cell){ hovered.value = cell; }
function onLeave(){ hovered.value = null; }

function computeLayout(){
  const vw = Math.max(320, window.innerWidth || 0);
  const quarter = vw * 0.25;
  infoWidth.value = Math.min(500, quarter);
  stacked.value = vw < 900; // 小屏改为上下布局
}

const mapWrapRef = ref(null);
const infoPanelRef = ref(null);

onMounted(async ()=>{
  await reroll();
});

// 工具：下标与邻接
function idx(x,y, cols){ return y*cols + x; }
function neighbors4(x,y, rows, cols){
  const res=[];
  if(x>0) res.push([x-1,y]);
  if(x<cols-1) res.push([x+1,y]);
  if(y>0) res.push([x,y-1]);
  if(y<rows-1) res.push([x,y+1]);
  return res;
}
function findTerrain(cells, t){ return cells.filter(c => c.terrain === t); }

function ensureVillageToDungeonPath(cells, rows, cols){
  const villages = findTerrain(cells, 'village');
  const dungeons = findTerrain(cells, 'dungeon');
  if(!villages.length || !dungeons.length) return;
  const start = villages[0];
  const passable = new Set(['plain','forest','village','dungeon']);
  // 先尝试在不可穿越山脉的条件下找路径
  const path = bfsPath(cells, rows, cols, start, dungeons, (t)=> passable.has(t));
  if(path) return; // 已连通
  // 否则允许穿越山脉找到一条路径，然后清理路径上的山脉为平原
  const anyPath = bfsPath(cells, rows, cols, start, dungeons, (_)=> true);
  if(anyPath){
    for(const [x,y] of anyPath){
      const c = cells[idx(x,y, cols)];
      if(c.terrain === 'mountain') c.terrain = 'plain';
    }
  } else {
    // 兜底：选择最近入口，按曼哈顿直线清理
    let best=null, bestDist=Infinity;
    for(const d of dungeons){
      const dist = Math.abs(d.x-start.x) + Math.abs(d.y-start.y);
      if(dist < bestDist){ bestDist = dist; best = d; }
    }
    if(best){
      let x = start.x, y = start.y;
      while(x !== best.x){ x += (best.x > x ? 1 : -1); const c = cells[idx(x,y,cols)]; if(c.terrain==='mountain') c.terrain='plain'; }
      while(y !== best.y){ y += (best.y > y ? 1 : -1); const c = cells[idx(x,y,cols)]; if(c.terrain==='mountain') c.terrain='plain'; }
    }
  }
}

function bfsPath(cells, rows, cols, start, targets, canPass){
  const targetSet = new Set(targets.map(t => idx(t.x,t.y,cols)));
  const q=[[start.x, start.y]];
  const visited = new Set([idx(start.x,start.y,cols)]);
  const prev = new Map();
  while(q.length){
    const [x,y] = q.shift();
    const id = idx(x,y,cols);
    if(targetSet.has(id)){
      // 回溯路径
      const path=[]; let cur=id;
      while(prev.has(cur)){ path.push([cur%cols, Math.floor(cur/cols)]); cur = prev.get(cur); }
      path.push([start.x, start.y]);
      path.reverse();
      return path;
    }
    for(const [nx,ny] of neighbors4(x,y, rows, cols)){
      const nid = idx(nx,ny,cols);
      if(visited.has(nid)) continue;
      const tile = cells[nid];
      if(!canPass(tile.terrain)) continue;
      visited.add(nid);
      prev.set(nid, id);
      q.push([nx,ny]);
    }
  }
  return null;
}
</script>

<style scoped>
.map-wrap{ width: 100%; display:flex; justify-content:center; align-items:center; }
.map-row.stacked{ flex-direction: column; }
</style>
