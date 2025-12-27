
import { GoogleGenAI, Type } from "@google/genai";

export interface AIServiceProvider {
  generateUniverseLetter(input: string): Promise<string>;
  generateAffirmations(theme: string): Promise<string[]>;
  chatWithUniverse(history: { role: 'user' | 'model', text: string }[], message: string): Promise<string>;
}

class GeminiProvider implements AIServiceProvider {
  private ai: GoogleGenAI;
  private modelName = 'gemini-3-flash-preview';

  constructor() {
    // Determine the API key safely
    const apiKey = typeof process !== 'undefined' && process.env ? process.env.API_KEY : '';
    this.ai = new GoogleGenAI({ apiKey: apiKey || '' });
  }

  async generateUniverseLetter(input: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: `最近的感恩点滴: ${input || '生活的美好'}`,
        config: {
          systemInstruction: "你是一个温柔如晨曦的灵魂伴侣。你的文字充满了爱与包容，不带一丝说教。基于用户的记录，写一段极其轻盈、温暖的耳语。字数控制在80字内，不要落款。用‘亲爱的’开头。",
        }
      });
      return response.text || "亲爱的，这一刻的阳光为你而停留。";
    } catch (e) {
      console.error('Letter generation failed:', e);
      return "亲爱的，在安静的呼吸中，感受生命流经你的喜悦。";
    }
  }

  async generateAffirmations(theme: string): Promise<string[]> {
    try {
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: `关于 ${theme || '丰盛'} 的渴望`,
        config: {
          systemInstruction: "生成7条极短、极确定的显化指令（Sammy风格）。必须是：第一人称、已经拥有的状态。禁止废话，禁止感叹号。例如：'我已拥有...'，'这就是我的...'。每条不超过12个字。",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              affirmations: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["affirmations"]
          }
        }
      });
      const text = response.text;
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
          role: h.role,
          parts: [{ text: h.text }]
        }));

      const chat = this.ai.chats.create({
        model: this.modelName,
        history: formattedHistory,
        config: {
          systemInstruction: "你是一个安静陪在身边的老朋友，在晨光中与人私语。你的回答简短、有温度，像温暖的呼吸。不超过20字。避免AI式的排比。鼓励用户记录当下的美好。",
        }
      });
      const response = await chat.sendMessage({ message: message || "你好" });
      return response.text || "我一直在这里，陪你感受当下的风。";
    } catch (e) {
      console.error('Chat failed:', e);
      return "闭上眼，宇宙的低语就在风里。";
    }
  }
}

export const aiService: AIServiceProvider = new GeminiProvider();
