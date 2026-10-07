export type NodeType = 'CORPORATION' | 'BANK_ACCOUNT' | 'BENEFICIARY' | 'SUPPLIER' | 'HOLDING_COMPANY';

export type EdgeType = 'TRANSACTION' | 'OWNERSHIP' | 'SUPPLY_CONTRACT' | 'EXECUTIVE_BOARD' | 'SHELL_TRANSFER';

export interface GraphNode {
  id: string;
  name: string;
  type: NodeType;
  riskScore: number; // 0.0 to 1.0
  jurisdiction: string;
  industry?: string;
  flagged?: boolean;
  pageRank?: number;
  community?: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  weight: number; // transaction amount or ownership percentage
  type: EdgeType;
  timestamp?: string;
  isCycleEdge?: boolean;
  isPathEdge?: boolean;
}

export interface EnterpriseDataset {
  id: string;
  title: string;
  description: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface AlgorithmResults {
  fraudRings: string[][]; // Node IDs in cyclical SCCs
  explicitCycles: string[][];
  executionTimeMs: number;
  pageRankConverged: boolean;
  pageRankIterations: number;
  communitiesCount: number;
  shortestPath?: {
    path: string[];
    cost: number;
    exploredNodes: number;
  };
}
