import { GraphNode, GraphEdge, AlgorithmResults } from '../types/graph';

export function runTarjanSCC(nodes: GraphNode[], edges: GraphEdge[]) {
  const nodeMap = new Map<string, number>();
  nodes.forEach((n, idx) => nodeMap.set(n.id, idx));

  const n = nodes.length;
  const adj: number[][] = Array.from({ length: n }, () => []);

  edges.forEach((e) => {
    const u = nodeMap.get(e.source);
    const v = nodeMap.get(e.target);
    if (u !== undefined && v !== undefined) {
      adj[u].push(v);
    }
  });

  const dfn = new Int32Array(n).fill(-1);
  const low = new Int32Array(n).fill(-1);
  const inStack = new Uint8Array(n);
  const stack: number[] = [];
  let timer = 0;

  const sccs: number[][] = [];

  function dfs(u: number) {
    dfn[u] = low[u] = ++timer;
    stack.push(u);
    inStack[u] = 1;

    for (const v of adj[u]) {
      if (dfn[v] === -1) {
        dfs(v);
        low[u] = Math.min(low[u], low[v]);
      } else if (inStack[v] === 1) {
        low[u] = Math.min(low[u], dfn[v]);
      }
    }

    if (dfn[u] === low[u]) {
      const component: number[] = [];
      while (true) {
        const v = stack.pop()!;
        inStack[v] = 0;
        component.push(v);
        if (v === u) break;
      }
      if (component.length > 1) {
        sccs.push(component);
      }
    }
  }

  for (let i = 0; i < n; i++) {
    if (dfn[i] === -1) {
      dfs(i);
    }
  }

  const fraudRings = sccs.map((comp) => comp.map((idx) => nodes[idx].id));

  // Extract explicit cycles
  const explicitCycles: string[][] = [];
  for (const comp of sccs) {
    const compSet = new Set(comp);
    const visited = new Uint8Array(n);
    const path: number[] = [];

    const findCycle = (curr: number, origin: number): boolean => {
      visited[curr] = 1;
      path.push(curr);

      for (const next of adj[curr]) {
        if (!compSet.has(next)) continue;
        if (next === origin && path.length >= 2) {
          path.push(origin);
          explicitCycles.push(path.map((idx) => nodes[idx].id));
          path.pop();
          return true;
        }
        if (visited[next] === 0) {
          if (findCycle(next, origin)) return true;
        }
      }

      path.pop();
      visited[curr] = 0;
      return false;
    };

    for (const root of comp) {
      visited.fill(0);
      findCycle(root, root);
      if (explicitCycles.length >= 5) break;
    }
  }

  return { fraudRings, explicitCycles };
}

export function runPageRank(nodes: GraphNode[], edges: GraphEdge[], damping = 0.85, maxIter = 50, tol = 1e-5) {
  const n = nodes.length;
  if (n === 0) return { scores: new Map<string, number>(), iterations: 0, converged: true };

  const nodeMap = new Map<string, number>();
  nodes.forEach((node, idx) => nodeMap.set(node.id, idx));

  const outDegree = new Int32Array(n);
  const outEdges: number[][] = Array.from({ length: n }, () => []);

  edges.forEach((e) => {
    const u = nodeMap.get(e.source);
    const v = nodeMap.get(e.target);
    if (u !== undefined && v !== undefined) {
      outDegree[u]++;
      outEdges[u].push(v);
    }
  });

  let scores = new Float64Array(n).fill(1 / n);
  let nextScores = new Float64Array(n);
  let iterations = 0;
  let converged = false;

  for (let it = 0; it < maxIter; it++) {
    iterations++;
    let danglingSum = 0;
    for (let i = 0; i < n; i++) {
      if (outDegree[i] === 0) {
        danglingSum += scores[i];
      }
    }

    const baseVal = (1.0 - damping) / n + (damping * danglingSum) / n;
    nextScores.fill(baseVal);

    for (let u = 0; u < n; u++) {
      if (outDegree[u] > 0) {
        const share = (damping * scores[u]) / outDegree[u];
        for (const v of outEdges[u]) {
          nextScores[v] += share;
        }
      }
    }

    let diff = 0;
    for (let i = 0; i < n; i++) {
      diff += Math.abs(nextScores[i] - scores[i]);
    }

    scores = new Float64Array(nextScores);
    if (diff < tol) {
      converged = true;
      break;
    }
  }

  const scoreMap = new Map<string, number>();
  nodes.forEach((node, idx) => {
    scoreMap.set(node.id, Number(scores[idx].toFixed(4)));
  });

  return { scores: scoreMap, iterations, converged };
}

export function runDijkstra(nodes: GraphNode[], edges: GraphEdge[], startId: string, endId: string) {
  const nodeMap = new Map<string, number>();
  nodes.forEach((n, idx) => nodeMap.set(n.id, idx));

  const uStart = nodeMap.get(startId);
  const uEnd = nodeMap.get(endId);

  if (uStart === undefined || uEnd === undefined) {
    return { path: [], cost: Infinity, exploredNodes: 0 };
  }

  const n = nodes.length;
  const adj: { target: number; weight: number }[][] = Array.from({ length: n }, () => []);

  edges.forEach((e) => {
    const u = nodeMap.get(e.source);
    const v = nodeMap.get(e.target);
    if (u !== undefined && v !== undefined) {
      // Risk-weighted traversal cost (higher risk = higher priority or normalized metric)
      const cost = Math.max(1, Math.round(1000000 / (e.weight + 100)));
      adj[u].push({ target: v, weight: cost });
    }
  });

  const dist = new Float64Array(n).fill(Infinity);
  const parent = new Int32Array(n).fill(-1);
  const visited = new Uint8Array(n);

  dist[uStart] = 0;
  let explored = 0;

  for (let i = 0; i < n; i++) {
    let minDist = Infinity;
    let u = -1;

    for (let j = 0; j < n; j++) {
      if (visited[j] === 0 && dist[j] < minDist) {
        minDist = dist[j];
        u = j;
      }
    }

    if (u === -1 || u === uEnd) break;
    visited[u] = 1;
    explored++;

    for (const edge of adj[u]) {
      if (visited[edge.target] === 0 && dist[u] + edge.weight < dist[edge.target]) {
        dist[edge.target] = dist[u] + edge.weight;
        parent[edge.target] = u;
      }
    }
  }

  if (dist[uEnd] === Infinity) {
    return { path: [], cost: Infinity, exploredNodes: explored };
  }

  const path: string[] = [];
  let curr = uEnd;
  while (curr !== -1) {
    path.push(nodes[curr].id);
    if (curr === uStart) break;
    curr = parent[curr];
  }
  path.reverse();

  return { path, cost: dist[uEnd], exploredNodes: explored };
}

export function runLouvainClustering(nodes: GraphNode[], edges: GraphEdge[]) {
  const n = nodes.length;
  const nodeMap = new Map<string, number>();
  nodes.forEach((node, idx) => nodeMap.set(node.id, idx));

  const community = new Int32Array(n);
  for (let i = 0; i < n; i++) community[i] = i;

  const adj: { target: number; weight: number }[][] = Array.from({ length: n }, () => []);
  edges.forEach((e) => {
    const u = nodeMap.get(e.source);
    const v = nodeMap.get(e.target);
    if (u !== undefined && v !== undefined) {
      adj[u].push({ target: v, weight: e.weight });
      adj[v].push({ target: u, weight: e.weight });
    }
  });

  // Simplified modularity-maximizing label propagation
  for (let pass = 0; pass < 5; pass++) {
    for (let u = 0; u < n; u++) {
      const weights = new Map<number, number>();
      for (const edge of adj[u]) {
        const comm = community[edge.target];
        weights.set(comm, (weights.get(comm) || 0) + edge.weight);
      }

      let bestComm = community[u];
      let maxW = 0;
      weights.forEach((w, comm) => {
        if (w > maxW) {
          maxW = w;
          bestComm = comm;
        }
      });
      community[u] = bestComm;
    }
  }

  const remap = new Map<number, number>();
  let nextId = 0;
  const result = new Map<string, number>();

  nodes.forEach((node, idx) => {
    const c = community[idx];
    if (!remap.has(c)) {
      remap.set(c, nextId++);
    }
    result.set(node.id, remap.get(c)!);
  });

  return { communityMap: result, count: nextId };
}
