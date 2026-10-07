'use client';

import React from 'react';
import { FileText, Download, X, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { GraphNode, GraphEdge, EnterpriseDataset } from '../types/graph';

interface ExecutiveReportModalProps {
  dataset: EnterpriseDataset;
  nodes: GraphNode[];
  edges: GraphEdge[];
  fraudRings: string[][];
  explicitCycles: string[][];
  pageRankScores: Map<string, number>;
  onClose: () => void;
}

export default function ExecutiveReportModal({
  dataset,
  nodes,
  edges,
  fraudRings,
  explicitCycles,
  pageRankScores,
  onClose,
}: ExecutiveReportModalProps) {
  // Compute analytics
  const totalVolume = edges.reduce((acc, e) => acc + e.weight, 0);
  const highRiskCount = nodes.filter((n) => n.riskScore >= 0.75).length;

  const topCentralNodes = [...nodes]
    .sort((a, b) => (pageRankScores.get(b.id) || 0) - (pageRankScores.get(a.id) || 0))
    .slice(0, 3);

  const handleDownload = () => {
    const reportText = `
# DELOITTE CONSULTATIVE RISK INTELLIGENCE REPORT
Date: ${new Date().toISOString().split('T')[0]}
Engagement: Enterprise Knowledge Graph & Fraud Analytics
Scenario: ${dataset.title}

## 1. Executive Summary
An in-depth network topology evaluation of ${nodes.length} connected entities and ${edges.length} contractual/financial edges was conducted using the NexusGraph engine. Total transactional volume analyzed: $${(totalVolume / 1000000).toFixed(2)}M across multiple tax havens and operating jurisdictions.

## 2. Critical Findings & Circular Fraud Loops
- Detected ${fraudRings.length} strongly connected circular transaction loops (Tarjan's SCC).
- Layered shell transfers detected: ${explicitCycles.map((c) => c.join(' -> ')).join(' | ')}
- High-risk entities flagged: ${highRiskCount} / ${nodes.length} (${((highRiskCount / nodes.length) * 100).toFixed(1)}% of perimeter).

## 3. Structural Centrality & Single Points of Failure
Top 3 influential nodes by PageRank power iteration:
${topCentralNodes.map((n, i) => `${i + 1}. ${n.name} (${n.id}) - PageRank: ${(pageRankScores.get(n.id) || 0).toFixed(4)}, Risk: ${(n.riskScore * 100).toFixed(0)}%`).join('\n')}

## 4. Strategic Recommendations
1. Phase 1 (Immediate KYC freeze): Initiate enhanced due diligence on flagged BVI and Cayman shell entities.
2. Phase 2 (Supply Chain Diversification): Establish multi-sourcing contracts to de-risk single points of failure.
3. Phase 3 (Automated Telemetry): Deploy continuous graph anomaly monitoring to track real-time transactional spikes.

Authored by: Tejdeep Kodati — Technology Consulting Analyst
    `.trim();

    const blob = new Blob([reportText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Deloitte_Risk_Report_${dataset.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#86BC25]/20 text-[#86BC25]">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Consultative Executive Brief</h3>
              <p className="text-xs text-slate-400">Deloitte US-India Consultative Deliverable • Automated Risk Synthesis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-6 text-sm">
          {/* Executive Overview banner */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Analysis Scope</span>
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Verified via Graph Algorithms
              </span>
            </div>
            <h4 className="text-base font-semibold text-slate-100">{dataset.title}</h4>
            <p className="mt-1 text-xs text-slate-300 leading-relaxed">{dataset.description}</p>
            
            <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-800/80">
              <div>
                <p className="text-xs text-slate-400">Entities Analyzed</p>
                <p className="text-lg font-bold text-white">{nodes.length}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Total Volume Tracked</p>
                <p className="text-lg font-bold text-[#86BC25]">${(totalVolume / 1000000).toFixed(2)}M</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Flagged Risk Perimeter</p>
                <p className="text-lg font-bold text-red-400">{highRiskCount} Entities</p>
              </div>
            </div>
          </div>

          {/* Fraud Rings Finding */}
          <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4">
            <div className="flex items-center space-x-2 text-red-400 mb-2 font-semibold">
              <AlertTriangle className="h-4 w-4" />
              <span>Algorithmic Cycle Detection (Tarjan's SCC)</span>
            </div>
            {fraudRings.length > 0 ? (
              <div>
                <p className="text-xs text-slate-300 mb-2">
                  Identified <span className="font-bold text-red-400">{fraudRings.length} circular transaction loop(s)</span>. This strongly matches the profile of circular tax structuring and trade-based money laundering:
                </p>
                <div className="space-y-1.5">
                  {explicitCycles.map((cycle, i) => (
                    <div key={i} className="rounded bg-slate-900/80 px-3 py-2 font-mono text-xs text-slate-200 border border-red-800/30">
                      {cycle.join(' ➔ ')}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No circular transaction loops detected in the current perimeter.</p>
            )}
          </div>

          {/* Centrality Risk Table */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <h5 className="font-semibold text-slate-200 mb-2 text-xs uppercase tracking-wider">Top Systemic Influence Entities (PageRank)</h5>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-2">Entity Name</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Jurisdiction</th>
                    <th className="pb-2">PageRank</th>
                    <th className="pb-2 text-right">Risk Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {topCentralNodes.map((n) => (
                    <tr key={n.id}>
                      <td className="py-2 font-medium text-white">{n.name}</td>
                      <td className="py-2">{n.type}</td>
                      <td className="py-2">{n.jurisdiction}</td>
                      <td className="py-2 font-mono text-[#86BC25]">{(pageRankScores.get(n.id) || 0).toFixed(4)}</td>
                      <td className="py-2 text-right font-semibold">
                        <span className={n.riskScore > 0.7 ? 'text-red-400' : 'text-slate-300'}>
                          {(n.riskScore * 100).toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Consulting Recommendations */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex items-center space-x-2 text-[#86BC25] mb-2 font-semibold">
              <ShieldCheck className="h-4 w-4" />
              <span>Deloitte Advisory Recommendations</span>
            </div>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-300">
              <li><strong className="text-white">Freeze High-Risk Shell Accounts:</strong> Issue compliance hold requests on flagged BVI and Cayman Island accounts showing circular fund velocity.</li>
              <li><strong className="text-white">Contractual Audits:</strong> Require notarized certificate of incumbency and ultimate beneficial ownership declaration for entities exceeding 0.70 risk score.</li>
              <li><strong className="text-white">Real-Time Graph Telemetry:</strong> Integrate automated webhook triggers into ERP to evaluate transaction paths against pre-computed CSR cycles.</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4">
          <span className="text-xs text-slate-500">Prepared for Enterprise Decision Support • Confidential</span>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
            >
              Close
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center space-x-2 rounded-lg bg-[#86BC25] px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-[#75a61f] transition"
            >
              <Download className="h-4 w-4" />
              <span>Export Report (.md)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
