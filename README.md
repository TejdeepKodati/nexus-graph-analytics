# NexusGraph — Enterprise Knowledge Graph & Fraud Analytics Engine

> High-performance knowledge graph, circular transaction fraud ring detection, and systemic risk analytics platform designed for Deloitte US-India Technology Practice.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

## Overview

Modern enterprises face intricate cross-border compliance, procurement fraud, and supply chain fragility risks hidden within dense relationship networks. Traditional relational databases struggle with recursive path traversals and cycle detection, suffering exponential $O(b^d)$ query latency.

**NexusGraph** delivers a high-performance graph analytics engine engineered to uncover hidden patterns across corporate entities, multi-tier supply networks, and transactional trails:
- **Circular Fraud Loop Detection**: Implements **Tarjan's Strongly Connected Components (SCC)** algorithm ($O(V + E)$ time complexity) to detect circular shell-company laundering rings and tax evasion patterns.
- **Systemic Vulnerability & Influence Scoring**: Powered by **PageRank Power Iteration** ($\alpha = 0.85$) to quantify entity centrality and identify critical bottleneck nodes.
- **Compliance Audit & Critical Path Traversal**: Utilizes **Bidirectional Dijkstra** to identify optimal compliance verification trails.
- **Modular Risk Clustering**: Fast **Louvain Modularity Partitioning** to separate supplier ecosystems into distinct operational clusters.
- **C++ High-Performance Core**: Includes a native C++ engine with **Compressed Sparse Row (CSR)** cache-aligned memory representations and microbenchmark test suites.
- **Interactive Visualizer**: Next.js 14 web application featuring force-directed canvas physics, risk threshold filtering, entity dossiers, and consultative executive brief generation.

---

## Architecture & Data Structures

```
                 +---------------------------------------------+
                 |          Interactive Next.js 14 App          |
                 |  (Canvas Physics, Force Simulation, Reports)|
                 +----------------------+----------------------+
                                        |
                 +----------------------v----------------------+
                 |          In-Browser Algorithmic Core        |
                 |  - Tarjan's SCC (Cycle & Shell Detection)   |
                 |  - PageRank Centrality (Power Iteration)    |
                 |  - Bidirectional Dijkstra Path Traversal    |
                 |  - Louvain Community Partitioning           |
                 +----------------------+----------------------+
                                        |
                 +----------------------v----------------------+
                 |          Native C++ Engine (cpp_engine)     |
                 |  - Compressed Sparse Row (CSR) Layout       |
                 |  - Entity Resolution Trie Index (O(L))      |
                 |  - Unit Test & Synthetic Graph Benchmarks   |
                 +---------------------------------------------+
```

### Key Algorithmic Complexities
| Algorithm | Purpose | Time Complexity | Space Complexity |
|---|---|---|---|
| **Tarjan's SCC** | Detect circular fund routing & fraud loops | $O(V + E)$ | $O(V)$ |
| **PageRank** | Entity centrality & systemic risk ranking | $O(k \cdot (V + E))$ | $O(V)$ |
| **Bidirectional Dijkstra** | Shortest audit compliance path | $O(2 \cdot b^{d/2})$ | $O(V)$ |
| **Louvain Partitioning** | Multi-tier supplier & entity clustering | $O(V \log V)$ | $O(V + E)$ |
| **Prefix Trie** | Rapid entity resolution & KYC lookup | $O(L)$ | $O(\Sigma \cdot L)$ |

---

## Live Demo & Datasets

Preloaded with 3 real-world consultative scenarios:
1. **Cross-Border Shell Network & Circular Fraud Ring**: 12 entities, 4 shell corporations cycling $12.4M across BVI, Cayman Islands, and European holding accounts.
2. **Tier-1/Tier-2 Semiconductor & Automotive Supply Chain**: Single-point-of-failure foundry and rare-earth mining dependencies.
3. **Enterprise Procurement Collusion**: Undisclosed executive conflict-of-interest and bid-rigging rings.

---

## Quickstart

### Web Application (Next.js 14)
```bash
# Clone the repository
git clone https://github.com/TejdeepKodati/nexus-graph-analytics.git
cd nexus-graph-analytics

# Install dependencies
npm install

# Start development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### C++ Native Engine & Benchmarks
```bash
cd cpp_engine

# Compile & run unit tests
g++ -O3 -std=c++17 tests/test_engine.cpp -o test_engine
./test_engine

# Compile & run synthetic benchmark runner (10k nodes, 40k edges)
g++ -O3 -std=c++17 src/main.cpp -o main_bench
./main_bench
```

---

## Author

Made with ♥ by **Tejdeep Kodati**
- GitHub: [@TejdeepKodati](https://github.com/TejdeepKodati)
- LinkedIn: [Tejdeep Kodati](https://www.linkedin.com/in/tejdeep-kodati/)
