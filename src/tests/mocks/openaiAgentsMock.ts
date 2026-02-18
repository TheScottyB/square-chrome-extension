type AgentConfig = {
  name: string;
  instructions?: string;
  model?: string;
  tools?: unknown[];
};

export class Agent {
  public name: string;
  public instructions?: string;
  public model?: string;
  public tools: unknown[];

  constructor(config: AgentConfig) {
    this.name = config.name;
    this.instructions = config.instructions;
    this.model = config.model;
    this.tools = config.tools || [];
  }
}

export async function run(_agent: Agent, _input: string, _options?: unknown): Promise<string> {
  return 'mock-run-result';
}

export function tool<T>(definition: T): T {
  return definition;
}
