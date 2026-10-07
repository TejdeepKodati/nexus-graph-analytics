#pragma once
#include <string>
#include <vector>
#include <unordered_map>
#include <memory>
#include <cstdint>

namespace nexus {

enum class NodeType {
    CORPORATION,
    BANK_ACCOUNT,
    BENEFICIARY,
    SUPPLIER,
    HOLDING_COMPANY
};

inline std::string nodeTypeToString(NodeType type) {
    switch (type) {
        case NodeType::CORPORATION: return "CORPORATION";
        case NodeType::BANK_ACCOUNT: return "BANK_ACCOUNT";
        case NodeType::BENEFICIARY: return "BENEFICIARY";
        case NodeType::SUPPLIER: return "SUPPLIER";
        case NodeType::HOLDING_COMPANY: return "HOLDING_COMPANY";
        default: return "UNKNOWN";
    }
}

enum class EdgeType {
    TRANSACTION,
    OWNERSHIP,
    SUPPLY_CONTRACT,
    EXECUTIVE_BOARD,
    SHELL_TRANSFER
};

inline std::string edgeTypeToString(EdgeType type) {
    switch (type) {
        case EdgeType::TRANSACTION: return "TRANSACTION";
        case EdgeType::OWNERSHIP: return "OWNERSHIP";
        case EdgeType::SUPPLY_CONTRACT: return "SUPPLY_CONTRACT";
        case EdgeType::EXECUTIVE_BOARD: return "EXECUTIVE_BOARD";
        case EdgeType::SHELL_TRANSFER: return "SHELL_TRANSFER";
        default: return "UNKNOWN";
    }
}

struct Node {
    uint32_t id;
    std::string name;
    NodeType type;
    double initial_risk; // [0.0, 1.0]
    std::string jurisdiction;
    
    Node() : id(0), name(""), type(NodeType::CORPORATION), initial_risk(0.0), jurisdiction("Global") {}
    Node(uint32_t id, std::string name, NodeType type, double risk, std::string jur = "Global")
        : id(id), name(std::move(name)), type(type), initial_risk(risk), jurisdiction(std::move(jur)) {}
};

struct Edge {
    uint32_t source;
    uint32_t target;
    double weight; // Transaction volume or ownership fraction
    EdgeType type;
    int timestamp; // Simulated epoch or day
    
    Edge() : source(0), target(0), weight(1.0), type(EdgeType::TRANSACTION), timestamp(0) {}
    Edge(uint32_t src, uint32_t dst, double w, EdgeType t, int ts = 0)
        : source(src), target(dst), weight(w), type(t), timestamp(ts) {}
};

} // namespace nexus
