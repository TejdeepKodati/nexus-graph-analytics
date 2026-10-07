#include "../include/types.hpp"
#include "../include/csr_graph.hpp"
#include "../include/algorithms.hpp"
#include "../include/entity_trie.hpp"
#include <iostream>
#include <fstream>
#include <chrono>
#include <random>
#include <iomanip>

using namespace nexus;

void generate_synthetic_enterprise_dataset(DynamicGraph& dyn, DynamicGraph& dyn_rev, uint32_t num_entities, uint32_t num_edges) {
    std::mt19937 rng(42);
    std::uniform_real_distribution<double> dist_risk(0.05, 0.95);
    std::uniform_real_distribution<double> dist_amount(5000.0, 2500000.0);
    std::uniform_int_distribution<uint32_t> dist_node(0, num_entities - 1);
    std::uniform_int_distribution<int> dist_type(0, 4);

    std::vector<std::string> prefixes = {"Global", "Apex", "Horizon", "Vertex", "Vanguard", "Pinnacle", "Quantum", "Nexus"};
    std::vector<std::string> suffixes = {"Holdings", "Logistics", "Ventures", "Capital", "Enterprises", "Solutions", "Trade"};

    for (uint32_t i = 0; i < num_entities; ++i) {
        std::string name = prefixes[i % prefixes.size()] + "_" + suffixes[(i / prefixes.size()) % suffixes.size()] + "_" + std::to_string(i);
        NodeType type = static_cast<NodeType>(i % 5);
        double risk = dist_risk(rng);
        dyn.add_node(name, type, risk);
        dyn_rev.add_node(name, type, risk);
    }

    // Inject intentional circular fraud loops (Shell company rings)
    for (uint32_t ring = 0; ring < 5; ++ring) {
        uint32_t base = ring * 10;
        dyn.add_edge(base, base + 1, 750000.0, EdgeType::SHELL_TRANSFER);
        dyn_rev.add_edge(base + 1, base, 750000.0, EdgeType::SHELL_TRANSFER);

        dyn.add_edge(base + 1, base + 2, 740000.0, EdgeType::SHELL_TRANSFER);
        dyn_rev.add_edge(base + 2, base + 1, 740000.0, EdgeType::SHELL_TRANSFER);

        dyn.add_edge(base + 2, base, 730000.0, EdgeType::SHELL_TRANSFER);
        dyn_rev.add_edge(base, base + 2, 730000.0, EdgeType::SHELL_TRANSFER);
    }

    // Add random operational transactions
    for (uint32_t e = 0; e < num_edges; ++e) {
        uint32_t u = dist_node(rng);
        uint32_t v = dist_node(rng);
        if (u != v) {
            double amt = dist_amount(rng);
            EdgeType t = static_cast<EdgeType>(dist_type(rng));
            dyn.add_edge(u, v, amt, t);
            dyn_rev.add_edge(v, u, amt, t);
        }
    }
}

int main(int argc, char* argv[]) {
    std::cout << "==========================================================" << std::endl;
    std::cout << "  NEXUSGRAPH: ENTERPRISE GRAPH ANALYTICS BENCHMARK RUNNER " << std::endl;
    std::cout << "==========================================================" << std::endl;

    const uint32_t NUM_ENTITIES = 10000;
    const uint32_t NUM_EDGES = 40000;

    std::cout << "[INFO] Generating synthetic enterprise transaction network..." << std::endl;
    std::cout << "       Nodes: " << NUM_ENTITIES << " | Edges: ~" << NUM_EDGES << std::endl;

    DynamicGraph dyn_fwd;
    DynamicGraph dyn_rev;
    generate_synthetic_enterprise_dataset(dyn_fwd, dyn_rev, NUM_ENTITIES, NUM_EDGES);

    // Benchmark 1: CSR Construction & Memory Efficiency
    auto t1 = std::chrono::high_resolution_clock::now();
    CSRGraph csr_fwd(dyn_fwd);
    CSRGraph csr_rev(dyn_rev);
    auto t2 = std::chrono::high_resolution_clock::now();
    double csr_time_ms = std::chrono::duration<double, std::milli>(t2 - t1).count();

    std::cout << "\n[BENCHMARK 1] CSR Conversion & Memory Footprint:" << std::endl;
    std::cout << "  ✓ Built CSR Graph in " << std::fixed << std::setprecision(2) << csr_time_ms << " ms" << std::endl;
    std::cout << "  ✓ Total CSR Memory Usage: " << (csr_fwd.memory_bytes() / (1024.0 * 1024.0)) << " MB" << std::endl;

    // Benchmark 2: Tarjan's SCC Fraud Ring Detection
    auto t3 = std::chrono::high_resolution_clock::now();
    auto fraud_res = GraphAlgorithms::detect_fraud_rings(csr_fwd);
    auto t4 = std::chrono::high_resolution_clock::now();
    double tarjan_time_ms = std::chrono::duration<double, std::milli>(t4 - t3).count();

    std::cout << "\n[BENCHMARK 2] Tarjan's SCC Fraud Ring Detection:" << std::endl;
    std::cout << "  ✓ Completed in " << tarjan_time_ms << " ms" << std::endl;
    std::cout << "  ✓ Total SCCs: " << fraud_res.total_scc_count << std::endl;
    std::cout << "  ✓ Suspicious Circular Rings Identified: " << fraud_res.suspicious_cycles << std::endl;

    // Benchmark 3: PageRank Power Iteration
    auto t5 = std::chrono::high_resolution_clock::now();
    auto pagerank_res = GraphAlgorithms::compute_pagerank(csr_fwd, 0.85, 50, 1e-6);
    auto t6 = std::chrono::high_resolution_clock::now();
    double pagerank_time_ms = std::chrono::duration<double, std::milli>(t6 - t5).count();

    std::cout << "\n[BENCHMARK 3] PageRank Centrality (Power Iteration):" << std::endl;
    std::cout << "  ✓ Converged in " << pagerank_res.iterations << " iterations" << std::endl;
    std::cout << "  ✓ Total Execution Time: " << pagerank_time_ms << " ms" << std::endl;
    std::cout << "  ✓ Final L1 Convergence Delta: " << pagerank_res.delta << std::endl;

    // Benchmark 4: Bidirectional Dijkstra
    auto t7 = std::chrono::high_resolution_clock::now();
    auto dijkstra_res = GraphAlgorithms::bidirectional_dijkstra(csr_fwd, csr_rev, 0, 999);
    auto t8 = std::chrono::high_resolution_clock::now();
    double dijkstra_time_ms = std::chrono::duration<double, std::milli>(t8 - t7).count();

    std::cout << "\n[BENCHMARK 4] Bidirectional Dijkstra Path Search:" << std::endl;
    std::cout << "  ✓ Traversal Time: " << dijkstra_time_ms << " ms" << std::endl;
    std::cout << "  ✓ Path Found: " << (dijkstra_res.found ? "YES" : "NO") << std::endl;
    if (dijkstra_res.found) {
        std::cout << "  ✓ Path Length: " << dijkstra_res.path.size() << " hops | Explored: " << dijkstra_res.nodes_explored << " nodes" << std::endl;
    }

    // Benchmark 5: Entity Resolution with Trie
    EntityTrie trie;
    for (uint32_t i = 0; i < NUM_ENTITIES; ++i) {
        trie.insert(dyn_fwd.get_node(i).name, i);
    }
    auto t9 = std::chrono::high_resolution_clock::now();
    auto matches = trie.search_prefix("Apex_Holdings");
    auto t10 = std::chrono::high_resolution_clock::now();
    double trie_time_us = std::chrono::duration<double, std::micro>(t10 - t9).count();

    std::cout << "\n[BENCHMARK 5] Entity Resolution (Trie Index):" << std::endl;
    std::cout << "  ✓ Total Indexed Entities: " << trie.total_entities() << std::endl;
    std::cout << "  ✓ Query Latency for 'Apex_Holdings': " << trie_time_us << " microseconds" << std::endl;
    std::cout << "  ✓ Matching Entities: " << matches.size() << std::endl;

    std::cout << "\n==========================================================" << std::endl;
    std::cout << "  ALL ENGINE BENCHMARKS FINISHED SUCCESSFULLY!             " << std::endl;
    std::cout << "==========================================================" << std::endl;

    return 0;
}
