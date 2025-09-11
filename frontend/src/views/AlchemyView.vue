<template>
  <div class="row">
    <div class="col">
      <div class="panel">
        <h2>祭炼（2048 规则 + 矿石经验）</h2>
        <div style="display:flex; gap:8px; align-items:center; margin:8px 0;">
          <label>配方：</label>
          <select class="select" v-model="recipeId">
            <option v-for="r in recipes" :key="r.id" :value="r.id">{{ r.name }}</option>
          </select>
          <button class="btn" @click="resetBoard">重开</button>
          <div class="badges">
            <span class="badge" v-for="r in recipe.reqs" :key="r.type">{{ r.type }} ≥ {{ r.exp }}</span>
          </div>
        </div>
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
              {{ COLOR_NAMES[p.tile.color] }}
              <small>{{ p.tile.ore }}·XP{{ p.tile.exp }}</small>
            </div>
          </div>
        </div>
        <div class="controls" style="margin-top:15px; align-items:center;">
          <button class="btn" @click="move('up')">↑</button>
          <button class="btn" @click="move('left')">←</button>
          <button class="btn" @click="move('down')">↓</button>
          <button class="btn" @click="move('right')">→</button>
          <span class="stat" v-if="won">已满足配方要求，祭炼成功！</span>
          <span class="stat" v-else>用方向键或按钮移动。</span>
        </div>
      </div>
    </div>
    <div class="col" :style="stacked ? { flex: '1 1 auto', width: '100%' } : { flex: '0 0 auto', width: infoWidth + 'px' }">
      <div class="panel" ref="infoPanelRef">
        <h3>材料损耗</h3>
        <ul>
          <li>同矿合并：无损耗，经验相加（XP 相加）。</li>
          <li>异矿合并：保留经验更高的一块，另一块视为损耗（XP 取较高者）。</li>
          <li>彩虹色升级：仅影响颜色进阶，不改变损耗规则。</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, reactive, computed, ref, nextTick } from 'vue';
import { useInventoryStore } from '../store/inventory.js';

const COLOR_NAMES = ['赤','橙','黄','绿','青','蓝','紫'];
// 暂以常数控制棋盘尺寸；后续可改为外部传入
const BOARD_SIZE = 4;
const COLOR_CHANGE_RATE = 0.95;
const boardSize = computed(()=> Math.max(2, BOARD_SIZE));
const TILE_SIZE = 80;
const TILE_GAP = 8;
const ANIM_MS = 160;

const inv = useInventoryStore();
const recipes = computed(()=> inv.recipes);
const recipeId = computed({
  get:()=> inv.selectedRecipeId,
  set:(v)=> inv.setRecipe(v)
});
const recipe = computed(()=> inv.selectedRecipe);

// 右侧信息面板布局与 Map 信息面板一致的宽度/布局策略
const infoPanelRef = ref(null);
const infoWidth = ref(280);
const stacked = ref(false);
function computeLayout(){
  const vw = Math.max(320, window.innerWidth || 0);
  const quarter = vw * 0.25;
  infoWidth.value = Math.min(500, quarter);
  stacked.value = vw < 900;
}

function newTile(ore, color){
  const c = Number.isInteger(color) ? color : Math.floor(Math.random() * 7); // 默认随机颜色
  return { color: c, ore, exp: 1, id: Math.random().toString(36).slice(2) };
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

function compressAndMerge(items){
  const filtered = items.filter(Boolean);
  const res=[];
  for(let i=0;i<filtered.length;i++){
    const a = filtered[i];
    const b = filtered[i+1];
    if(b && a.color === b.color){
      // merge into next color
      const sameOre = a.ore === b.ore;
      const ore = sameOre ? a.ore : (a.exp >= b.exp ? a.ore : b.ore);
      const exp = sameOre ? (a.exp + b.exp) : Math.max(a.exp, b.exp);
      const merged = { color: cycleColor(a.color), ore, exp, id: Math.random().toString(36).slice(2) };
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
    const merged = compressAndMerge(line);
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
    setTimeout(()=>{
      // 清除动画标记
      for(const m of moves){ delete m.tile.animX; delete m.tile.animY; }
      // 应用最终合并结果
      for(let i=0;i<boardSize.value;i++) setLine(dir, i, finals[i]);
      spawn(1);
      checkWin();
      nextTick(()=>{
        for(let y=0;y<boardSize.value;y++) for(let x=0;x<boardSize.value;x++){
          const t = state.board[y][x];
          if(t && t.pulse) t.pulse = false;
        }
      });
      state.animating = false;
    }, ANIM_MS + 20);
  });
}

function resetBoard(){
  state.board = Array.from({length: boardSize.value}, ()=> Array(boardSize.value).fill(null));
  state.won = false;
  lastSpawnColor.value = null;
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
}

function onKey(e){
  const map={ ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right' };
  const d = map[e.key];
  if(d){ e.preventDefault(); move(d); }
}

onMounted(()=>{
  window.addEventListener('keydown', onKey);
  window.addEventListener('resize', computeLayout);
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
