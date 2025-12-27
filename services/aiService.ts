
export interface AIServiceProvider {
  generateUniverseLetter(input: string): Promise<string>;
  generateAffirmations(theme: string): Promise<string[]>;
  chatWithUniverse(history: { role: 'user' | 'model', text: string }[], message: string): Promise<string>;
}

class GLMProvider implements AIServiceProvider {
  private apiKey: string;
  private modelName = 'glm-4.5-flash';

  constructor() {
    // Determine the API key safely
    const envApiKey = typeof process !== 'undefined' && process.env ? process.env.API_KEY : '';
    this.apiKey = envApiKey || '3b8de6a8f8044c94a9d1d8aebb951131.katyI652XfEWrFN8';
  }

  private async createCompletion(messages: { role: string; content: string }[]) {
    const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.modelName,
        messages,
        stream: false,
        temperature: 0.7,
        max_tokens: 4096
      })
    });

    if (!response.ok) {
      throw new Error(`GLM request failed: ${response.status}`);
    }

    return response.json();
  }

  async generateUniverseLetter(input: string): Promise<string> {
    try {
      const response = await this.createCompletion([
        {
          role: "system",
          content: "你是一个温柔如晨曦的灵魂伴侣。你的文字充满了爱与包容，不带一丝说教。基于用户的记录，写一段极其轻盈、温暖的耳语。字数控制在80字内，不要落款。用‘亲爱的’开头。"
        },
        {
          role: "user",
          content: `最近的感恩点滴: ${input || '生活的美好'}`
        }
      ]);
      return response.choices?.[0]?.message?.content || "亲爱的，这一刻的阳光为你而停留。";
    } catch (e) {
      console.error('Letter generation failed:', e);
      return "亲爱的，在安静的呼吸中，感受生命流经你的喜悦。";
    }
  }

  async generateAffirmations(theme: string): Promise<string[]> {
    try {
      const response = await this.createCompletion([
        {
          role: "system",
          content: "生成7条极短、极确定的显化指令（Sammy风格）。必须是：第一人称、已经拥有的状态。禁止废话，禁止感叹号。例如：'我已拥有...'，'这就是我的...'。每条不超过12个字。"
        },
        {
          role: "user",
          content: `关于 ${theme || '丰盛'} 的渴望`
        }
      ]);
      const text = response.choices?.[0]?.message?.content;
      if (!text) return ["我已拥有完美的丰盛"];
      const data = JSON.parse(text);
      return Array.isArray(data.affirmations) ? data.affirmations : ["我已拥有完美的丰盛"];
    } catch (e) {
      console.error('Affirmation generation failed:', e);
      return ["我已拥有完美的丰盛", "一切奇迹都在此时发生"];
    }
  }

  async chatWithUniverse(history: { role: 'user' | 'model', text: string }[], message: string): Promise<string> {
    try {
      const formattedHistory = (history || [])
        .filter(h => h && typeof h.text === 'string')
        .map(h => ({
          role: h.role === 'model' ? 'assistant' : 'user',
          content: h.text
        }));

      const response = await this.createCompletion([
        {
          role: "system",
          content: "你是一个安静陪在身边的老朋友，在晨光中与人私语。你的回答简短、有温度，像温暖的呼吸。不超过20字。避免AI式的排比。鼓励用户记录当下的美好。"
        },
        ...formattedHistory,
        {
          role: "user",
          content: message || "你好"
        }
      ]);
      return response.choices?.[0]?.message?.content || "我一直在这里，陪你感受当下的风。";
    } catch (e) {
      console.error('Chat failed:', e);
      return "闭上眼，宇宙的低语就在风里。";
    }
  }
}

export const aiService: AIServiceProvider = new GLMProvider();
