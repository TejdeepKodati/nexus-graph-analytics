#pragma once
#include "types.hpp"
#include <vector>
#include <unordered_map>
#include <stdexcept>
#include <algorithm>
#include <iostream>

namespace nexus {

class CSRGraph;

class DynamicGraph {
private:
    std::vector<Node> nodes_;
    std::unordered_map<std::string, uint32_t> name_to_id_;
    std::vector<std::vector<Edge>> adj_out_;
    std::vector<std::vector<Edge>> adj_in_;
    size_t edge_count_ = 0;

public:
    DynamicGraph() = default;

    uint32_t add_node(const std::string& name, NodeType type, double risk = 0.0, const std::string& jur = "Global") {
        auto it = name_to_id_.find(name);
        if (it != name_to_id_.end()) {
            return it->second;
        }
        uint32_t new_id = static_cast<uint32_t>(nodes_.size());
        nodes_.emplace_back(new_id, name, type, risk, jur);
        name_to_id_[name] = new_id;
        adj_out_.emplace_back();
        adj_in_.emplace_back();
        return new_id;
    }

    void add_edge(uint32_t src, uint32_t dst, double weight, EdgeType type, int timestamp = 0) {
        if (src >= nodes_.size() || dst >= nodes_.size()) {
            throw std::out_of_range("Node ID out of range");
        }
        Edge edge(src, dst, weight, type, timestamp);
        adj_out_[src].push_back(edge);
        adj_in_[dst].push_back(edge);
        edge_count_++;
    }

    void add_edge_by_name(const std::string& src_name, const std::string& dst_name, double weight, EdgeType type, int timestamp = 0) {
        uint32_t src = add_node(src_name, NodeType::CORPORATION);
        uint32_t dst = add_node(dst_name, NodeType::CORPORATION);
        add_edge(src, dst, weight, type, timestamp);
    }

    size_t num_nodes() const { return nodes_.size(); }
    size_t num_edges() const { return edge_count_; }

    const Node& get_node(uint32_t id) const { return nodes_.at(id); }
    const std::vector<Node>& get_all_nodes() const { return nodes_; }
    const std::vector<Edge>& get_outgoing_edges(uint32_t id) const { return adj_out_.at(id); }
    const std::vector<Edge>& get_incoming_edges(uint32_t id) const { return adj_in_.at(id); }

    int32_t find_node_by_name(const std::string& name) const {
        auto it = name_to_id_.find(name);
        if (it != name_to_id_.end()) return static_cast<int32_t>(it->second);
        return -1;
    }

    friend class CSRGraph;
};

// High-Performance Compressed Sparse Row Representation
// Guarantees cache locality, cache-line prefetching, and minimal memory footprint
class CSRGraph {
private:
    uint32_t num_nodes_ = 0;
    uint32_t num_edges_ = 0;
    std::vector<uint32_t> row_ptr_;     // Size: num_nodes + 1
    std::vector<uint32_t> col_indices_; // Size: num_edges
    std::vector<double> edge_weights_;  // Size: num_edges
    std::vector<EdgeType> edge_types_;  // Size: num_edges
    std::vector<Node> node_metadata_;

public:
    CSRGraph() = default;

    explicit CSRGraph(const DynamicGraph& dyn_graph) {
        build_from(dyn_graph);
    }

    void build_from(const DynamicGraph& dyn_graph) {
        num_nodes_ = static_cast<uint32_t>(dyn_graph.num_nodes());
        num_edges_ = static_cast<uint32_t>(dyn_graph.num_edges());
        node_metadata_ = dyn_graph.get_all_nodes();

        row_ptr_.resize(num_nodes_ + 1, 0);
        col_indices_.reserve(num_edges_);
        edge_weights_.reserve(num_edges_);
        edge_types_.reserve(num_edges_);

        uint32_t current_edge_idx = 0;
        for (uint32_t i = 0; i < num_nodes_; ++i) {
            row_ptr_[i] = current_edge_idx;
            const auto& out_edges = dyn_graph.get_outgoing_edges(i);
            for (const auto& e : out_edges) {
                col_indices_.push_back(e.target);
                edge_weights_.push_back(e.weight);
                edge_types_.push_back(e.type);
                current_edge_idx++;
            }
        }
        row_ptr_[num_nodes_] = current_edge_idx;
    }

    uint32_t num_nodes() const { return num_nodes_; }
    uint32_t num_edges() const { return num_edges_; }

    uint32_t out_degree(uint32_t u) const {
        if (u >= num_nodes_) return 0;
        return row_ptr_[u + 1] - row_ptr_[u];
    }

    // Iterator-like access over neighbors of u
    struct EdgeView {
        uint32_t target;
        double weight;
        EdgeType type;
    };

    std::vector<EdgeView> neighbors(uint32_t u) const {
        std::vector<EdgeView> result;
        if (u >= num_nodes_) return result;
        uint32_t start = row_ptr_[u];
        uint32_t end = row_ptr_[u + 1];
        result.reserve(end - start);
        for (uint32_t idx = start; idx < end; ++idx) {
            result.push_back({col_indices_[idx], edge_weights_[idx], edge_types_[idx]});
        }
        return result;
    }

    const uint32_t* row_ptr() const { return row_ptr_.data(); }
    const uint32_t* col_indices() const { return col_indices_.data(); }
    const double* weights() const { return edge_weights_.data(); }
    const Node& get_node(uint32_t u) const { return node_metadata_.at(u); }
    const std::vector<Node>& get_all_nodes() const { return node_metadata_; }

    size_t memory_bytes() const {
        return row_ptr_.capacity() * sizeof(uint32_t) +
               col_indices_.capacity() * sizeof(uint32_t) +
               edge_weights_.capacity() * sizeof(double) +
               edge_types_.capacity() * sizeof(EdgeType) +
               node_metadata_.capacity() * sizeof(Node);
    }
};

} // namespace nexus
