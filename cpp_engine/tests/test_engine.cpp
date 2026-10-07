#include "../include/types.hpp"
#include "../include/csr_graph.hpp"
#include "../include/algorithms.hpp"
#include "../include/entity_trie.hpp"
#include <cassert>
#include <iostream>
#include <chrono>

using namespace nexus;

void test_csr_construction() {
    std::cout << "[TEST] Running test_csr_construction..." << std::endl;
    DynamicGraph dyn;
    uint32_t a = dyn.add_node("Alpha Corp", NodeType::CORPORATION, 0.2);
    uint32_t b = dyn.add_node("Beta Holdings", NodeType::HOLDING_COMPANY, 0.4);
    uint32_t c = dyn.add_node("Gamma Offshore", NodeType::BANK_ACCOUNT, 0.9);

    dyn.add_edge(a, b, 500000.0, EdgeType::TRANSACTION);
    dyn.add_edge(b, c, 450000.0, EdgeType::SHELL_TRANSFER);
    dyn.add_edge(a, c, 100000.0, EdgeType::OWNERSHIP);

    assert(dyn.num_nodes() == 3);
    assert(dyn.num_edges() == 3);

    CSRGraph csr(dyn);
    assert(csr.num_nodes() == 3);
    assert(csr.num_edges() == 3);
    assert(csr.out_degree(a) == 2);
    assert(csr.out_degree(b) == 1);
    assert(csr.out_degree(c) == 0);

    auto a_neighbors = csr.neighbors(a);
    assert(a_neighbors.size() == 2);
    assert(a_neighbors[0].target == b);
    assert(a_neighbors[1].target == c);

    std::cout << "  ✓ CSR construction & degree validation passed!" << std::endl;
}

void test_tarjan_scc_fraud_detection() {
    std::cout << "[TEST] Running test_tarjan_scc_fraud_detection..." << std::endl;
    DynamicGraph dyn;
    // Construct a cycle (fraud ring): 0 -> 1 -> 2 -> 0
    uint32_t n0 = dyn.add_node("Shell 1", NodeType::CORPORATION);
    uint32_t n1 = dyn.add_node("Shell 2", NodeType::CORPORATION);
    uint32_t n2 = dyn.add_node("Shell 3", NodeType::CORPORATION);
    // Linear chain: 2 -> 3 -> 4
    uint32_t n3 = dyn.add_node("Legit Merchant", NodeType::SUPPLIER);
    uint32_t n4 = dyn.add_node("Beneficiary", NodeType::BENEFICIARY);

    dyn.add_edge(n0, n1, 10000.0, EdgeType::SHELL_TRANSFER);
    dyn.add_edge(n1, n2, 10000.0, EdgeType::SHELL_TRANSFER);
    dyn.add_edge(n2, n0, 10000.0, EdgeType::SHELL_TRANSFER); // Closes cycle
    dyn.add_edge(n2, n3, 5000.0, EdgeType::TRANSACTION);
    dyn.add_edge(n3, n4, 5000.0, EdgeType::TRANSACTION);

    CSRGraph csr(dyn);
    auto result = GraphAlgorithms::detect_fraud_rings(csr);

    // Should find 1 suspicious cycle containing 3 nodes (n0, n1, n2)
    assert(result.suspicious_cycles == 1);
    assert(!result.components.empty());
    assert(result.components[0].size() == 3);

    std::cout << "  ✓ Tarjan's SCC successfully detected circular fraud ring of size " 
              << result.components[0].size() << "!" << std::endl;
}

void test_bidirectional_dijkstra() {
    std::cout << "[TEST] Running test_bidirectional_dijkstra..." << std::endl;
    DynamicGraph dyn_fwd;
    DynamicGraph dyn_rev;

    // Graph: 0 -(2)-> 1 -(3)-> 2 -(1)-> 3
    // Alternative: 0 -(7)-> 3
    for (int i = 0; i < 4; ++i) {
        dyn_fwd.add_node("Node " + std::to_string(i), NodeType::CORPORATION);
        dyn_rev.add_node("Node " + std::to_string(i), NodeType::CORPORATION);
    }

    auto add_bi = [&](uint32_t u, uint32_t v, double w) {
        dyn_fwd.add_edge(u, v, w, EdgeType::TRANSACTION);
        dyn_rev.add_edge(v, u, w, EdgeType::TRANSACTION);
    };

    add_bi(0, 1, 2.0);
    add_bi(1, 2, 3.0);
    add_bi(2, 3, 1.0);
    add_bi(0, 3, 7.0);

    CSRGraph csr_fwd(dyn_fwd);
    CSRGraph csr_rev(dyn_rev);

    auto res = GraphAlgorithms::bidirectional_dijkstra(csr_fwd, csr_rev, 0, 3);
    assert(res.found);
    assert(std::abs(res.total_cost - 6.0) < 1e-5);
    assert(res.path.size() == 4);
    assert(res.path[0] == 0 && res.path[1] == 1 && res.path[2] == 2 && res.path[3] == 3);

    std::cout << "  ✓ Bidirectional Dijkstra found optimal distance " << res.total_cost << " with path length " << res.path.size() << "!" << std::endl;
}

void test_pagerank() {
    std::cout << "[TEST] Running test_pagerank..." << std::endl;
    DynamicGraph dyn;
    // Star network: 1, 2, 3 all point to 0 (0 is the central hub)
    uint32_t hub = dyn.add_node("Central Hub", NodeType::CORPORATION);
    uint32_t l1 = dyn.add_node("Leaf 1", NodeType::CORPORATION);
    uint32_t l2 = dyn.add_node("Leaf 2", NodeType::CORPORATION);
    uint32_t l3 = dyn.add_node("Leaf 3", NodeType::CORPORATION);

    dyn.add_edge(l1, hub, 1.0, EdgeType::TRANSACTION);
    dyn.add_edge(l2, hub, 1.0, EdgeType::TRANSACTION);
    dyn.add_edge(l3, hub, 1.0, EdgeType::TRANSACTION);
    dyn.add_edge(hub, l1, 1.0, EdgeType::TRANSACTION); // Allow feedback

    CSRGraph csr(dyn);
    auto res = GraphAlgorithms::compute_pagerank(csr, 0.85, 100, 1e-6);

    assert(res.scores.size() == 4);
    // Central hub must have the highest PageRank score
    assert(res.scores[hub] > res.scores[l1]);
    assert(res.scores[hub] > res.scores[l2]);
    assert(res.scores[hub] > res.scores[l3]);

    double total_sum = 0.0;
    for (double s : res.scores) total_sum += s;
    assert(std::abs(total_sum - 1.0) < 1e-3);

    std::cout << "  ✓ PageRank converged in " << res.iterations << " iterations! Hub score: " << res.scores[hub] << std::endl;
}

void test_entity_trie() {
    std::cout << "[TEST] Running test_entity_trie..." << std::endl;
    EntityTrie trie;
    trie.insert("Deloitte Touche Tohmatsu", 101);
    trie.insert("Deloitte Consulting India", 102);
    trie.insert("Delta Holdings LLC", 103);
    trie.insert("Omega Petrochemicals", 104);

    auto deloitte_res = trie.search_prefix("Deloitte");
    assert(deloitte_res.size() == 2);
    assert(deloitte_res[0] == 101 || deloitte_res[0] == 102);

    auto delta_res = trie.search_prefix("del");
    assert(delta_res.size() == 3);

    auto empty_res = trie.search_prefix("Zeta");
    assert(empty_res.empty());

    std::cout << "  ✓ EntityTrie O(L) prefix search verified!" << std::endl;
}

int main() {
    std::cout << "=================================================" << std::endl;
    std::cout << "  NEXUS GRAPH ANALYTICS ENGINE - UNIT TEST SUITE " << std::endl;
    std::cout << "=================================================" << std::endl;

    auto t_start = std::chrono::high_resolution_clock::now();

    test_csr_construction();
    test_tarjan_scc_fraud_detection();
    test_bidirectional_dijkstra();
    test_pagerank();
    test_entity_trie();

    auto t_end = std::chrono::high_resolution_clock::now();
    double duration_ms = std::chrono::duration<double, std::milli>(t_end - t_start).count();

    std::cout << "=================================================" << std::endl;
    std::cout << "  ALL 5 UNIT TESTS PASSED IN " << duration_ms << " ms!" << std::endl;
    std::cout << "=================================================" << std::endl;

    return 0;
}
