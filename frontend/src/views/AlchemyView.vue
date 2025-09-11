<template>
  <div class="row alchemy-row" :class="{ stacked }">
    <div class="col">
      <div class="panel">
        <h2>祭炼</h2>
        
        <!-- 棋盘：背景网格 + 绝对定位层（动画） -->
        <div class="board alchemy-board" ref="boardRef" :style="{ gridTemplateColumns: `repeat(${boardSize}, ${TILE_SIZE}px)` }">
          <!-- 背景网格（占位） -->
          <div v-for="n in slotsCount" :key="'slot-' + n" class="slot"></div>
          <!-- 绝对定位的棋子层（带动画） -->
          <div class="pieces-layer">
            <div
              v-for="p in pieces"
              :key="p.tile.id"
              class="piece"
              :class="`c-${p.tile.color}`"
              :style="pieceStyle(p)"
            >
              {{ oreDisplayName(p.tile.ore) }}
              <small>{{ Number(p.tile.exp) || 1 }}</small>
            </div>
          </div>
        </div>
        <div class="controls" style="margin-top:15px; align-items:center;">
          <button class="btn" @click="move('up')">↑</button>
          <button class="btn" @click="move('left')">←</button>
          <button class="btn" @click="move('down')">↓</button>
          <button class="btn" @click="move('right')">→</button>
          <button class="btn" @click="leave" title="放弃离开，返回福地">放弃离开</button>
          <span class="stat" v-if="won">已满足配方要求，祭炼成功！</span>
          <span class="stat" v-else>用方向键或按钮移动。</span>
        </div>
      </div>
    </div>
    <div class="col" :style="stacked ? { flex: '1 1 auto', width: '100%' } : { flex: '0 0 auto', width: infoWidth + 'px' }">
      <div class="panel" ref="infoPanelRef" :style="{ height: stacked ? 'auto' : (infoHeight + 'px'), overflow: 'auto' }">
        <h3>配方：{{ recipeDisplayName }}</h3>
        <div style="margin-top:8px;">
          <div class="recipe-info">
            <div class="recipe-requirements">
              <div v-for="req in recipe.reqs" :key="req.type" class="requirement">
                {{ oreDisplayName(req.type) }} ≥ {{ req.exp }}
              </div>
            </div>
          </div>
        </div>
        
        <h3 style="margin-top:24px;">材料损耗</h3>
        <div style="margin-top:8px;">
          <div class="badges" style="margin:6px 0;">
            <span class="badge" v-for="([name, cnt], i) in consumedEntries" :key="'consumed-'+i">
              {{ name }} × {{ cnt }}
              <small style="font-size: 0.85em;">({{ getSectInventoryCount(name) }})</small>
            </span>
            <span v-if="!consumedEntries.length" class="stat">尚无材料损耗</span>
          </div>
        </div>
        <div style="margin-top:16px;">
          <h4 style="margin:6px 0 4px;">合并规则</h4>
          <ul>
            <li>同色相邻在移动方向上相遇时合并为下一色（紫→赤循环）。</li>
            <li>同矿合并：经验相加；异矿合并：保留经验更高者。</li>
            <li>每个格子在一次移动中至多参与一次合并。</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, reactive, computed, ref, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useInventoryStore } from '../store/inventory.js';
import { ALL_ORES } from '../models/ore.js';

const COLOR_NAMES = ['赤','橙','黄','绿','青','蓝','紫'];
// 暂以常数控制棋盘尺寸；后续可改为外部传入
const BOARD_SIZE = 4;
const COLOR_CHANGE_RATE = 0.95;
const boardSize = computed(()=> Math.max(2, BOARD_SIZE));
const TILE_SIZE = 80;
const TILE_GAP = 8;
const ANIM_MS = 160;

const inv = useInventoryStore();
const router = useRouter();
const recipes = computed(()=> inv.recipes);
const recipeId = computed({
  get:()=> inv.selectedRecipeId,
  set:(v)=> inv.setRecipe(v)
});
const recipe = computed(()=> inv.selectedRecipe);
// 配方显示名称（去掉括号内容）
const recipeDisplayName = computed(() => {
  const name = recipe.value?.name || '';
  return name.replace(/\s*\(.*\)\s*/, '');
});
// 矿石显示名映射：将内部编号映射为中文名
const ORE_NAME_MAP = Object.fromEntries(ALL_ORES.map(o => [o.id, o.name]));
function oreDisplayName(id){ return ORE_NAME_MAP[id] || String(id); }

// 材料损耗统计：仅统计“同色不同矿”合并中被吞没的矿石（前方 a 被后方 b 覆盖）
const knownOreIds = new Set(Object.keys(ORE_NAME_MAP));
const consumedCounts = reactive({});
function resetConsumedCounts(){ for (const k of Object.keys(consumedCounts)) delete consumedCounts[k]; }
const consumedEntries = computed(()=> Object.entries(consumedCounts)
  .filter(([,cnt]) => (cnt|0) > 0)
  .map(([id, cnt]) => [oreDisplayName(id), cnt])
);

function getSectInventoryCount(itemName) {
  // 通过矿石显示名反向查找内部ID
  const oreId = Object.entries(ORE_NAME_MAP).find(([id, name]) => name === itemName)?.[0];
  if (oreId) {
    return inv.sectInventory[oreId] || 0;
  }
  return 0;
}

// 右侧信息面板布局与 Map 信息面板一致的宽度/布局策略
const infoPanelRef = ref(null);
const infoWidth = ref(280);
const infoHeight = ref(240);
const stacked = ref(false);
function computeLayout(){
  const vw = Math.max(320, window.innerWidth || 0);
  const quarter = vw * 0.25;
  infoWidth.value = Math.min(500, quarter);
  stacked.value = vw < 900;
  // 计算右侧面板可用高度，使其在非堆叠布局时可滚动
  if(!stacked.value && infoPanelRef.value){
    const rect = infoPanelRef.value.getBoundingClientRect();
    const padding = 16; // 底部留白
    infoHeight.value = Math.max(160, Math.floor(window.innerHeight - rect.top - padding));
  }
}

function newTile(ore, color){
  const c = Number.isInteger(color) ? color : Math.floor(Math.random() * 7); // 默认随机颜色
  return { color: c, ore, exp: 1, tier: 0, id: Math.random().toString(36).slice(2) };
}

const state = reactive({ board: Array.from({length: boardSize.value}, ()=> Array(boardSize.value).fill(null)), won:false, animating:false });
const boardRef = ref(null);
const lastSpawnColor = ref(null); // 首次随机，其后基于上一次：保持或前进一色
const slotsCount = computed(()=> boardSize.value * boardSize.value);

function emptyCells(){
  const res=[];
  for(let y=0;y<boardSize.value;y++) for(let x=0;x<boardSize.value;x++) if(!state.board[y][x]) res.push([x,y]);
  return res;
}
function spawn(count=1){
  for(let i=0;i<count;i++){
    const empties = emptyCells();
    if(empties.length===0) return;
    const [x,y] = empties[Math.floor(Math.random()*empties.length)];
    const pool = recipe.value.pool;
    const ore = pool[Math.floor(Math.random()*pool.length)];
    // 颜色选择：首次随机；之后在“保持当前色/前进一色”中随机
    let color;
    if(lastSpawnColor.value == null){
      color = Math.floor(Math.random() * 7);
    } else {
      const stay = lastSpawnColor.value;
      const next = cycleColor(lastSpawnColor.value);
      color = Math.random() < COLOR_CHANGE_RATE ? stay : next;
    }
    lastSpawnColor.value = color;
    const t = newTile(ore, color);
    t.newborn = true; // 生成动画
    state.board[y][x] = t;
    //（不在此处统计材料；仅统计“被吞没”的消耗，见合并逻辑）
  }
  // 下一帧清除 newborn 标记，使其由 scale(0.6)->scale(1) 动画
  nextTick(()=>{
    for(let y=0;y<boardSize.value;y++) for(let x=0;x<boardSize.value;x++){
      const t = state.board[y][x];
      if(t && t.newborn) t.newborn = false;
    }
  });
}

function cycleColor(c){ return (c+1) % 7; }

function lineAt(dir, index){
  const row = [];
  for(let i=0;i<boardSize.value;i++){
    if(dir==='left' || dir==='right') row.push(state.board[index][i]);
    else row.push(state.board[i][index]);
  }
  return (dir==='right' || dir==='down') ? row.reverse() : row;
}
function setLine(dir, index, items){
  const row = (dir==='right' || dir==='down') ? items.slice().reverse() : items;
  for(let i=0;i<boardSize.value;i++){
    if(dir==='left' || dir==='right') state.board[index][i] = row[i] || null;
    else state.board[i][index] = row[i] || null;
  }
}

function compressAndMerge(items, consumedList){
  const filtered = items.filter(Boolean);
  const res=[];
  for(let i=0;i<filtered.length;i++){
    const a = filtered[i];
    const b = filtered[i+1];
    if(b && a.color === b.color){
      // merge into next color
      const sameOre = a.ore === b.ore;
      const aExp = Number(a.exp) || 0;
      const bExp = Number(b.exp) || 0;
      // 矿种选择：同矿保留原矿；异矿由“后方”覆盖“前方”（b 覆盖 a）
      const ore = sameOre ? a.ore : b.ore;
      // 经验规则：同矿相加；异矿取“后方”经验（b）
      const exp = sameOre ? (aExp + bExp) : bExp;
      // 材料损耗统计：同色不同矿合并时，“前方”矿 a 被吞没
      if(!sameOre && consumedList){ consumedList.push(a.ore); }
      const nextColor = cycleColor(a.color);
      const baseTier = Math.max(Number(a.tier)||0, Number(b.tier)||0);
      const wrapped = (a.color === 6 && nextColor === 0);
      const tier = wrapped ? (baseTier + 1) : baseTier;
      const merged = { color: nextColor, ore, exp, tier, id: Math.random().toString(36).slice(2) };
      merged.pulse = true; // 合并后脉冲动画
      res.push(merged);
      i++; // skip next
    } else {
      res.push(a);
    }
  }
  while(res.length < boardSize.value) res.push(null);
  return res;
}

function move(dir){
  if(state.animating) return;
  // 记录最终行内容与每个 tile 的目标位置
  let moved = false;
  const finals = new Array(boardSize.value);
  const consumedThisMove = [];
  const moves = []; // { tile, fromX, fromY, toX, toY }
  for(let i=0;i<boardSize.value;i++){
    // 取该行/列的当前数据（不改变 state）
    const line = lineAt(dir, i);
    // 计算移动与合并目标索引（以读取方向为基准：left/up 从 0 增，right/down 使用反向写回）
    const tiles = [];
    for(let j=0;j<line.length;j++){ if(line[j]) tiles.push({ tile: line[j], j }); }
    let write = 0;
    for(let k=0;k<tiles.length;k++){
      const cur = tiles[k].tile;
      const next = (k+1<tiles.length) ? tiles[k+1].tile : null;
      let dest = write;
      const isMerge = !!(next && next.color === cur.color);
      if(isMerge){
        // 两块将合并到同一个目标格 dest
        write++;
        // k++ 延后到末尾（仍需为 next 记录移动）
      } else {
        write++;
      }
      // 计算到全局坐标的目标 (toX, toY)
      let toX=i, toY=i, fromX=i, fromY=i;
      if(dir==='left' || dir==='right'){
        fromX = cur.__x ?? null; fromY = i;
        toX = (dir==='left') ? dest : (boardSize.value - 1 - dest); toY = i;
      } else {
        fromX = i; fromY = cur.__y ?? null;
        toX = i; toY = (dir==='up') ? dest : (boardSize.value - 1 - dest);
      }
      // 当前块移动
      moves.push({ tile: cur, fromX, fromY, toX, toY });
      // 若发生合并：为 next 也记录同样的目标位移动画
      if(isMerge){
        let n_fromX=i, n_fromY=i;
        if(dir==='left' || dir==='right'){
          n_fromX = next.__x ?? null; n_fromY = i;
        } else {
          n_fromX = i; n_fromY = next.__y ?? null;
        }
        moves.push({ tile: next, fromX: n_fromX, fromY: n_fromY, toX, toY });
        k++; // 跳过 next
      }
    }
    // 计算最终行（合并逻辑）
    const merged = compressAndMerge(line, consumedThisMove);
    finals[i] = merged;
    if(JSON.stringify(line) !== JSON.stringify(merged)) moved = true;
  }
  if(!moved) return;
  state.animating = true;
  // 为所有移动的 tile 设置动画起点（当前），下一帧设置终点
  for(const m of moves){
    if(m.fromX == null || m.fromY == null){
      // 回退扫描坐标：
      // 扫描棋盘找到 m.tile 位置（O(n^2)，棋盘小，开销可接受）
      let fx=null, fy=null;
      outer: for(let yy=0; yy<boardSize.value; yy++) for(let xx=0; xx<boardSize.value; xx++){
        if(state.board[yy][xx] === m.tile){ fx=xx; fy=yy; break outer; }
      }
      m.fromX = fx ?? 0; m.fromY = fy ?? 0;
    }
    m.tile.animX = m.fromX; m.tile.animY = m.fromY;
  }
  nextTick(()=>{
    for(const m of moves){ m.tile.animX = m.toX; m.tile.animY = m.toY; }
    // 在动画结束后，提交最终状态
    setTimeout(async ()=>{
      // 清除动画标记
      for(const m of moves){ delete m.tile.animX; delete m.tile.animY; }
      // 应用最终合并结果
      for(let i=0;i<boardSize.value;i++) setLine(dir, i, finals[i]);
      // 统计本次移动的材料消耗（仅统计已知矿种）
      for(const id of consumedThisMove){ if(knownOreIds.has(id)) consumedCounts[id] = (consumedCounts[id] || 0) + 1; }
      // 先生成新格子
      spawn(1);
      // 等待视图更新并完成一次渲染，再进行失败/胜利判定，避免提示先于新格子出现
      await nextTick();
      await new Promise(resolve => requestAnimationFrame(() => resolve()));
      nextTick(()=>{
        for(let y=0;y<boardSize.value;y++) for(let x=0;x<boardSize.value;x++){
          const t = state.board[y][x];
          if(t && t.pulse) t.pulse = false;
        }
      });
      setTimeout(() => checkWin(), ANIM_MS + 20);
      state.animating = false;
    }, ANIM_MS + 20);
  });
}

function resetBoard(){
  state.board = Array.from({length: boardSize.value}, ()=> Array(boardSize.value).fill(null));
  state.won = false;
  lastSpawnColor.value = null;
  resetConsumedCounts();
  spawn(2);
}

function checkWin(){
  const reqs = recipe.value.reqs;
  state.won = reqs.every(r => {
    let ok=false;
    for(let y=0;y<boardSize.value;y++) for(let x=0;x<boardSize.value;x++){
      const t = state.board[y][x];
      if(t && t.ore === r.type && t.exp >= r.exp){ ok = true; break; }
    }
    return ok;
  });
  
  if (state.won) {
    endGame(true, '祭炼成功！');
  } else {
    // 检查游戏结束条件
    checkGameOver();
  }
}

function checkGameOver() {
  // 条件1: 检查投入物品总量是否超过宗门仓库库存
  const totalUsed = calculateTotalUsedItems();
  for (const [itemId, usedCount] of Object.entries(totalUsed)) {
    const sectStock = inv.sectInventory[itemId] || 0;
    if (usedCount >= sectStock) {
      endGame(false, `${oreDisplayName(itemId)}投入总量超过宗门库存，祭炼失败！`);
      return;
    }
  }

  // 条件2: 检查是否还有可移动的格子（包括合并）
  const emptySlots = emptyCells();
  if (emptySlots.length === 0 && !hasPossibleMoves()) {
    endGame(false, '没有可移动的格子，祭炼失败！');
    return;
  }
}

function hasPossibleMoves() {
  // 检查四个相邻格子是否有相同颜色的可以合并
  for (let y = 0; y < boardSize.value; y++) {
    for (let x = 0; x < boardSize.value; x++) {
      const tile = state.board[y][x];
      if (!tile) continue;
      
      // 检查四个相邻格子是否有相同颜色的
      const neighbors = [
        {x: x-1, y}, {x: x+1, y}, {x, y: y-1}, {x, y: y+1}
      ];
      
      for (const neighbor of neighbors) {
        if (neighbor.x >= 0 && neighbor.x < boardSize.value && 
            neighbor.y >= 0 && neighbor.y < boardSize.value) {
          const neighborTile = state.board[neighbor.y][neighbor.x];
          if (neighborTile && neighborTile.color === tile.color) {
            return true; // 有相邻相同颜色的格子可以合并
          }
        }
      }
    }
  }
  return false; // 没有可合并的格子
}



function calculateTotalUsedItems() {
  const totalUsed = {};
  
  // 统计棋盘上所有物品
  for(let y=0;y<boardSize.value;y++) for(let x=0;x<boardSize.value;x++){
    const t = state.board[y][x];
    if(t) {
      totalUsed[t.ore] = (totalUsed[t.ore] || 0) + 1;
    }
  }
  
  // 加上已消耗的物品
  for(const [itemId, consumedCount] of Object.entries(consumedCounts)) {
    totalUsed[itemId] = (totalUsed[itemId] || 0) + consumedCount;
  }
  
  return totalUsed;
}

function endGame(success, message) {
  // 无论成功与否，都根据材料损耗扣除宗门仓库物品
  for (const [itemId, consumedCount] of Object.entries(consumedCounts)) {
    if (consumedCount > 0) {
      const currentStock = inv.sectInventory[itemId] || 0;
      const newStock = Math.max(0, currentStock - consumedCount);
      inv.sectInventory[itemId] = newStock;
    }
  }
  
  if (success) {
    // 祭炼成功：将新物品加入宗门仓库
    const recipeName = recipeDisplayName.value;
    inv.addSectOre(recipeName, 1);
    alert(`恭喜！${message}`);
  } else {
    alert(message);
  }
  
  // 返回福地
  setTimeout(() => {
    router.push('/map');
  }, 1500);
}

function onKey(e){
  const map={ ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right' };
  const d = map[e.key];
  if(d){ e.preventDefault(); move(d); }
}

function leave(){
  endGame(false, '放弃离开，祭炼失败！');
}

onMounted(async ()=>{
  window.addEventListener('keydown', onKey);
  window.addEventListener('resize', computeLayout);
  await nextTick();
  computeLayout();
  resetBoard();
});
onBeforeUnmount(()=> {
  window.removeEventListener('keydown', onKey);
  window.removeEventListener('resize', computeLayout);
});

// 以 tile-id 渲染绝对定位棋子，附带位置坐标（用于动画）
const pieces = computed(()=>{
  const res=[];
  for(let y=0;y<boardSize.value;y++) for(let x=0;x<boardSize.value;x++){
    const t = state.board[y][x];
    if(t){ t.__x = x; t.__y = y; res.push({ tile: t, x, y }); }
  }
  return res;
});

function pieceStyle(p){
  const x = p.x * (TILE_SIZE + TILE_GAP);
  const y = p.y * (TILE_SIZE + TILE_GAP);
  let scale = 1;
  if(p.tile.newborn) scale = 0.6;
  else if(p.tile.pulse) scale = 1.15;
  const useX = Number.isFinite(p.tile.animX) ? p.tile.animX : p.x;
  const useY = Number.isFinite(p.tile.animY) ? p.tile.animY : p.y;
  const tx = useX * (TILE_SIZE + TILE_GAP);
  const ty = useY * (TILE_SIZE + TILE_GAP);
  const opacity = p.tile.newborn ? 0 : 1;
  return { transform: `translate(${tx}px, ${ty}px) scale(${scale})`, opacity, width: TILE_SIZE + 'px', height: TILE_SIZE + 'px' };
}

</script>

<style scoped>
.alchemy-row.stacked{ flex-direction: column; }
</style>
