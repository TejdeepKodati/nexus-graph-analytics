'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Network, 
  ShieldAlert, 
  Layers, 
  GitBranch, 
  FileCheck, 
  Search, 
  RefreshCw, 
  Info, 
  ExternalLink, 
  Github, 
  Database,
  Sliders,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import GraphCanvas from '../components/GraphCanvas';
import ExecutiveReportModal from '../components/ExecutiveReportModal';
import { enterpriseDatasets } from '../data/mockDatasets';
import { GraphNode, GraphEdge, EnterpriseDataset } from '../types/graph';
import { runTarjanSCC, runPageRank, runDijkstra, runLouvainClustering } from '../lib/graphAlgorithms';

export default function Home() {
  const [selectedDatasetIndex, setSelectedDatasetIndex] = useState(0);
  const currentDataset = enterpriseDatasets[selectedDatasetIndex];

  const [nodes, setNodes] = useState<GraphNode[]>(currentDataset.nodes);
  const [edges, setEdges] = useState<GraphEdge[]>(currentDataset.edges);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // Algorithm states
  const [activeAlgorithm, setActiveAlgorithm] = useState<'NONE' | 'TARJAN' | 'PAGERANK' | 'LOUVAIN' | 'DIJKSTRA'>('NONE');
  const [fraudRings, setFraudRings] = useState<string[][]>([]);
  const [explicitCycles, setExplicitCycles] = useState<string[][]>([]);
  const [pageRankScores, setPageRankScores] = useState<Map<string, number>>(new Map());
  const [communityMap, setCommunityMap] = useState<Map<string, number>>(new Map());
  const [shortestPathNodes, setShortestPathNodes] = useState<string[]>([]);
  const [algoLatencyMs, setAlgoLatencyMs] = useState<number | null>(null);
  const [algoStats, setAlgoStats] = useState<string>('');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [minRiskThreshold, setMinRiskThreshold] = useState(0);

  // Modal
  const [showReportModal, setShowReportModal] = useState(false);

  // Sync on dataset change
  useEffect(() => {
    setNodes(currentDataset.nodes);
    setEdges(currentDataset.edges);
    setSelectedNode(null);
    setActiveAlgorithm('NONE');
    setFraudRings([]);
    setExplicitCycles([]);
    setPageRankScores(new Map());
    setCommunityMap(new Map());
    setShortestPathNodes([]);
    setAlgoLatencyMs(null);
    setAlgoStats('');
  }, [selectedDatasetIndex, currentDataset]);

  // Derived sets for canvas highlighting
  const fraudRingNodeIds = useMemo(() => {
    const set = new Set<string>();
    fraudRings.forEach((comp) => comp.forEach((id) => set.add(id)));
    return set;
  }, [fraudRings]);

  const highlightedEdgeIds = useMemo(() => {
    const set = new Set<string>();
    if (shortestPathNodes.length >= 2) {
      for (let i = 0; i < shortestPathNodes.length - 1; i++) {
        const u = shortestPathNodes[i];
        const v = shortestPathNodes[i + 1];
        const found = edges.find((e) => (e.source === u && e.target === v) || (e.source === v && e.target === u));
        if (found) set.add(found.id);
      }
    }
    return set;
  }, [shortestPathNodes, edges]);

  // Run Algorithms
  const executeTarjan = () => {
    const t0 = performance.now();
    const { fraudRings: rings, explicitCycles: cycles } = runTarjanSCC(nodes, edges);
    const t1 = performance.now();
    setFraudRings(rings);
    setExplicitCycles(cycles);
    setActiveAlgorithm('TARJAN');
    setAlgoLatencyMs(Number((t1 - t0).toFixed(2)));
    setAlgoStats(`Detected ${rings.length} SCC ring(s) containing ${rings.flat().length} nodes.`);
  };

  const executePageRank = () => {
    const t0 = performance.now();
    const { scores, iterations, converged } = runPageRank(nodes, edges);
    const t1 = performance.now();
    setPageRankScores(scores);
    setActiveAlgorithm('PAGERANK');
    setAlgoLatencyMs(Number((t1 - t0).toFixed(2)));
    setAlgoStats(`Converged in ${iterations} iterations (tolerance: 1e-5).`);
  };

  const executeLouvain = () => {
    const t0 = performance.now();
    const { communityMap: cMap, count } = runLouvainClustering(nodes, edges);
    const t1 = performance.now();
    setCommunityMap(cMap);
    setActiveAlgorithm('LOUVAIN');
    setAlgoLatencyMs(Number((t1 - t0).toFixed(2)));
    setAlgoStats(`Partitioned network into ${count} distinct risk communities.`);
  };

  const executeDijkstra = () => {
    if (nodes.length < 2) return;
    const startNode = nodes[0].id;
    const endNode = nodes[nodes.length - 1].id;
    const t0 = performance.now();
    const { path, cost, exploredNodes } = runDijkstra(nodes, edges, startNode, endNode);
    const t1 = performance.now();
    setShortestPathNodes(path);
    setActiveAlgorithm('DIJKSTRA');
    setAlgoLatencyMs(Number((t1 - t0).toFixed(2)));
    setAlgoStats(`Explored ${exploredNodes} nodes | Path length: ${path.length} hops | Cost: ${cost}`);
  };

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return nodes.filter((n) => {
      const matchSearch = n.name.toLowerCase().includes(searchQuery.toLowerCase()) || n.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchRisk = n.riskScore >= minRiskThreshold;
      return matchSearch && matchRisk;
    });
  }, [nodes, searchQuery, minRiskThreshold]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-[#86BC25]/30">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#86BC25] text-slate-950 shadow-lg shadow-[#86BC25]/20">
              <Network className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base tracking-tight text-white">NexusGraph</span>
                <span className="rounded bg-[#86BC25]/20 px-1.5 py-0.5 text-[10px] font-semibold text-[#86BC25] uppercase tracking-wider">Enterprise Analytics</span>
              </div>
              <p className="text-[11px] text-slate-400">Knowledge Graph & Fraud Intelligence Engine • Deloitte Advisory Architecture</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Dataset Selector */}
            <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300">
              <Database className="h-3.5 w-3.5 mr-2 text-[#86BC25]" />
              <select
                value={selectedDatasetIndex}
                onChange={(e) => setSelectedDatasetIndex(Number(e.target.value))}
                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
              >
                {enterpriseDatasets.map((ds, idx) => (
                  <option key={ds.id} value={idx} className="bg-slate-900 text-white">
                    {ds.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Generate Report Button */}
            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center space-x-1.5 rounded-lg bg-[#86BC25] px-3.5 py-1.5 text-xs font-semibold text-slate-950 shadow-md hover:bg-[#75a61f] transition active:scale-95"
            >
              <FileCheck className="h-3.5 w-3.5" />
              <span>Consultative Brief</span>
            </button>

            {/* GitHub Repo Link */}
            <a
              href="https://github.com/TejdeepKodati/nexus-graph-analytics"
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              <Github className="h-3.5 w-3.5" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Dataset Synopsis banner */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-white">{currentDataset.title}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{currentDataset.description}</p>
            </div>
            <div className="flex items-center space-x-4 text-xs font-mono">
              <div className="rounded-md bg-slate-950/80 px-3 py-1.5 border border-slate-800">
                <span className="text-slate-400">Nodes: </span>
                <span className="text-emerald-400 font-bold">{nodes.length}</span>
              </div>
              <div className="rounded-md bg-slate-950/80 px-3 py-1.5 border border-slate-800">
                <span className="text-slate-400">Edges: </span>
                <span className="text-cyan-400 font-bold">{edges.length}</span>
              </div>
              <div className="rounded-md bg-slate-950/80 px-3 py-1.5 border border-slate-800">
                <span className="text-slate-400">Total Capital: </span>
                <span className="text-[#86BC25] font-bold">
                  ${(edges.reduce((a, b) => a + b.weight, 0) / 1000000).toFixed(2)}M
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Algorithm Execution Bar */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-2 flex items-center">
                <Sliders className="h-3.5 w-3.5 mr-1 text-[#86BC25]" /> Graph Algorithms:
              </span>

              <button
                onClick={executeTarjan}
                className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeAlgorithm === 'TARJAN'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 ring-2 ring-red-400'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Tarjan's SCC (Fraud Loops)</span>
              </button>

              <button
                onClick={executePageRank}
                className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeAlgorithm === 'PAGERANK'
                    ? 'bg-[#86BC25] text-slate-950 shadow-lg shadow-[#86BC25]/30 ring-2 ring-[#86BC25]'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <TrendingUp className="h-3.5 w-3.5" />
                <span>PageRank Centrality</span>
              </button>

              <button
                onClick={executeLouvain}
                className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeAlgorithm === 'LOUVAIN'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Louvain Communities</span>
              </button>

              <button
                onClick={executeDijkstra}
                className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeAlgorithm === 'DIJKSTRA'
                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <GitBranch className="h-3.5 w-3.5" />
                <span>Audit Path (Dijkstra)</span>
              </button>
            </div>

            {/* Metrics indicator */}
            {algoLatencyMs !== null && (
              <div className="flex items-center space-x-3 text-xs font-mono bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-400">Execution Latency:</span>
                <span className="text-[#86BC25] font-bold">{algoLatencyMs} ms</span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-300">{algoStats}</span>
              </div>
            )}
          </div>
        </div>

        {/* Workspace Split: Graph Canvas + Entity Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Visualizer */}
          <div className="lg:col-span-8 space-y-4">
            <GraphCanvas
              nodes={filteredNodes}
              edges={edges}
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
              fraudRingNodeIds={fraudRingNodeIds}
              highlightedEdgeIds={highlightedEdgeIds}
            />

            {/* Quick Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs">
              <div className="flex items-center space-x-2 flex-1 max-w-xs">
                <Search className="h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search entity by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-3 text-slate-400">
                <span>Filter Min Risk:</span>
                <input
                  type="range"
                  min="0"
                  max="0.9"
                  step="0.05"
                  value={minRiskThreshold}
                  onChange={(e) => setMinRiskThreshold(Number(e.target.value))}
                  className="w-24 accent-[#86BC25] cursor-pointer"
                />
                <span className="font-mono text-white">{(minRiskThreshold * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Right Entity Inspector & Algorithmic Results */}
          <div className="lg:col-span-4 space-y-5">
            {/* Entity Inspector Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Entity Dossier</h3>
                {selectedNode && (
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                    {selectedNode.id}
                  </span>
                )}
              </div>

              {selectedNode ? (
                <div className="space-y-4 text-xs">
                  <div>
                    <h4 className="text-base font-bold text-white">{selectedNode.name}</h4>
                    <p className="text-slate-400 mt-0.5">{selectedNode.type} • {selectedNode.jurisdiction}</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Calculated Risk Index:</span>
                      <span className={`font-bold font-mono ${selectedNode.riskScore >= 0.75 ? 'text-red-400' : 'text-[#86BC25]'}`}>
                        {(selectedNode.riskScore * 100).toFixed(1)}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">PageRank Centrality:</span>
                      <span className="font-mono text-cyan-400">
                        {(pageRankScores.get(selectedNode.id) || 0).toFixed(4)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Cluster Community:</span>
                      <span className="font-mono text-purple-400">
                        Group #{communityMap.get(selectedNode.id) ?? 'Unassigned'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Cycle Ring Member:</span>
                      <span className={`font-semibold ${fraudRingNodeIds.has(selectedNode.id) ? 'text-red-400' : 'text-slate-400'}`}>
                        {fraudRingNodeIds.has(selectedNode.id) ? 'YES (Flagged)' : 'NO'}
                      </span>
                    </div>
                  </div>

                  {/* Connected edges */}
                  <div className="pt-3 border-t border-slate-800/80">
                    <span className="text-slate-400 font-semibold block mb-2">Connected Relationships:</span>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {edges
                        .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
                        .map((e) => {
                          const isOut = e.source === selectedNode.id;
                          const otherId = isOut ? e.target : e.source;
                          const otherNode = nodes.find((n) => n.id === otherId);
                          return (
                            <div key={e.id} className="rounded bg-slate-950/60 p-2 border border-slate-800 text-[11px] flex justify-between items-center">
                              <div>
                                <span className={isOut ? 'text-red-400' : 'text-emerald-400'}>
                                  {isOut ? 'OUT ➔ ' : 'IN ⬅ '}
                                </span>
                                <span className="text-slate-200 font-medium">{otherNode?.name || otherId}</span>
                              </div>
                              <span className="font-mono text-[#86BC25]">${(e.weight / 1000).toFixed(0)}k</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 text-xs">
                  <Info className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                  Click any entity node on the canvas to inspect its risk profile and relationship graph.
                </div>
              )}
            </div>

            {/* Algorithm Detection Summary Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
              <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase border-b border-slate-800 pb-3 mb-4">
                Regulatory Findings
              </h3>

              {activeAlgorithm === 'TARJAN' && fraudRings.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-red-400 text-xs font-bold">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Circular Fund Routing Detected</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Tarjan's algorithm identified strongly connected directed cycles. Funds loop between entities to mask beneficial origin:
                  </p>
                  <div className="space-y-2">
                    {explicitCycles.map((cycle, i) => (
                      <div key={i} className="rounded bg-red-950/30 p-2.5 border border-red-900/40 font-mono text-[11px] text-red-200">
                        {cycle.join(' ➔ ')}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeAlgorithm === 'PAGERANK' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-300">
                    Highest systemic vulnerability scores (entities where transaction disruption causes cascading network failure):
                  </p>
                  <div className="space-y-1.5">
                    {[...nodes]
                      .sort((a, b) => (pageRankScores.get(b.id) || 0) - (pageRankScores.get(a.id) || 0))
                      .slice(0, 4)
                      .map((n) => (
                        <div key={n.id} className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800 text-xs">
                          <span className="text-slate-200">{n.name}</span>
                          <span className="font-mono text-[#86BC25] font-bold">{(pageRankScores.get(n.id) || 0).toFixed(4)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {activeAlgorithm === 'NONE' && (
                <p className="text-xs text-slate-400">
                  Select an algorithm above to run real-time fraud cycle detection, PageRank systemic vulnerability analysis, or community partitioning.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer with Mandatory Attribution */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <div>
            NexusGraph • Enterprise Knowledge Graph & Fraud Analytics • Built for Deloitte US-India Technology Practice
          </div>
          <div className="flex items-center space-x-1 text-slate-300">
            <span>made with ♥ by</span>
            <a
              href="https://github.com/TejdeepKodati/nexus-graph-analytics"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-[#86BC25] hover:underline"
            >
              Tejdeep
            </a>
          </div>
        </div>
      </footer>

      {/* Executive Report Modal */}
      {showReportModal && (
        <ExecutiveReportModal
          dataset={currentDataset}
          nodes={nodes}
          edges={edges}
          fraudRings={fraudRings}
          explicitCycles={explicitCycles}
          pageRankScores={pageRankScores}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}
