<template>
  <div class="row map-row" :class="{ stacked }">
    <div class="col">
      <div class="panel">
        <h2>
          福地
          <span class="title-day">第 {{ day }} 天</span>
          <span class="title-energy">活力：{{ energy }}</span>
          <span v-if="currentTip" class="title-tip">{{ currentTip }}</span>
        </h2>
        <div class="map-wrap" ref="mapWrapRef">
          <div class="grid" :style="{ gridTemplateColumns: `repeat(${preview.cols}, ${cellSize}px)` }">
            <div
              v-for="cell in cells"
              :key="cell.id"
              class="cell"
              :style="{
                width: `${cellSize}px`,
                height: `${cellSize}px`,
                background: isSeen(cell) ? terrainColors[cell.terrain] : '#0b0f1f',
                color: '#0b0f1f',
                borderColor: isSeen(cell) ? '#0b0f1f' : '#0b0f1f',
                filter: isSeen(cell) && !isVisible(cell) ? 'brightness(0.7) saturate(0.85)' : 'none'
              }"
              @mouseenter="isSeen(cell) && onHover(cell)"
              @mousemove="isSeen(cell) && onHover(cell)"
              @mouseleave="onLeave()"
              :title="(isSeen(cell) ? terrainName(cell.terrain) : '未知') + ` (${cell.x},${cell.y})`"
            >
            </div>
            <!-- 求道者队伍红色标记（绝对定位覆盖在棋盘上，带移动动画） -->
            <div class="hero-marker" :style="heroStyle" :title="`求道者队伍：(${hero.x},${hero.y})`">
              <span class="hero-icon">⚔️</span>
            </div>
            <!-- 天数切换黑场覆盖 -->
            <div class="day-overlay" :class="{ visible: dayOverlayVisible }"></div>
          </div>
        </div>
      </div>
    </div>
    <div class="col" :style="stacked ? { flex: '1 1 auto', width: '100%' } : { flex: '0 0 auto', width: infoWidth + 'px' }">
      <div class="panel" ref="infoPanelRef" :style="{ height: infoHeight + 'px', overflow: 'auto' }">
        <!-- 求道者列表按钮（仅图标，固定在面板右上角） -->
        <button class="heroes-btn" @click="showHeroes = true" aria-label="查看求道者" title="查看求道者">
          <span class="hero-icon">⚔️</span>
        </button>
        <h3>信息</h3>
        <template v-if="hovered">
          <p class="stat">坐标：({{ hovered.x }}, {{ hovered.y }})</p>
          <p class="stat">
            地形：{{ terrainName(hovered.terrain) }}
            <template v-if="hovered.x === hero.x && hovered.y === hero.y">
              （求道者：{{ heroesCount }}）
            </template>
          </p>
          <p class="stat">说明：{{ terrainDesc[hovered.terrain] }}</p>
        </template>
        <template v-else>
          <p class="stat">将鼠标移动到棋盘上的格子以查看详情。</p>
          <p class="stat">战争迷雾：未探索区域不可查看。</p>
        </template>
        
      </div>
    </div>
  </div>

  <!-- 英雄列表弹窗 -->
  <div v-if="showHeroes" class="modal-backdrop" @click.self="showHeroes=false">
    <div class="modal panel">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:8px;">
        <h3 style="margin:0;">队伍（{{ heroesCount }}）</h3>
        <button class="btn" @click="showHeroes=false">关闭</button>
      </div>
      <div class="hero-list">
        <div v-for="(m, i) in hero.members" :key="i" class="hero-item">
          <div class="hero-line">
            <strong class="hero-name">{{ m.name }}</strong>
            <span class="stat">境界：{{ levelName(m.level) }}</span>
          </div>
          <div class="hero-stats">
            <span class="stat">HP {{ m.hp }}</span>
            <span class="stat">ATK {{ m.atk }}</span>
            <span class="stat">DEF {{ m.def }}</span>
            <span class="stat">MP {{ m.mp }}</span>
            <span class="stat">法术：{{ m.spell ? m.spell : '无' }}</span>
            <span class="stat">法器：{{ m.artifact ? m.artifact : '无' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: 'MapView' });
import { reactive, computed, ref, onMounted, onBeforeUnmount, onActivated, onDeactivated, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from '../composables/toast.js';
import { toasts } from '../composables/toast.js';
import { ALL_ORES } from '../models/ore.js';

const TERRAINS = [
  { id: 'plain', name: '平原' },
  { id: 'forest', name: '森林' },
  { id: 'mountain', name: '山脉' },
  { id: 'dungeon', name: '洞天入口' },
  { id: 'village', name: '宗门' },
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
  dungeon: '神秘入口，通向洞天深处。',
  village: '补给与情报的聚集地。',
};

const preview = reactive({ rows: 10, cols: 10, mines: 20, ores: [], cells: [] });
const cellSize = ref(22);
const infoWidth = ref(500);
const infoHeight = ref(0);
const stacked = ref(false);
// 英雄队伍：位置 + 成员数组（成员包含：名字、等级、血量、攻击、防御、魔力、法术）
const hero = reactive({ x: 0, y: 0, members: [] });
const heroesCount = computed(()=> hero.members.length);
const showHeroes = ref(false);
// 境界名称映射：从 1 开始
const REALMS = [
  '炼气期','筑基期','金丹期','元婴期','化神期','炼虚期','合体期','大乘期','渡劫期',
  '真仙境','天仙境','金仙境','太乙金仙境','大罗金仙境','道祖境','混元道祖境'
];
function levelName(l){
  const n = (l|0) - 1;
  return REALMS[n] || `境界${l}`;
}
// 内联提示：仅显示最新一条 toast 内容
const currentTip = computed(() => {
  const list = toasts.value;
  return list.length ? list[list.length - 1].message : '';
});

function createMember(i){
  return {
    name: `求道者${i+1}`,
    level: 1,
    hp: 100,
    atk: 10,
    def: 10,
    mp: 100,
    spell: null,
    artifact: null,
  };
}
// 天与活力
const day = ref(1);
const maxEnergy = 60;
const energy = ref(maxEnergy);
const dayOverlayVisible = ref(false);
const dayTransitioning = ref(false);
// 棋盘布局参数（需与 CSS 对齐）：gap=1px，padding=6px（两侧总计 12px）
const GRID_GAP = 1;
const GRID_PADDING = 6; // 单侧内边距

// 邪修遭遇：草原基础概率较低，森林较高（后续可接事件系统）
const ENCOUNTER_RATE_PLAIN = 0.08; // 8%
const ENCOUNTER_RATE_FOREST = 0.18; // 18%

// 战争迷雾：视野、已探索与当前可见集合
const visionRadius = ref(2);
const seen = ref(new Set());
const visibleIds = computed(()=>{
  const set = new Set();
  const R = visionRadius.value|0;
  const rows = preview.rows|0, cols = preview.cols|0;
  for(let dy=-R; dy<=R; dy++){
    for(let dx=-R; dx<=R; dx++){
      const x = hero.x + dx, y = hero.y + dy;
      if(x<0||y<0||x>=cols||y>=rows) continue;
      if(Math.abs(dx)+Math.abs(dy) <= R){ set.add(idx(x,y,cols)); }
    }
  }
  return set;
});
function markSeenAround(x,y){
  const R = visionRadius.value|0;
  const rows = preview.rows|0, cols = preview.cols|0;
  const next = new Set(seen.value);
  for(let dy=-R; dy<=R; dy++){
    for(let dx=-R; dx<=R; dx++){
      const nx = x + dx, ny = y + dy;
      if(nx<0||ny<0||nx>=cols||ny>=rows) continue;
      if(Math.abs(dx)+Math.abs(dy) <= R){ next.add(idx(nx,ny,cols)); }
    }
  }
  seen.value = next;
}
function isSeen(cell){ return seen.value.has(idx(cell.x,cell.y,preview.cols)); }
function isVisible(cell){ return visibleIds.value.has(idx(cell.x,cell.y,preview.cols)); }

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
  const GRID_GAP_LOCAL = GRID_GAP; // 使用同一 gap 值

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
  const cols = Math.max(1, Math.floor((contentW + GRID_GAP_LOCAL) / (BASE_CELL + GRID_GAP_LOCAL)));
  const rows = Math.max(1, Math.floor((contentH + GRID_GAP_LOCAL) / (BASE_CELL + GRID_GAP_LOCAL)));
  preview.cols = cols;
  preview.rows = rows;
  preview.mines = Math.max(1, Math.floor(rows * cols * 0.20));
  preview.ores = pickRandomOres(Math.min(5, ALL_ORES.length));

  // 4) 锁定行列后，回算单元格尺寸以尽量铺满区域
  const cellW = Math.floor((contentW - GRID_GAP_LOCAL * Math.max(0, cols - 1)) / cols);
  const cellH = Math.floor((contentH - GRID_GAP_LOCAL * Math.max(0, rows - 1)) / rows);
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
  // 地宫入口数量：按总格数的 1/16 估算（至少 1 个）
  const dungeonCount = Math.max(1, Math.round((rows * cols) / 16));
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
  // 英雄初始位置：放在村庄所在格子
  const villageCell = cells.find(c => c.terrain === 'village');
  if(villageCell){ hero.x = villageCell.x; hero.y = villageCell.y; }
  // 如首次进入地图且尚未初始化队伍，则生成 10 名默认英雄
  if(hero.members.length === 0){
    hero.members = Array.from({length: 10}, (_,i)=> createMember(i));
  }
  // 初始化战争迷雾：以英雄为中心揭示
  seen.value = new Set();
  markSeenAround(hero.x, hero.y);
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
const router = useRouter();

onMounted(async ()=>{
  await reroll();
});
// 从地宫返回后进入下一天：依赖路由查询参数 from=dungeon
onActivated(async ()=>{
  // 仅在本视图激活时绑定方向键监听，避免其它页面被影响
  window.addEventListener('keydown', handleKeydown, { passive: false });
  const q = router.currentRoute.value.query || {};
  if(q.from === 'dungeon'){
    await advanceDay();
    // 清理 URL 查询参数，避免重复触发
    router.replace({ path: '/map' });
  }
});
// 离开（仍保持 KeepAlive）时移除监听
onDeactivated(()=>{
  window.removeEventListener('keydown', handleKeydown);
});
onBeforeUnmount(()=>{
  window.removeEventListener('keydown', handleKeydown);
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

// 判断是否被森林包围（四向相邻中可通过的格子全部为森林）
function isForestSurrounded(){
  const rows = preview.rows|0, cols = preview.cols|0;
  const passable = new Set(['plain','forest','village','dungeon']);
  const ns = neighbors4(hero.x, hero.y, rows, cols)
    .map(([x,y]) => preview.cells[idx(x,y, cols)])
    .filter(c => c && passable.has(c.terrain));
  if(ns.length === 0) return false; // 没有可通行格不视为“被森林包围”
  return ns.every(c => c.terrain === 'forest');
}

// 英雄移动：方向键控制，限制在棋盘内，并带动画（通过 CSS transition）
function handleKeydown(e){
  const map = { ArrowUp:[0,-1], ArrowDown:[0,1], ArrowLeft:[-1,0], ArrowRight:[1,0] };
  const d = map[e.key];
  if(!d) return;
  e.preventDefault();
  const [dx,dy] = d;
  const tx = hero.x + dx;
  const ty = hero.y + dy;
  // 越界禁止
  if(tx < 0 || ty < 0 || tx >= preview.cols || ty >= preview.rows) return;
  const tile = preview.cells[idx(tx,ty,preview.cols)];
  if(!tile) return;
  // 山脉不可进入
  if(tile.terrain === 'mountain') return;
  // 消耗规则：平原/村庄/地宫入口 -1；森林 -2
  const cost = (tile.terrain === 'forest') ? 2 : 1;
  if(energy.value < cost){
    if(tile.terrain === 'forest'){
      // 若四周可通行均为森林，且体力不足以进入森林，则直接入夜
      if(energy.value < 2 && isForestSurrounded()){
        showToast('筋疲力尽，四周皆森林，夜幕降临。', { type: 'info' });
        advanceDay();
      } else {
        showToast('体力不足，无法进入森林', { type: 'warn' });
      }
    }
    return; // 体力不足，禁止移动
  }
  energy.value = Math.max(0, energy.value - cost);
  hero.x = tx; hero.y = ty;
  // 更新战争迷雾
  markSeenAround(hero.x, hero.y);
  // 草原/森林有概率遭遇邪修（隐形）
  maybeEncounter(tile);
  // 若活力耗尽，则进入下一天
  if(energy.value === 0){
    advanceDay();
  }
  // 进入地宫：移动到地宫入口则切换到“地宫探索”
  if(tile.terrain === 'dungeon'){
    router.push('/mining');
  }
}

function wait(ms){ return new Promise(res => setTimeout(res, ms)); }
async function advanceDay(){
  if(dayTransitioning.value) return;
  dayTransitioning.value = true;
  dayOverlayVisible.value = true; // 淡入黑场
  await wait(500);
  await wait(250); // 停顿少许，给到“换天”感觉
  day.value += 1;
  energy.value = maxEnergy; // 恢复活力
  dayOverlayVisible.value = false; // 淡出黑场
  await wait(350);
  dayTransitioning.value = false;
}

function maybeEncounter(tile){
  if(!tile) return;
  let p = 0;
  if(tile.terrain === 'plain') p = ENCOUNTER_RATE_PLAIN;
  else if(tile.terrain === 'forest') p = ENCOUNTER_RATE_FOREST;
  if(p > 0 && Math.random() < p){
    // 暂时用原生警告框，后续接剧情/战斗系统
    window.alert('遭遇邪修！');
  }
}

// 英雄标记的像素定位与尺寸（相对 .grid 容器）
const heroStyle = computed(()=>{
  const size = Math.max(10, cellSize.value - 8);
  const offsetX = GRID_PADDING + hero.x * (cellSize.value + GRID_GAP) + (cellSize.value - size)/2;
  const offsetY = GRID_PADDING + hero.y * (cellSize.value + GRID_GAP) + (cellSize.value - size)/2;
  return {
    width: size + 'px',
    height: size + 'px',
    transform: `translate(${offsetX}px, ${offsetY}px)`
  };
});
</script>

<style scoped>
.map-wrap{ width: 100%; display:flex; justify-content:center; align-items:center; }
.map-row.stacked{ flex-direction: column; }
/* 标题后活力值样式：更小且非粗体 */
.title-day{ font-size:.8em; font-weight:400; color: var(--muted); margin-left:8px; margin-right:8px; }
.title-energy{ font-size:.8em; font-weight:400; color: var(--muted); margin-left:8px; }
.title-tip{ font-size:.8em; font-weight:400; color:#cbd5ff; background:#23273d; border:1px solid #303657; border-radius:999px; padding:2px 8px; margin-left:8px; }
/* 使棋盘成为定位容器 */
.grid{ position: relative; }
/* 英雄队伍红色标记样式（绝对定位 + 动画） */
.hero-marker{ position:absolute; top:0; left:0; background:#ef4444; border:2px solid #ffffff; border-radius:999px; box-shadow:0 1px 3px rgba(0,0,0,.5); display:flex; align-items:center; justify-content:center; pointer-events:none; transition: transform 160ms ease; will-change: transform; z-index: 2; }
.hero-icon{ font-size:.8em; line-height:1; color:#ffffff; text-shadow:0 1px 2px rgba(0,0,0,.6); }
/* 换天黑场覆盖 */
.day-overlay{ position:absolute; inset:6px; background:#000; opacity:0; pointer-events:none; transition: opacity 350ms ease; z-index: 5; border-radius:10px; }
.day-overlay.visible{ opacity:1; }

/* 弹窗样式 */
.modal-backdrop{ position:fixed; inset:0; background:rgba(0,0,0,.55); display:flex; align-items:center; justify-content:center; z-index: 20; }
.modal{ width:min(560px, 92vw); max-height:72vh; overflow:auto; }
.hero-list{ display:flex; flex-direction:column; gap:8px; }
.hero-item{ background:#23273d; border:1px solid #303657; border-radius:8px; padding:8px; }
.hero-line{ display:flex; align-items:center; justify-content:space-between; }
.hero-name{ font-weight:600; }
.hero-stats{ display:flex; gap:12px; flex-wrap:wrap; margin-top:4px; }

/* 让本组件内的面板成为定位容器 */
.panel{ position: relative; }
/* 面板右上角的英雄图标按钮（无文字） */
.heroes-btn{ position:absolute; top:8px; right:8px; width:32px; height:32px; border-radius:8px; border:1px solid #3a3f62; background:#2b3050; color:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 1px 2px rgba(0,0,0,.3); }
.heroes-btn:hover{ background:#343a5e; }
.heroes-btn .hero-icon{ font-size:16px; color:#fff; text-shadow:none; }
/* 内联提示样式，与 MiningView 保持一致 */
.inline-tip{ background:#23273d; border-color:#7c83ff; }
</style>
