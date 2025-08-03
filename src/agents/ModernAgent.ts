import OpenAI from 'openai';

// Modern OpenAI Agent Loop Pattern (2024)
export class ModernAgent {
  private client: OpenAI;
  private systemPrompt: string;
  private tools: OpenAI.Chat.Completions.ChatCompletionTool[];
  private toolHandlers: Map<string, Function>;
  private conversationHistory: OpenAI.Chat.Completions.ChatCompletionMessageParam[];

  constructor(
    apiKey: string, 
    systemPrompt: string, 
    tools: { name: string; description: string; parameters: any; handler: Function }[] = []
  ) {
    this.client = new OpenAI({ apiKey });
    this.systemPrompt = systemPrompt;
    this.conversationHistory = [{ role: 'system', content: systemPrompt }];
    this.toolHandlers = new Map();
    
    // Convert tools to OpenAI format
    this.tools = tools.map(tool => {
      this.toolHandlers.set(tool.name, tool.handler);
      return {
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters
        }
      };
    });
  }

  async run(userMessage: string, maxIterations: number = 10): Promise<string> {
    // Add user message to conversation
    this.conversationHistory.push({ role: 'user', content: userMessage });

    let iteration = 0;
    while (iteration < maxIterations) {
      try {
        console.log(`🔄 Agent iteration ${iteration + 1}`);

        // Call OpenAI with current conversation and tools
        const response = await this.client.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: this.conversationHistory,
          tools: this.tools.length > 0 ? this.tools : undefined,
          tool_choice: 'auto',
          temperature: 0.7,
          max_tokens: 1000
        });

        const message = response.choices[0].message;
        this.conversationHistory.push(message);

        // Check if the agent wants to use tools
        if (message.tool_calls && message.tool_calls.length > 0) {
          console.log(`🛠️ Executing ${message.tool_calls.length} tool(s)`);
          
          // Execute all tool calls
          for (const toolCall of message.tool_calls) {
            await this.executeToolCall(toolCall);
          }
          
          iteration++;
          continue; // Continue the loop to get the final response
        }

        // If no tool calls, we have the final response
        if (message.content) {
          console.log('✅ Agent completed successfully');
          return message.content;
        }

        iteration++;
      } catch (error) {
        console.error('❌ Agent iteration failed:', error);
        throw error;
      }
    }

    throw new Error(`Agent reached maximum iterations (${maxIterations})`);
  }

  private async executeToolCall(toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall) {
    const { name, arguments: args } = toolCall.function;
    const handler = this.toolHandlers.get(name);

    if (!handler) {
      console.error(`❌ Tool handler not found: ${name}`);
      this.conversationHistory.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify({ error: `Tool ${name} not found` })
      });
      return;
    }

    try {
      console.log(`🔧 Executing tool: ${name}`);
      const parsedArgs = JSON.parse(args);
      const result = await handler(parsedArgs);
      
      // Add tool result to conversation
      this.conversationHistory.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result)
      });

      console.log(`✅ Tool ${name} executed successfully`);
    } catch (error) {
      console.error(`❌ Tool ${name} execution failed:`, error);
      this.conversationHistory.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' })
      });
    }
  }

  // Add a message to the conversation without running
  addMessage(role: 'user' | 'assistant', content: string) {
    this.conversationHistory.push({ role, content });
  }

  // Get conversation history
  getHistory(): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    return [...this.conversationHistory];
  }

  // Reset conversation (keep system prompt)
  reset() {
    this.conversationHistory = [{ role: 'system', content: this.systemPrompt }];
  }

  // Stream responses (modern pattern)
  async *stream(userMessage: string): AsyncGenerator<string, void, unknown> {
    this.conversationHistory.push({ role: 'user', content: userMessage });

    const stream = await this.client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: this.conversationHistory,
      tools: this.tools.length > 0 ? this.tools : undefined,
      stream: true,
      temperature: 0.7,
      max_tokens: 1000
    });

    let fullContent = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullContent += content;
        yield content;
      }
    }

    // Add complete response to history
    if (fullContent) {
      this.conversationHistory.push({ role: 'assistant', content: fullContent });
    }
  }
}

// Example usage for Square automation
export function createSquareAgent(apiKey: string): ModernAgent {
  const systemPrompt = `You are a Square Dashboard automation expert. You help users:
  - Navigate Square's interface
  - Update product information
  - Optimize SEO content
  - Manage inventory
  
  You have access to tools for interacting with the Square dashboard.
  Always use the appropriate tools to complete tasks efficiently.`;

  const tools = [
    {
      name: 'navigate_to_item',
      description: 'Navigate to a specific Square item by ID',
      parameters: {
        type: 'object',
        properties: {
          itemId: { type: 'string', description: 'The Square item ID' }
        },
        required: ['itemId']
      },
      handler: async ({ itemId }: { itemId: string }) => {
        // This would integrate with your Chrome extension content scripts
        console.log(`Navigating to item: ${itemId}`);
        return { success: true, message: `Navigated to item ${itemId}` };
      }
    },
    {
      name: 'update_seo',
      description: 'Update SEO information for a product',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Product title' },
          description: { type: 'string', description: 'Product description' },
          tags: { type: 'array', items: { type: 'string' }, description: 'Product tags' }
        },
        required: ['title']
      },
      handler: async ({ title, description, tags }: { title: string; description?: string; tags?: string[] }) => {
        console.log(`Updating SEO: ${title}`);
        return { success: true, message: 'SEO updated successfully' };
      }
    }
  ];

  return new ModernAgent(apiKey, systemPrompt, tools);
}

// Example usage for Spocket extraction
export function createSpocketAgent(apiKey: string): ModernAgent {
  const systemPrompt = `You are a Spocket product extraction expert. You help users:
  - Extract product data from Spocket pages
  - Download product images
  - Analyze product information
  - Calculate profit margins
  
  Use the available tools to efficiently extract and process product data.`;

  const tools = [
    {
      name: 'extract_product_data',
      description: 'Extract product information from current Spocket page',
      parameters: {
        type: 'object',
        properties: {},
      },
      handler: async () => {
        console.log('Extracting product data from Spocket');
        return {
          success: true,
          data: {
            title: 'Sample Product',
            price: '$25.00',
            supplier: 'Sample Supplier'
          }
        };
      }
    }
  ];

  return new ModernAgent(apiKey, systemPrompt, tools);
}
