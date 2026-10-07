#pragma once
#include "csr_graph.hpp"
#include <vector>
#include <queue>
#include <stack>
#include <cmath>
#include <limits>
#include <unordered_set>
#include <unordered_map>
#include <algorithm>
#include <iostream>

namespace nexus {

struct ShortestPathResult {
    bool found = false;
    double total_cost = std::numeric_limits<double>::infinity();
    std::vector<uint32_t> path;
    uint32_t nodes_explored = 0;
};

struct FraudRingResult {
    std::vector<std::vector<uint32_t>> components; // Components with size > 1 (cycles)
    std::vector<std::vector<uint32_t>> explicit_cycles; // Exact detected cyclic paths
    size_t total_scc_count = 0;
    size_t suspicious_cycles = 0;
};

struct PageRankResult {
    std::vector<double> scores;
    uint32_t iterations = 0;
    double delta = 0.0;
};

struct CommunityResult {
    std::vector<uint32_t> node_community; // community id for each node
    uint32_t num_communities = 0;
    double modularity = 0.0;
};

class GraphAlgorithms {
public:
    // Tarjan's Strongly Connected Components (O(V + E) time, O(V) space)
    // Used for detecting circular fund routing and shell company laundering rings
    static FraudRingResult detect_fraud_rings(const CSRGraph& graph) {
        FraudRingResult result;
        uint32_t n = graph.num_nodes();
        if (n == 0) return result;

        std::vector<int32_t> dfn(n, -1);
        std::vector<int32_t> low(n, -1);
        std::vector<bool> in_stack(n, false);
        std::stack<uint32_t> st;
        int32_t timer = 0;

        auto dfs = [&](auto self, uint32_t u) -> void {
            dfn[u] = low[u] = ++timer;
            st.push(u);
            in_stack[u] = true;

            const uint32_t* row = graph.row_ptr();
            const uint32_t* col = graph.col_indices();

            for (uint32_t idx = row[u]; idx < row[u + 1]; ++idx) {
                uint32_t v = col[idx];
                if (dfn[v] == -1) {
                    self(self, v);
                    low[u] = std::min(low[u], low[v]);
                } else if (in_stack[v]) {
                    low[u] = std::min(low[u], dfn[v]);
                }
            }

            if (dfn[u] == low[u]) {
                std::vector<uint32_t> component;
                while (true) {
                    uint32_t v = st.top();
                    st.pop();
                    in_stack[v] = false;
                    component.push_back(v);
                    if (v == u) break;
                }
                result.total_scc_count++;
                if (component.size() > 1) {
                    result.components.push_back(component);
                    result.suspicious_cycles++;
                }
            }
        };

        for (uint32_t i = 0; i < n; ++i) {
            if (dfn[i] == -1) {
                dfs(dfs, i);
            }
        }

        // Extract explicit cycles inside suspicious SCCs
        for (const auto& comp : result.components) {
            std::unordered_set<uint32_t> comp_set(comp.begin(), comp.end());
            // Small cycle extraction using bounded DFS
            std::vector<uint32_t> current_path;
            std::vector<bool> visited(n, false);
            
            auto find_cycle = [&](auto self, uint32_t curr, uint32_t origin) -> bool {
                visited[curr] = true;
                current_path.push_back(curr);

                for (const auto& edge : graph.neighbors(curr)) {
                    if (comp_set.find(edge.target) == comp_set.end()) continue;
                    if (edge.target == origin && current_path.size() >= 2) {
                        current_path.push_back(origin);
                        result.explicit_cycles.push_back(current_path);
                        current_path.pop_back();
                        return true;
                    }
                    if (!visited[edge.target]) {
                        if (self(self, edge.target, origin)) return true;
                    }
                }

                current_path.pop_back();
                visited[curr] = false;
                return false;
            };

            for (uint32_t root : comp) {
                std::fill(visited.begin(), visited.end(), false);
                find_cycle(find_cycle, root, root);
                if (result.explicit_cycles.size() >= 10) break; // Limit extracted cycles for clarity
            }
        }

        return result;
    }

    // Bidirectional Dijkstra Shortest Path Algorithm
    // Reduces exploration space from O(b^d) to O(2 * b^(d/2))
    static ShortestPathResult bidirectional_dijkstra(
        const CSRGraph& forward_graph,
        const CSRGraph& reverse_graph,
        uint32_t start_node,
        uint32_t end_node
    ) {
        ShortestPathResult result;
        uint32_t n = forward_graph.num_nodes();
        if (start_node >= n || end_node >= n) return result;
        if (start_node == end_node) {
            result.found = true;
            result.total_cost = 0.0;
            result.path = {start_node};
            return result;
        }

        const double INF = std::numeric_limits<double>::infinity();
        std::vector<double> dist_f(n, INF);
        std::vector<double> dist_b(n, INF);
        std::vector<int32_t> parent_f(n, -1);
        std::vector<int32_t> parent_b(n, -1);
        std::vector<bool> visited_f(n, false);
        std::vector<bool> visited_b(n, false);

        using PQElement = std::pair<double, uint32_t>;
        std::priority_queue<PQElement, std::vector<PQElement>, std::greater<PQElement>> pq_f;
        std::priority_queue<PQElement, std::vector<PQElement>, std::greater<PQElement>> pq_b;

        dist_f[start_node] = 0.0;
        dist_b[end_node] = 0.0;
        pq_f.push({0.0, start_node});
        pq_b.push({0.0, end_node});

        double best_dist = INF;
        int32_t meeting_node = -1;

        while (!pq_f.empty() && !pq_b.empty()) {
            // Forward step
            if (!pq_f.empty()) {
                auto [d_u, u] = pq_f.top();
                pq_f.pop();

                if (!visited_f[u] && d_u <= dist_f[u]) {
                    visited_f[u] = true;
                    result.nodes_explored++;

                    if (visited_b[u] && dist_f[u] + dist_b[u] < best_dist) {
                        best_dist = dist_f[u] + dist_b[u];
                        meeting_node = static_cast<int32_t>(u);
                    }

                    for (const auto& edge : forward_graph.neighbors(u)) {
                        double weight = std::max(0.1, edge.weight); // Guard positive weight
                        if (dist_f[u] + weight < dist_f[edge.target]) {
                            dist_f[edge.target] = dist_f[u] + weight;
                            parent_f[edge.target] = static_cast<int32_t>(u);
                            pq_f.push({dist_f[edge.target], edge.target});
                        }
                    }
                }
            }

            // Backward step
            if (!pq_b.empty()) {
                auto [d_v, v] = pq_b.top();
                pq_b.pop();

                if (!visited_b[v] && d_v <= dist_b[v]) {
                    visited_b[v] = true;
                    result.nodes_explored++;

                    if (visited_f[v] && dist_f[v] + dist_b[v] < best_dist) {
                        best_dist = dist_f[v] + dist_b[v];
                        meeting_node = static_cast<int32_t>(v);
                    }

                    for (const auto& edge : reverse_graph.neighbors(v)) {
                        double weight = std::max(0.1, edge.weight);
                        if (dist_b[v] + weight < dist_b[edge.target]) {
                            dist_b[edge.target] = dist_b[v] + weight;
                            parent_b[edge.target] = static_cast<int32_t>(v);
                            pq_b.push({dist_b[edge.target], edge.target});
                        }
                    }
                }
            }

            // Termination condition: when current minimum distances sum exceeds best_dist
            if (!pq_f.empty() && !pq_b.empty()) {
                if (pq_f.top().first + pq_b.top().first >= best_dist) {
                    break;
                }
            }
        }

        if (meeting_node != -1 && best_dist < INF) {
            result.found = true;
            result.total_cost = best_dist;

            // Reconstruct path from start to meeting_node
            std::vector<uint32_t> forward_path;
            for (int32_t at = meeting_node; at != -1; at = parent_f[at]) {
                forward_path.push_back(static_cast<uint32_t>(at));
                if (static_cast<uint32_t>(at) == start_node) break;
            }
            std::reverse(forward_path.begin(), forward_path.end());

            // Reconstruct path from meeting_node to end
            std::vector<uint32_t> backward_path;
            for (int32_t at = parent_b[meeting_node]; at != -1; at = parent_b[at]) {
                backward_path.push_back(static_cast<uint32_t>(at));
                if (static_cast<uint32_t>(at) == end_node) break;
            }

            result.path = std::move(forward_path);
            result.path.insert(result.path.end(), backward_path.begin(), backward_path.end());
        }

        return result;
    }

    // PageRank Power Iteration (O(k * (V + E)) time, O(V) space)
    // Measures structural importance, systemic risk, and central entity vulnerability
    static PageRankResult compute_pagerank(
        const CSRGraph& graph,
        double damping_factor = 0.85,
        uint32_t max_iterations = 100,
        double tolerance = 1e-6
    ) {
        PageRankResult result;
        uint32_t n = graph.num_nodes();
        if (n == 0) return result;

        result.scores.assign(n, 1.0 / n);
        std::vector<double> next_scores(n, 0.0);

        // Precompute out-degrees
        std::vector<uint32_t> degrees(n, 0);
        for (uint32_t i = 0; i < n; ++i) {
            degrees[i] = graph.out_degree(i);
        }

        const uint32_t* row = graph.row_ptr();
        const uint32_t* col = graph.col_indices();

        for (uint32_t iter = 0; iter < max_iterations; ++iter) {
            result.iterations++;
            double dangling_sum = 0.0;
            for (uint32_t i = 0; i < n; ++i) {
                if (degrees[i] == 0) {
                    dangling_sum += result.scores[i];
                }
            }

            double base_val = (1.0 - damping_factor) / n + (damping_factor * dangling_sum) / n;
            std::fill(next_scores.begin(), next_scores.end(), base_val);

            // Push-based flow across CSR structure
            for (uint32_t u = 0; u < n; ++u) {
                if (degrees[u] > 0) {
                    double contribution = (damping_factor * result.scores[u]) / degrees[u];
                    for (uint32_t idx = row[u]; idx < row[u + 1]; ++idx) {
                        uint32_t v = col[idx];
                        next_scores[v] += contribution;
                    }
                }
            }

            // Check L1 convergence delta
            double delta = 0.0;
            for (uint32_t i = 0; i < n; ++i) {
                delta += std::abs(next_scores[i] - result.scores[i]);
            }
            result.scores = next_scores;
            result.delta = delta;

            if (delta < tolerance) {
                break;
            }
        }

        return result;
    }

    // Heuristic Community Detection (Fast modularity clustering)
    // Partitions complex supplier/holding company ecosystems into business clusters
    static CommunityResult detect_communities(const CSRGraph& graph, uint32_t max_passes = 15) {
        CommunityResult result;
        uint32_t n = graph.num_nodes();
        if (n == 0) return result;

        result.node_community.resize(n);
        for (uint32_t i = 0; i < n; ++i) result.node_community[i] = i;

        // Label propagation-based modularity heuristic
        bool changed = true;
        uint32_t pass = 0;
        while (changed && pass < max_passes) {
            changed = false;
            pass++;

            for (uint32_t u = 0; u < n; ++u) {
                std::unordered_map<uint32_t, double> community_weights;
                for (const auto& edge : graph.neighbors(u)) {
                    uint32_t target_comm = result.node_community[edge.target];
                    community_weights[target_comm] += edge.weight;
                }

                if (community_weights.empty()) continue;

                // Pick community with max connection weight
                uint32_t best_comm = result.node_community[u];
                double max_w = 0.0;
                for (const auto& [comm, w] : community_weights) {
                    if (w > max_w) {
                        max_w = w;
                        best_comm = comm;
                    }
                }

                if (best_comm != result.node_community[u]) {
                    result.node_community[u] = best_comm;
                    changed = true;
                }
            }
        }

        // Compact community IDs
        std::unordered_map<uint32_t, uint32_t> remapping;
        uint32_t next_id = 0;
        for (uint32_t i = 0; i < n; ++i) {
            uint32_t orig = result.node_community[i];
            if (remapping.find(orig) == remapping.end()) {
                remapping[orig] = next_id++;
            }
            result.node_community[i] = remapping[orig];
        }
        result.num_communities = next_id;
        return result;
    }
};

} // namespace nexus
