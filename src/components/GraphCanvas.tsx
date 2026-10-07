'use client';

import React, { useEffect, useRef, useState } from 'react';
import { GraphNode, GraphEdge } from '../types/graph';

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNode: GraphNode | null;
  onSelectNode: (node: GraphNode | null) => void;
  fraudRingNodeIds: Set<string>;
  highlightedEdgeIds: Set<string>;
}

export default function GraphCanvas({
  nodes,
  edges,
  selectedNode,
  onSelectNode,
  fraudRingNodeIds,
  highlightedEdgeIds,
}: GraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [positions, setPositions] = useState<{ [id: string]: { x: number; y: number; vx: number; vy: number } }>({});
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

  // Initialize circular or force positions
  useEffect(() => {
    const width = 800;
    const height = 550;
    const initialPos: { [id: string]: { x: number; y: number; vx: number; vy: number } } = {};

    const radius = Math.min(width, height) * 0.38;
    const centerX = width / 2;
    const centerY = height / 2;

    nodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / nodes.length;
      initialPos[node.id] = {
        x: centerX + radius * Math.cos(angle) + (Math.random() - 0.5) * 40,
        y: centerY + radius * Math.sin(angle) + (Math.random() - 0.5) * 40,
        vx: 0,
        vy: 0,
      };
    });

    setPositions(initialPos);
  }, [nodes]);

  // Force simulation loop
  useEffect(() => {
    let animId: number;
    let step = 0;

    const simulate = () => {
      if (step > 150) return; // Stabilize after 150 iterations
      step++;

      setPositions((prev) => {
        const next = { ...prev };
        const kRepulsion = 1800;
        const kAttraction = 0.04;
        const centerGravity = 0.015;
        const width = 800;
        const height = 550;

        // Repulsion between all pairs
        for (let i = 0; i < nodes.length; i++) {
          const idA = nodes[i].id;
          const posA = next[idA];
          if (!posA) continue;

          for (let j = i + 1; j < nodes.length; j++) {
            const idB = nodes[j].id;
            const posB = next[idB];
            if (!posB) continue;

            const dx = posB.x - posA.x;
            const dy = posB.y - posA.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            if (dist < 400) {
              const force = kRepulsion / (dist * dist);
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;

              posA.vx -= fx;
              posA.vy -= fy;
              posB.vx += fx;
              posB.vy += fy;
            }
          }

          // Center gravity
          posA.vx += ((width / 2) - posA.x) * centerGravity;
          posA.vy += ((height / 2) - posA.y) * centerGravity;
        }

        // Edge springs
        edges.forEach((edge) => {
          const posSrc = next[edge.source];
          const posDst = next[edge.target];
          if (posSrc && posDst) {
            const dx = posDst.x - posSrc.x;
            const dy = posDst.y - posSrc.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = (dist - 140) * kAttraction;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            posSrc.vx += fx;
            posSrc.vy += fy;
            posDst.vx -= fx;
            posDst.vy -= fy;
          }
        });

        // Update coordinates with damping
        nodes.forEach((node) => {
          const pos = next[node.id];
          if (pos && node.id !== draggedNodeId) {
            pos.vx *= 0.82;
            pos.vy *= 0.82;
            pos.x += pos.vx;
            pos.y += pos.vy;

            // Constrain
            pos.x = Math.max(50, Math.min(width - 50, pos.x));
            pos.y = Math.max(50, Math.min(height - 50, pos.y));
          }
        });

        return next;
      });

      animId = requestAnimationFrame(simulate);
    };

    animId = requestAnimationFrame(simulate);
    return () => cancelAnimationFrame(animId);
  }, [nodes, edges, draggedNodeId]);

  // Canvas render pass
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background subtle grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw Edges
    edges.forEach((edge) => {
      const src = positions[edge.source];
      const dst = positions[edge.target];
      if (!src || !dst) return;

      const isCycle = fraudRingNodeIds.has(edge.source) && fraudRingNodeIds.has(edge.target);
      const isPath = highlightedEdgeIds.has(edge.id);

      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(dst.x, dst.y);

      if (isPath) {
        ctx.strokeStyle = '#06b6d4'; // Cyan for shortest path
        ctx.lineWidth = 3.5;
      } else if (isCycle) {
        ctx.strokeStyle = '#ef4444'; // Red for fraud cycle
        ctx.lineWidth = 3.0;
      } else {
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.2;
      }
      ctx.stroke();

      // Draw arrow head
      const angle = Math.atan2(dst.y - src.y, dst.x - src.x);
      const arrowLength = 10;
      const targetRadius = 18;
      const arrowX = dst.x - targetRadius * Math.cos(angle);
      const arrowY = dst.y - targetRadius * Math.sin(angle);

      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(
        arrowX - arrowLength * Math.cos(angle - Math.PI / 6),
        arrowY - arrowLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        arrowX - arrowLength * Math.cos(angle + Math.PI / 6),
        arrowY - arrowLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.fillStyle = isPath ? '#06b6d4' : isCycle ? '#ef4444' : '#64748b';
      ctx.fill();
    });

    // Draw Nodes
    nodes.forEach((node) => {
      const pos = positions[node.id];
      if (!pos) return;

      const isSelected = selectedNode?.id === node.id;
      const isFraudRing = fraudRingNodeIds.has(node.id);
      const radius = isSelected ? 22 : isFraudRing ? 20 : 16;

      // Outer glow for fraud ring or selected
      if (isFraudRing) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius + 6, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.fill();
      } else if (isSelected) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius + 6, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(134, 188, 37, 0.3)';
        ctx.fill();
      }

      // Base Circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);

      let fillColor = '#3b82f6'; // Blue default
      if (node.riskScore >= 0.75) {
        fillColor = '#dc2626'; // High Risk Red
      } else if (node.riskScore >= 0.45) {
        fillColor = '#f59e0b'; // Moderate Amber
      } else {
        fillColor = '#86BC25'; // Deloitte Green for healthy/low risk
      }

      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.lineWidth = isSelected ? 3 : 1.5;
      ctx.strokeStyle = isSelected ? '#ffffff' : '#0f172a';
      ctx.stroke();

      // Node Label
      ctx.font = '11px system-ui, sans-serif';
      ctx.fillStyle = '#f1f5f9';
      ctx.textAlign = 'center';
      const displayName = node.name.length > 14 ? node.name.slice(0, 12) + '..' : node.name;
      ctx.fillText(displayName, pos.x, pos.y + radius + 14);

      // Node Type indicator
      ctx.font = '9px monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(node.id, pos.x, pos.y - radius - 4);
    });
  }, [nodes, edges, positions, selectedNode, fraudRingNodeIds, highlightedEdgeIds]);

  // Click & Drag handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let clicked: GraphNode | null = null;
    nodes.forEach((node) => {
      const pos = positions[node.id];
      if (pos) {
        const dx = x - pos.x;
        const dy = y - pos.y;
        if (dx * dx + dy * dy <= 22 * 22) {
          clicked = node;
        }
      }
    });

    if (clicked) {
      onSelectNode(clicked);
      setDraggedNodeId((clicked as GraphNode).id);
      setIsDragging(true);
    } else {
      onSelectNode(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !draggedNodeId) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setPositions((prev) => ({
      ...prev,
      [draggedNodeId]: { ...prev[draggedNodeId], x, y, vx: 0, vy: 0 },
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedNodeId(null);
  };

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-900/90 shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 bg-slate-950/60">
        <div className="flex items-center space-x-3 text-xs">
          <span className="flex items-center text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full bg-[#86BC25] mr-1.5 inline-block"></span>
            Low Risk (&lt;0.45)
          </span>
          <span className="flex items-center text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 mr-1.5 inline-block"></span>
            Medium Risk (0.45-0.75)
          </span>
          <span className="flex items-center text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full bg-red-600 mr-1.5 inline-block"></span>
            High Risk (&gt;0.75)
          </span>
          <span className="flex items-center text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full ring-2 ring-red-500 mr-1.5 inline-block"></span>
            Circular Ring Detected
          </span>
        </div>
        <div className="text-xs text-slate-400">
          Interactive Canvas • Drag to rearrange • Click to inspect
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={550}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="w-full h-[550px] cursor-grab active:cursor-grabbing block"
      />
    </div>
  );
}
