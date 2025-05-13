import { SkillsGraph } from "./graph"
import { buildFrontendSkillsGraph } from "./data/frontend-skills"
import { buildBackendSkillsGraph } from "./data/backend-skills"
import { SkillRelationshipType } from "./types"

/**
 * Build the complete skills knowledge graph
 */
export function buildSkillsKnowledgeGraph(): SkillsGraph {
  // Create a new graph
  const graph = new SkillsGraph()

  // Build domain-specific graphs
  const frontendGraph = buildFrontendSkillsGraph()
  const backendGraph = buildBackendSkillsGraph()

  // Merge nodes from all graphs
  Object.values(frontendGraph.nodes).forEach((node) => {
    if (!graph.nodes[node.id]) {
      graph.addSkill(node)
    }
  })

  Object.values(backendGraph.nodes).forEach((node) => {
    if (!graph.nodes[node.id]) {
      graph.addSkill(node)
    }
  })

  // Merge relationships from all graphs
  frontendGraph.relationships.forEach((rel) => {
    if (graph.nodes[rel.sourceId] && graph.nodes[rel.targetId]) {
      try {
        graph.addRelationship(rel)
      } catch (e) {
        // Skip if relationship already exists
      }
    }
  })

  backendGraph.relationships.forEach((rel) => {
    if (graph.nodes[rel.sourceId] && graph.nodes[rel.targetId]) {
      try {
        graph.addRelationship(rel)
      } catch (e) {
        // Skip if relationship already exists
      }
    }
  })

  // Add cross-domain relationships
  addCrossDomainRelationships(graph)

  return graph
}

/**
 * Add relationships between skills across different domains
 */
function addCrossDomainRelationships(graph: SkillsGraph): void {
  // Frontend to Backend relationships
  if (graph.nodes["react"] && graph.nodes["express"]) {
    graph.addRelationship({
      sourceId: "react",
      targetId: "express",
      type: SkillRelationshipType.USED_WITH,
      strength: 0.8,
      context: "MERN Stack",
    })
  }

  if (graph.nodes["nextjs"] && graph.nodes["nodejs"]) {
    graph.addRelationship({
      sourceId: "nextjs",
      targetId: "nodejs",
      type: SkillRelationshipType.REQUIRES,
      strength: 0.9,
    })
  }

  // Database to Framework relationships
  if (graph.nodes["react"] && graph.nodes["mongodb"]) {
    graph.addRelationship({
      sourceId: "react",
      targetId: "mongodb",
      type: SkillRelationshipType.USED_WITH,
      strength: 0.7,
      context: "MERN Stack",
    })
  }

  // API to Framework relationships
  if (graph.nodes["restfulApi"] && graph.nodes["express"]) {
    graph.addRelationship({
      sourceId: "express",
      targetId: "restfulApi",
      type: SkillRelationshipType.USED_WITH,
      strength: 0.9,
    })
  }

  if (graph.nodes["graphql"] && graph.nodes["react"]) {
    graph.addRelationship({
      sourceId: "react",
      targetId: "graphql",
      type: SkillRelationshipType.USED_WITH,
      strength: 0.8,
    })
  }

  // Cloud to Framework relationships
  if (graph.nodes["aws"] && graph.nodes["react"]) {
    graph.addRelationship({
      sourceId: "react",
      targetId: "aws",
      type: SkillRelationshipType.USED_WITH,
      strength: 0.7,
    })
  }

  // DevOps to Framework relationships
  if (graph.nodes["docker"] && graph.nodes["nodejs"]) {
    graph.addRelationship({
      sourceId: "nodejs",
      targetId: "docker",
      type: SkillRelationshipType.USED_WITH,
      strength: 0.8,
    })
  }
}

// Export all types and functions
export * from "./types"
export * from "./graph"
