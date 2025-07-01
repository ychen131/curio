import { BaseAgent, AgentInput, AgentRegistry as IAgentRegistry } from './types';

export class AgentRegistry implements IAgentRegistry {
  private agents: Map<string, BaseAgent> = new Map();

  /**
   * Register an agent
   */
  register(agent: BaseAgent): void {
    if (this.agents.has(agent.name)) {
      throw new Error(`Agent with name '${agent.name}' is already registered`);
    }
    this.agents.set(agent.name, agent);
  }

  /**
   * Get an agent by name
   */
  getAgent(name: string): BaseAgent | undefined {
    return this.agents.get(name);
  }

  /**
   * Get all registered agents
   */
  getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Find an agent that can handle the given input
   */
  canHandle(input: AgentInput): BaseAgent | undefined {
    for (const agent of this.agents.values()) {
      if (agent.canHandle(input)) {
        return agent;
      }
    }
    return undefined;
  }

  /**
   * Unregister an agent
   */
  unregister(name: string): boolean {
    return this.agents.delete(name);
  }

  /**
   * Check if an agent is registered
   */
  hasAgent(name: string): boolean {
    return this.agents.has(name);
  }

  /**
   * Get the number of registered agents
   */
  getAgentCount(): number {
    return this.agents.size;
  }

  /**
   * Clear all registered agents
   */
  clear(): void {
    this.agents.clear();
  }

  /**
   * Get agent names
   */
  getAgentNames(): string[] {
    return Array.from(this.agents.keys());
  }
}

// Global agent registry instance
export const globalAgentRegistry = new AgentRegistry();
