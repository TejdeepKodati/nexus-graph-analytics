#pragma once
#include <string>
#include <vector>
#include <unordered_map>
#include <memory>
#include <algorithm>
#include <cctype>

namespace nexus {

class EntityTrie {
private:
    struct TrieNode {
        std::unordered_map<char, std::unique_ptr<TrieNode>> children;
        std::vector<uint32_t> entity_ids; // IDs of matching entities
        bool is_terminal = false;
    };

    std::unique_ptr<TrieNode> root_;
    size_t total_indexed_entities_ = 0;

    static std::string normalize(const std::string& str) {
        std::string norm;
        norm.reserve(str.size());
        for (char c : str) {
            if (std::isalnum(static_cast<unsigned char>(c))) {
                norm.push_back(static_cast<char>(std::tolower(static_cast<unsigned char>(c))));
            }
        }
        return norm;
    }

public:
    EntityTrie() : root_(std::make_unique<TrieNode>()) {}

    void insert(const std::string& name, uint32_t entity_id) {
        std::string norm = normalize(name);
        if (norm.empty()) return;

        TrieNode* curr = root_.get();
        for (char c : norm) {
            if (curr->children.find(c) == curr->children.end()) {
                curr->children[c] = std::make_unique<TrieNode>();
            }
            curr = curr->children[c].get();
        }
        curr->is_terminal = true;
        curr->entity_ids.push_back(entity_id);
        total_indexed_entities_++;
    }

    // O(L) exact match or prefix search
    std::vector<uint32_t> search_prefix(const std::string& prefix, size_t max_results = 20) const {
        std::string norm = normalize(prefix);
        std::vector<uint32_t> results;
        if (norm.empty()) return results;

        const TrieNode* curr = root_.get();
        for (char c : norm) {
            auto it = curr->children.find(c);
            if (it == curr->children.end()) {
                return results; // No prefix match
            }
            curr = it->second.get();
        }

        // Collect matching entity IDs via DFS
        auto collect = [&](auto self, const TrieNode* node) -> void {
            if (results.size() >= max_results) return;
            for (uint32_t id : node->entity_ids) {
                results.push_back(id);
                if (results.size() >= max_results) return;
            }
            for (const auto& [ch, child] : node->children) {
                self(self, child.get());
                if (results.size() >= max_results) return;
            }
        };

        collect(collect, curr);
        return results;
    }

    size_t total_entities() const { return total_indexed_entities_; }
};

} // namespace nexus
