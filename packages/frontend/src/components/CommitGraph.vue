<template>
  <svg :width="width" :height="height" class="commit-graph">
    <!-- Draw branches first -->
    <g v-for="(branch, branchIndex) in branches" :key="`branch-${branchIndex}`">
      <path
        :d="branch.path"
        :stroke="branch.color"
        stroke-width="2"
        fill="none"
      />
    </g>
    
    <!-- Draw commit dots on top -->
    <g v-for="vertex in vertices" :key="vertex.sha">
      <circle
        :cx="vertex.x"
        :cy="vertex.y"
        r="4"
        :fill="vertex.color"
        :stroke="vertex.color"
        stroke-width="1"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Commit } from '@forkweb/shared';
import { graphColors } from '@/utils/branchColors';

interface Props {
  commits: Commit[];
  rowHeight?: number;
}

const props = withDefaults(defineProps<Props>(), {
  rowHeight: 36,
});

const colors = graphColors;
const laneWidth = 16;
const leftPadding = 8;

interface Point {
  x: number;
  y: number;
}

interface Line {
  p1: Point;
  p2: Point;
}

class Branch {
  private lines: Line[] = [];
  public readonly colorIndex: number;
  
  constructor(colorIndex: number) {
    this.colorIndex = colorIndex;
  }
  
  addLine(p1: Point, p2: Point) {
    this.lines.push({ p1, p2 });
  }
  
  getPath(): string {
    if (this.lines.length === 0) return '';
    
    let path = '';
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      // Convert logical coordinates to pixels
      const x1 = leftPadding + line.p1.x * laneWidth + laneWidth / 2;
      const y1 = line.p1.y;
      const x2 = leftPadding + line.p2.x * laneWidth + laneWidth / 2;
      const y2 = line.p2.y;
      
      if (i === 0 || (i > 0 && (x1 !== leftPadding + this.lines[i-1].p2.x * laneWidth + laneWidth / 2 || y1 !== this.lines[i-1].p2.y))) {
        path += `M ${x1.toFixed(0)} ${y1.toFixed(1)} `;
      }
      
      if (x1 === x2) {
        // Vertical line
        path += `L ${x2.toFixed(0)} ${y2.toFixed(1)} `;
      } else {
        // Curved line for transitions
        const d = props.rowHeight * 0.5;
        path += `C ${x1.toFixed(0)} ${(y1 + d).toFixed(1)}, ${x2.toFixed(0)} ${(y2 - d).toFixed(1)}, ${x2.toFixed(0)} ${y2.toFixed(1)} `;
      }
    }
    
    return path.trim();
  }
  
  getColor(): string {
    return colors[this.colorIndex % colors.length];
  }
}

class Vertex {
  public readonly sha: string;
  public readonly index: number;
  public lane: number = -1;
  public branch: Branch | null = null;
  public readonly parentShas: string[];
  public parents: Vertex[] = [];
  public children: Vertex[] = [];
  private nextLane: number = 0;
  
  constructor(sha: string, index: number, parentShas: string[]) {
    this.sha = sha;
    this.index = index;
    this.parentShas = parentShas;
  }
  
  getY(): number {
    return this.index * props.rowHeight + props.rowHeight / 2;
  }
  
  getPoint(): Point {
    return { x: this.lane, y: this.getY() };
  }
  
  getNextAvailableLane(): number {
    return this.nextLane;
  }
  
  reserveLane(lane: number) {
    if (lane >= this.nextLane) {
      this.nextLane = lane + 1;
    }
  }
  
  addToBranch(branch: Branch, lane: number) {
    if (this.branch === null) {
      this.branch = branch;
      this.lane = lane;
      this.reserveLane(lane);
    }
  }
  
  isOnBranch(): boolean {
    return this.branch !== null;
  }
  
  getColor(): string {
    return this.branch ? this.branch.getColor() : colors[0];
  }
}

const graphData = computed(() => {
  const commits = props.commits;
  if (commits.length === 0) {
    return { vertices: [], branches: [], maxLane: 0 };
  }
  
  const vertexList: Vertex[] = [];
  const branchList: Branch[] = [];
  const availableColors: number[] = [];
  const commitLookup = new Map<string, number>();
  
  // Step 1: Create vertices and build parent-child relationships
  for (let i = 0; i < commits.length; i++) {
    const commit = commits[i];
    commitLookup.set(commit.sha, i);
    vertexList.push(new Vertex(commit.sha, i, commit.parents || []));
  }
  
  // Link parents and children
  for (let i = 0; i < vertexList.length; i++) {
    const vertex = vertexList[i];
    for (const parentSha of vertex.parentShas) {
      const parentIdx = commitLookup.get(parentSha);
      if (parentIdx !== undefined) {
        const parentVertex = vertexList[parentIdx];
        vertex.parents.push(parentVertex);
        parentVertex.children.push(vertex);
      }
    }
  }
  
  console.log('[CommitGraph] Processing', commits.length, 'commits');
  
  // Step 2: New algorithm - assign lanes based on branch age and use bottom-level connections
  
  // First, identify all unique branches by tracing from each commit to its root
  const branchPaths: Array<{
    commits: Vertex[];
    oldestCommitIndex: number;
    lane: number;
  }> = [];
  
  const getAvailableColor = (startAt: number): number => {
    for (let i = 0; i < availableColors.length; i++) {
      if (startAt > availableColors[i]) {
        return i;
      }
    }
    availableColors.push(0);
    return availableColors.length - 1;
  };
  
  // Identify all branch paths
  for (let i = 0; i < vertexList.length; i++) {
    const vertex = vertexList[i];
    
    if (!vertex.isOnBranch()) {
      // Trace this branch to find all commits in it
      const branchCommits: Vertex[] = [];
      let current = vertex;
      
      while (current && !current.isOnBranch()) {
        branchCommits.push(current);
        if (current.parents.length === 0) break;
        
        // Follow first parent
        const nextParent = current.parents[0];
        if (nextParent.isOnBranch()) break;
        current = nextParent;
      }
      
      // Find the oldest commit index in this branch
      const oldestIndex = Math.max(...branchCommits.map(c => c.index));
      
      branchPaths.push({
        commits: branchCommits,
        oldestCommitIndex: oldestIndex,
        lane: -1 // Will be assigned later
      });
    }
  }
  
  // Sort branches by oldest commit time (newer branches get smaller lane numbers - leftward)
  branchPaths.sort((a, b) => a.oldestCommitIndex - b.oldestCommitIndex);
  
  // Assign lanes
  for (let i = 0; i < branchPaths.length; i++) {
    branchPaths[i].lane = i;
  }
  
  console.log('[Branches found]', branchPaths.length);
  
  // Step 3: Create branches and assign vertices to lanes
  for (const branchPath of branchPaths) {
    const colorIndex = getAvailableColor(branchPath.lane);
    const branch = new Branch(colorIndex);
    
    // Assign all commits in this branch to the same lane
    for (const vertex of branchPath.commits) {
      vertex.addToBranch(branch, branchPath.lane);
    }
    
    // Draw the main branch line (vertical connections within the branch)
    for (let i = 0; i < branchPath.commits.length - 1; i++) {
      const current = branchPath.commits[i];
      const next = branchPath.commits[i + 1];
      branch.addLine(current.getPoint(), next.getPoint());
    }
    
    // Handle connection to parent (if any)
    const oldestCommit = branchPath.commits[branchPath.commits.length - 1];
    if (oldestCommit.parents.length > 0) {
      const parent = oldestCommit.parents[0];
      
      if (parent.isOnBranch()) {
        // Parent is on another branch - use bottom-level connection
        const currentPoint = oldestCommit.getPoint();
        const parentPoint = parent.getPoint();
        
        // Calculate bottom level (below the oldest commit)
        const bottomLevel = currentPoint.y + props.rowHeight;
        
        // Draw: down to bottom level, then horizontal to parent lane, then up to parent
        const bottomCurrent = { x: currentPoint.x, y: bottomLevel };
        const bottomParent = { x: parentPoint.x, y: bottomLevel };
        
        branch.addLine(currentPoint, bottomCurrent); // Down to bottom level
        branch.addLine(bottomCurrent, bottomParent); // Horizontal at bottom level
        branch.addLine(bottomParent, parentPoint); // Up to parent
      }
    }
    
    branchList.push(branch);
    availableColors[colorIndex] = vertexList.length;
  }
  
  // Step 4: Handle merge commits (when a commit has multiple parents)
  for (let i = 0; i < vertexList.length; i++) {
    const vertex = vertexList[i];
    
    if (vertex.parents.length > 1 && vertex.branch) {
      const mergeCommitLane = vertex.lane;
      const mergeCommitPoint = vertex.getPoint();
      
      // Process each additional parent (skip first, already handled above)
      for (let p = 1; p < vertex.parents.length; p++) {
        const parent = vertex.parents[p];
        
        if (parent.isOnBranch()) {
          // Parent is already on a branch, just draw connection
          const parentPoint = parent.getPoint();
          
          // Create a temporary branch for this connection
          const colorIndex = getAvailableColor(i);
          const mergeBranch = new Branch(colorIndex);
          
          // Use bottom-level connection for merge
          const bottomLevel = mergeCommitPoint.y + props.rowHeight;
          const bottomMerge = { x: mergeCommitLane, y: bottomLevel };
          const bottomParent = { x: parentPoint.x, y: bottomLevel };
          
          mergeBranch.addLine(mergeCommitPoint, bottomMerge);
          mergeBranch.addLine(bottomMerge, bottomParent);
          mergeBranch.addLine(bottomParent, parentPoint);
          
          branchList.push(mergeBranch);
          availableColors[colorIndex] = vertexList.length;
        }
      }
    }
  }
  
  // Convert to pixel coordinates (filter out any vertices without lanes assigned)
  const pixelVertices = vertexList
    .filter(v => v.lane >= 0)
    .map(v => ({
      sha: v.sha,
      x: leftPadding + v.lane * laneWidth + laneWidth / 2,
      y: v.getY(),
      color: v.getColor(),
    }));
  
  const pixelBranches = branchList.map(b => ({
    path: b.getPath(),
    color: b.getColor(),
  }));
  
  const maxLane = Math.max(...vertexList.filter(v => v.lane >= 0).map(v => v.lane), 0);
  
  console.log('[CommitGraph] Generated:', {
    vertices: pixelVertices.length,
    branches: pixelBranches.length,
    maxLane,
    firstVertex: pixelVertices[0],
    firstBranch: pixelBranches[0]
  });
  
  return { vertices: pixelVertices, branches: pixelBranches, maxLane };
});

const vertices = computed(() => graphData.value.vertices);
const branches = computed(() => graphData.value.branches);
const maxLane = computed(() => graphData.value.maxLane);

const width = computed(() => {
  const w = leftPadding + (maxLane.value + 1) * laneWidth + 8;
  console.log('CommitGraph width:', w, 'maxLane:', maxLane.value);
  return w;
});

const height = computed(() => {
  const h = props.commits.length * props.rowHeight;
  console.log('CommitGraph height:', h, 'commits:', props.commits.length);
  return h;
});
</script>

<style scoped>
.commit-graph {
  flex-shrink: 0;
}
</style>
