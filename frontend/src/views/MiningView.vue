<template>
  <div class="row">
    <div class="col">
      <div class="panel" ref="panelRef">
        <h2>洞天寻踪</h2>
        <p class="stat">规则：
          - 左键点击空地：免费翻开（会连锁展开）。
          - 左键点击矿石：矿石碎裂，消耗一次机会。
          - 右键点击矿石：成功采集矿石（获得 1~{{ props.oreFindMax ?? 100 }} 的随机数量），消耗一次机会。
          - 右键点击空地：消耗一次机会并翻开区域。
          - 若剩余未翻开的格子全部为矿石（无空格），则自动翻出并入库，不消耗机会，直接结算。
        </p>
        <div class="badges" style="margin:8px 0">
          <span class="badge">剩余机会：{{ chances }}</span>
          <span class="badge inline-tip" v-if="currentTip">{{ currentTip }}</span>
        </div>
        <div class="badges" style="margin:8px 0">
          <span class="badge">尺寸：{{ state.map.rows }} × {{ state.map.cols }}</span>
          <span class="badge">矿数：{{ state.map.mines }}</span>
          <span class="badge">矿种：{{ oreNames.join('、') }}</span>
        </div>
        <div ref="gridWrapRef" class="grid-wrap">
          <div class="grid" :style="{ gridTemplateColumns: `repeat(${vCols}, ${cellSize}px)` }" @contextmenu.prevent>
            <div
              v-for="cell in visibleCells"
              :key="cell.key"
              class="cell"
              :class="{ revealed: cell.revealed, placeholder: cell.placeholder }"
              :style="{ width: `${cellSize}px`, height: `${cellSize}px` }"
              @dblclick.prevent="onDblClick(cell, $event)"
              @click="onLeft(cell)"
              @contextmenu.prevent="onRight(cell)"
              :title="cellTitle(cell)"
            >
            <span v-if="cell.revealed && !cell.placeholder">
              <template v-if="cell.hasOre">
                <span v-if="cell.collected" class="mark mark-ok">✓</span>
                <span v-else-if="cell.broken" class="mark mark-bad">✕</span>
                <span v-else class="mark mark-unknown">?</span>
              </template>
              <template v-else>
                {{ cell.adj || '' }}
              </template>
            </span>
            </div>
          </div>
        </div>
        <div ref="controlsRef" style="margin-top:10px; display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
          <template v-if="canScroll">
            <span class="stat">移动可视区域：</span>
            <button class="btn" @click="moveView('up')" :disabled="offsetY===0">↑</button>
            <button class="btn" @click="moveView('left')" :disabled="offsetX===0">←</button>
            <button class="btn" @click="moveView('down')" :disabled="offsetY>=maxOffsetY">↓</button>
            <button class="btn" @click="moveView('right')" :disabled="offsetX>=maxOffsetX">→</button>
          </template>
        </div>
      </div>
    </div>
  </div>

  <!-- 回合结算弹窗 -->
  <div v-if="settlementOpen" class="modal-backdrop">
    <div class="modal">
      <h3>本回合结算</h3>
      <p class="stat">以下为本回合最终收获，已入仓库。</p>
      <div class="badges" style="margin:8px 0">
        <span
          v-for="([name, cnt], i) in Object.entries(lastRoundSummary)"
          :key="name + '-' + i"
          class="badge"
        >
          {{ name }} × {{ cnt || 0 }}
        </span>
      </div>
      <p style="margin:6px 0; color:#9aa0b4;">合计：{{ lastRoundTotal }}</p>
      <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:10px;">
        <button class="btn" @click="closeSettlement()">离开洞天</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useInventoryStore } from '../store/inventory.js';
import { ALL_ORES, ensureOres } from '../models/ore.js';
import { showToast } from '../composables/toast.js';
import { toasts } from '../composables/toast.js';

const inv = useInventoryStore();
const router = useRouter();

// 可挖掘区域（真实棋盘）与可视棋盘（展示格数）解耦
// 输入参数：行数 rows、列数 cols、矿数 mines（类似扫雷雷数）
const props = defineProps({
  // 若指定 viewRows/viewCols，仅控制可视窗口尺寸；地图尺寸改由随机生成
  viewRows: { type: Number, default: null },
  viewCols: { type: Number, default: null },
  // 单次成功采集的最大数量（最小恒为 1）
  oreFindMax: { type: Number, default: 100 },
});

// 统一的行列计算
const fRows = computed(() => Math.max(1, (state.map.rows|0)));
const fCols = computed(() => Math.max(1, (state.map.cols|0)));
const vRows = computed(() => (props.viewRows ?? fRows.value) | 0);
const vCols = computed(() => (props.viewCols ?? fCols.value) | 0);

const CHANCES_PER_ROUND = 15;

const state = reactive({
  // 真实棋盘
  grid: [],
  chances: CHANCES_PER_ROUND,
  // 按“名称”汇总
  roundCollected: {},
  settlementOpen: false,
  lastRoundSummary: {},
  roundOver: false,
  // 可视窗口（当 view 小于 field 时可移动）
  offsetX: 0,
  offsetY: 0,
  // 当前地图配置（进入页面时随机生成）
  map: { rows: 10, cols: 10, mines: 20, allowedOres: ALL_ORES },
  // 抑制合成键触发后的下一次 click/contextmenu
  suppressNextClick: false,
});

const oreNames = computed(()=> (state.map.allowedOres || []).map(o => (typeof o === 'string' ? o : o.name)));

function idx(x, y, cols){ return y * cols + x; }
function neighbors(x,y, rows, cols){
  const res=[];
  for(let dy=-1; dy<=1; dy++) for(let dx=-1; dx<=1; dx++){
    if(dx===0 && dy===0) continue;
    const nx=x+dx, ny=y+dy;
    if(nx>=0 && nx<cols && ny>=0 && ny<rows) res.push([nx,ny]);
  }
  return res;
}

function genField(){
  const g=[];
  const rows = fRows.value, cols = fCols.value;
  // 初始化为空格
  for(let y=0;y<rows;y++){
    for(let x=0;x<cols;x++){
      g.push({ id: `${x}-${y}`, x, y, hasOre:false, ore:null, revealed:false, broken:false, collected:false, adj:0 });
    }
  }
  // 随机放置固定数量的矿石
  const total = rows * cols;
  const minesCount = Math.max(0, Math.min((state.map.mines|0), total));
  const picked = new Set();
  while(picked.size < minesCount){
    picked.add(Math.floor(Math.random() * total));
  }
  const ores = ensureOres(state.map.allowedOres);
  for(const i of picked){
    const cell = g[i];
    cell.hasOre = true;
    cell.ore = ores[Math.floor(Math.random()*ores.length)];
  }
  // 计算邻接矿数
  for(let y=0;y<rows;y++){
    for(let x=0;x<cols;x++){
      const c = g[idx(x,y, cols)];
      c.adj = neighbors(x,y, rows, cols)
        .reduce((n,[nx,ny]) => n + (g[idx(nx,ny, cols)].hasOre?1:0), 0);
    }
  }
  state.grid = g;
}

function randomInt(min, max, pow=1){
  let rnd = 1;
  for (let i = 0; i < pow; i ++) {
    rnd *= Math.random();
  }
  return Math.floor(rnd * (max - min + 1)) + min;
}
console.log(randomInt);
window.testRandomInt = randomInt;

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

function randomizeMap(){
  // 行列在 8~16 内随机；矿密度固定 20%；矿种 2~5（或不超过总数）
  const rows = randomInt(8, 16);
  const cols = randomInt(8, 16);
  const density = 0.20;
  const mines = Math.max(1, Math.floor(rows * cols * density));
  const kindMax = Math.min(5, ALL_ORES.length);
  const kinds = randomInt(2, kindMax);
  const ores = pickRandomOres(kinds);
  state.map = { rows, cols, mines, allowedOres: ores };
  if (mines < CHANCES_PER_ROUND) state.chances = mines;
  else state.chances = randomInt(CHANCES_PER_ROUND, mines);
  state.roundCollected = {};
  state.roundOver = false;
  state.offsetX = 0;
  state.offsetY = 0;
  genField();
}

function finalizeRound(){
  // 记录结算并入库
  state.lastRoundSummary = { ...state.roundCollected };
  inv.addRound(state.roundCollected);
  // 开启结算弹窗（下一回合在关闭时开始）
  state.settlementOpen = true;
}

function revealEmpty(x,y){
  const queue=[[x,y]];
  while(queue.length){
    const [cx,cy]=queue.shift();
    const c = state.grid[idx(cx,cy, fCols.value)];
    if(!c || c.revealed) continue;
    c.revealed = true;
    if(!c.hasOre && c.adj===0){
      for(const [nx,ny] of neighbors(cx,cy, fRows.value, fCols.value)){
        const n = state.grid[idx(nx,ny, fCols.value)];
        if(n && !n.revealed && !n.hasOre) queue.push([nx,ny]);
      }
    }
  }
}

function consumeChance(){
  if(state.chances>0) state.chances--;
  if(state.chances===0){
    state.roundOver = true;
    showToast('行动次数用尽，已自动结算入库。', { type: 'info' });
  }
}

function onLeft(cell){
  if(state.suppressNextClick){ state.suppressNextClick = false; return; }
  if(cell.placeholder) return;
  if(state.roundOver) return;
  const c = state.grid[idx(cell.x, cell.y, fCols.value)];
  if(!c || c.revealed) return;
  if(c.hasOre){
    c.revealed = true;
    c.broken = true; // 矿石碎裂
    showToast('一枚矿石被破坏', { type: 'warn' });
    consumeChance();
  } else {
    revealEmpty(c.x, c.y); // 免费
  }
  checkRoundOver();
}

function onRight(cell){
  if(state.suppressNextClick){ state.suppressNextClick = false; return; }
  if(cell.placeholder) return;
  if(state.roundOver) return;
  const c = state.grid[idx(cell.x, cell.y, fCols.value)];
  if(!c || c.revealed) return;
  if(c.hasOre){
    c.revealed = true;
    c.collected = true;
    const name = c.ore?.name ?? '未知';
    const gain = randomInt(1, Math.max(1, props.oreFindMax || 100), 2);
    state.roundCollected[name] = (state.roundCollected[name]||0) + gain;
    showToast(`找到 ${name} × ${gain}！`, { type: 'success' });
    consumeChance();
  } else {
    revealEmpty(c.x, c.y);
    consumeChance();
  }
  checkRoundOver();
}

const chances = computed(()=> state.chances);
const settlementOpen = computed(()=> state.settlementOpen);
const lastRoundSummary = computed(()=> state.lastRoundSummary);
const lastRoundTotal = computed(()=> Object.values(state.lastRoundSummary).reduce((a,b)=> a + (b||0), 0));

function closeSettlement(){
  state.settlementOpen = false;
  // 离开地宫：返回地图页面，MapView 使用 KeepAlive 保持地图/雾/位置
  router.push({ path: '/map', query: { from: 'dungeon' }});
}

onMounted(() => {
  // 进入页面时随机生成地图（包括应用启动后首次打开）
  randomizeMap();
});

// 内联提示：仅显示最新一条 toast 内容
const currentTip = computed(() => {
  const list = toasts.value;
  return list.length ? list[list.length - 1].message : '';
});

function checkRoundOver(){
  if(state.roundOver) return;
  const anyHiddenOre = state.grid.some(c => c.hasOre && !c.revealed);
  if(!anyHiddenOre){
    state.roundOver = true;
    showToast('矿石已全部找出，已自动结算入库。', { type: 'success' });
    return;
  }
  // 新规则：若剩余未翻开的格子全部为矿石，则自动翻出并入库（不消耗机会）
  const unrevealed = state.grid.filter(c => !c.revealed);
  if(unrevealed.length > 0 && unrevealed.every(c => c.hasOre)){
    for(const c of unrevealed){
      c.revealed = true;
      if(!c.collected){
        c.collected = true;
        const name = c.ore?.name ?? '未知';
        const gain = randomInt(1, Math.max(1, props.oreFindMax || 100), 2);
        state.roundCollected[name] = (state.roundCollected[name]||0) + gain;
      }
    }
    state.roundOver = true;
    showToast('剩余皆为矿石，已自动采集并结算。', { type: 'success' });
  }
}

// 计算可视格子（含占位空格）
const canPadX = computed(()=> vCols.value > fCols.value);
const canPadY = computed(()=> vRows.value > fRows.value);
// 使用 floor 作为左/上留白，右/下自动多 1（当差值为奇数时），整体视觉更自然
const padLeft = computed(()=> canPadX.value ? Math.floor((vCols.value - fCols.value)/2) : 0);
const padTop = computed(()=> canPadY.value ? Math.floor((vRows.value - fRows.value)/2) : 0);
const maxOffsetX = computed(()=> Math.max(0, fCols.value - vCols.value));
const maxOffsetY = computed(()=> Math.max(0, fRows.value - vRows.value));
const canScroll = computed(()=> maxOffsetX.value > 0 || maxOffsetY.value > 0);

function atField(x,y){
  if(x<0 || y<0 || x>=fCols.value || y>=fRows.value) return null;
  return state.grid[idx(x,y, fCols.value)] || null;
}

const visibleCells = computed(()=>{
  const items=[];
  for(let vy=0; vy<vRows.value; vy++){
    for(let vx=0; vx<vCols.value; vx++){
      let fx, fy;
      // 横向：若可视 >= 真实，则居中填充；否则应用偏移
      if(vCols.value >= fCols.value){
        fx = vx - padLeft.value;
      } else {
        fx = vx + state.offsetX;
      }
      if(vRows.value >= fRows.value){
        fy = vy - padTop.value;
      } else {
        fy = vy + state.offsetY;
      }
      const base = atField(fx, fy);
      if(base){
        items.push({ ...base, key: `${vx}-${vy}-${base.id}`, placeholder: false });
      } else {
        items.push({ key: `p-${vx}-${vy}`, placeholder: true, revealed: false });
      }
    }
  }
  return items;
});

function moveView(dir){
  if(dir==='left') state.offsetX = Math.max(0, state.offsetX - 1);
  if(dir==='right') state.offsetX = Math.min(maxOffsetX.value, state.offsetX + 1);
  if(dir==='up') state.offsetY = Math.max(0, state.offsetY - 1);
  if(dir==='down') state.offsetY = Math.min(maxOffsetY.value, state.offsetY + 1);
}

function onKey(e){
  if(!canScroll.value) return;
  const map={ ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right' };
  const d = map[e.key];
  if(d){ e.preventDefault(); moveView(d); }
}

onMounted(()=> window.addEventListener('keydown', onKey));
onBeforeUnmount(()=> window.removeEventListener('keydown', onKey));

function cellTitle(cell){
  if(cell.placeholder) return '';
  const c = state.grid[idx(cell.x, cell.y, fCols.value)];
  if(!c) return '';
  return (c.revealed && !c.hasOre) ? `周围矿石：${c.adj}` : '';
}

// 自适应单元格尺寸：按容器宽度与视口高度共同约束，避免页面滚动
const gridWrapRef = ref(null);
const controlsRef = ref(null);
const panelRef = ref(null);
const cellSize = ref(32);
function updateCellSize(){
  const wrap = gridWrapRef.value;
  if(!wrap) return;
  const rect = wrap.getBoundingClientRect();
  const controlsH = controlsRef.value ? controlsRef.value.getBoundingClientRect().height : 0;
  let bottomPad = 16;
  if(panelRef.value){
    const cs = window.getComputedStyle(panelRef.value);
    bottomPad += parseFloat(cs.paddingBottom || '0');
  }
  const EXTRA_RESERVE = 32; // 额外预留，避免按钮因动态内容出现被顶出屏幕
  const reserve = controlsH + bottomPad + EXTRA_RESERVE; // 网格下方需要预留的空间
  const availableV = Math.max(100, window.innerHeight - rect.top - reserve);
  const width = wrap.clientWidth;
  // 考虑 grid 内边距与网格间距（与全局样式保持一致）
  const GRID_PAD = 12; // padding: 6px * 2
  const GRID_GAP = 1;  // gap: 1px
  const availWForCells = Math.max(0, width - GRID_PAD - GRID_GAP * Math.max(0, vCols.value - 1));
  const availHForCells = Math.max(0, availableV - GRID_PAD - GRID_GAP * Math.max(0, vRows.value - 1));
  const byCols = Math.floor(availWForCells / Math.max(1, vCols.value));
  const byRows = Math.floor(availHForCells / Math.max(1, vRows.value));
  const size = Math.max(12, Math.min(byCols, byRows));
  cellSize.value = size;
}

onMounted(()=>{
  updateCellSize();
  window.addEventListener('resize', updateCellSize);
});
onBeforeUnmount(()=> window.removeEventListener('resize', updateCellSize));

watch([vCols, vRows, canScroll], async ()=>{ await nextTick(); updateCellSize(); });

// 回合结束后自动入库并展示结算，无需按钮
watch(() => state.roundOver, (v) => {
  if(v && !state.settlementOpen){
    finalizeRound();
  }
});

function tryChord(cell){
  if(state.roundOver) return false;
  const c = state.grid[idx(cell.x, cell.y, fCols.value)];
  if(!c || !c.revealed || c.hasOre) return false; // 仅对已翻开的数字格生效
  const ns = neighbors(c.x, c.y, fRows.value, fCols.value).map(([nx,ny]) => state.grid[idx(nx,ny,fCols.value)]);
  const knownMines = ns.filter(n => n && n.hasOre && (n.collected || n.broken)).length;
  if(knownMines < c.adj) return false; // 周围矿石尚未全部探明
  // 自动翻开所有未翻开的周围格子（仅空格；安全）
  let any=false;
  for(const n of ns){
    if(!n || n.revealed) continue;
    if(!n.hasOre){
      any = true;
      revealEmpty(n.x, n.y);
    }
  }
  if(any){
    checkRoundOver();
  }
  return any;
}

function onDblClick(cell, ev){
  tryChord(cell);
}
</script>

<style scoped>
.modal-backdrop{
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display:flex;
  align-items:center;
  justify-content:center;
  padding: 16px;
  z-index: 50;
}
.modal{
  width: 100%;
  max-width: 480px;
  background: var(--panel);
  border: 1px solid #303657;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.4);
}

.inline-tip{
  background: #23273d;
  border-color: #7c83ff;
}

/* 棋盘宽度由模板列宽决定，使网格本身可被容器水平居中 */
.grid-wrap{ width: 100%; display:flex; justify-content:center; }
.grid{ width: auto; }
.grid .cell{ width: auto; height: auto; }
.cell.placeholder{ background: transparent !important; border-color: transparent !important; color: transparent !important; }
.cell.placeholder.revealed{ background: transparent !important; border-color: transparent !important; color: transparent !important; }
.invisible{ visibility: hidden; }

/* 采集/破坏/未知 标记颜色，让状态一眼可辨 */
.mark{ font-weight: 900; }
.mark-ok{ color: #36d399; text-shadow: 0 0 6px rgba(54,211,153,0.35); }
.mark-bad{ color: #ff6b81; text-shadow: 0 0 6px rgba(255,107,129,0.35); }
.mark-unknown{ color: #ffd34d; text-shadow: 0 0 6px rgba(255,211,77,0.25); }
</style>
