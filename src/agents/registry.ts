import { BaseAgent, AgentInput } from './types';

export class AgentRegistry {
  private agents = new Map<string, BaseAgent>();

  register(agent: BaseAgent): void {
    this.agents.set(agent.name, agent);
  }

  getAgent(name: string): BaseAgent | undefined {
    return this.agents.get(name);
  }

  getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  canHandle(_input: AgentInput): BaseAgent | undefined {
    return this.agents.get('conversational');
  }
}

export const globalAgentRegistry = new AgentRegistry();
