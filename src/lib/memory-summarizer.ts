import { Embedder } from "../core/embedder.js";

/**
 * 记忆总结器
 * 使用 LLM 总结大量相关记忆
 */
export class MemorySummarizer {
  private embedder: Embedder;
  private openai: any;

  constructor(embedder: Embedder, openai: any) {
    this.embedder = embedder;
    this.openai = openai;
  }

  /**
   * 总结指定分类的知识
   */
  async summarizeCategory(
    records: any[],
    options: {
      maxTokens?: number;
      includeLowImportance?: boolean;
    } = {}
  ): Promise<{
    summary: string;
    keyPoints: string[];
    statistics: {
      total: number;
      highImportance: number;
      mediumImportance: number;
      lowImportance: number;
    };
  }> {
    const { maxTokens = 1000, includeLowImportance = false } = options;

    // 过滤记录
    let filteredRecords = records;
    if (!includeLowImportance) {
      filteredRecords = records.filter((r: any) => (r.importance || 0) >= 0.6);
    }

    // 统计信息
    const statistics = {
      total: filteredRecords.length,
      highImportance: filteredRecords.filter((r: any) => (r.importance || 0) >= 0.8)
        .length,
      mediumImportance: filteredRecords.filter(
        (r: any) => (r.importance || 0) >= 0.6 && (r.importance || 0) < 0.8
      ).length,
      lowImportance: filteredRecords.filter((r: any) => (r.importance || 0) < 0.6)
        .length,
    };

    if (filteredRecords.length === 0) {
      return {
        summary: "没有找到相关的记忆记录。",
        keyPoints: [],
        statistics,
      };
    }

    // 构建总结文本
    const recordsText = filteredRecords
      .map((r: any) => {
        const importance = (r.importance || 0).toFixed(2);
        return `[重要性: ${importance}] ${r.text}`;
      })
      .join("\n\n");

    // 使用 LLM 总结
    const prompt = `请总结以下记忆记录，提取关键信息。

记忆记录：
${recordsText}

请提供：
1. 一个简洁的总结（100-200字）
2. 3-5个关键点
3. 重要的模式和趋势

以 JSON 格式返回：
{
  "summary": "总结内容",
  "keyPoints": ["关键点1", "关键点2", ...],
  "patterns": "重要的模式和趋势（如果有）"
}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "你是一个专业的知识总结助手，擅长从大量信息中提炼关键内容。",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: maxTokens,
        temperature: 0.3,
      });

      const content = completion.choices[0].message.content;
      const result = JSON.parse(content || "{}");

      return {
        summary: result.summary || "总结生成失败",
        keyPoints: result.keyPoints || [],
        statistics,
      };
    } catch (error) {
      console.error("总结失败:", error);

      // 降级处理：简单的基于规则总结
      return {
        summary: `找到 ${filteredRecords.length} 条相关记忆，${statistics.highImportance} 条高重要性，${statistics.mediumImportance} 条中等重要性。`,
        keyPoints: filteredRecords.slice(0, 5).map((r: any) => r.text.substring(0, 100)),
        statistics,
      };
    }
  }

  /**
   * 萃取记忆中的关键信息
   */
  async extractKnowledge(
    records: any[],
    options: {
      maxResults?: number;
      minImportance?: number;
      deduplicate?: boolean;
    } = {}
  ): Promise<{
    extracted: Array<{
      id: string;
      text: string;
      importance: number;
      category: string;
      reason: string;
    }>;
    totalProcessed: number;
    duplicatesRemoved: number;
  }> {
    const {
      maxResults = 10,
      minImportance = 0.7,
      deduplicate = true,
    } = options;

    // 过滤记录
    let filteredRecords = records.filter(
      (r: any) => (r.importance || 0) >= minImportance
    );

    // 按重要性排序
    filteredRecords.sort(
      (a: any, b: any) => (b.importance || 0) - (a.importance || 0)
    );

    const totalProcessed = records.length;
    let duplicatesRemoved = 0;

    // 去重（如果启用）
    if (deduplicate) {
      const seenTexts = new Set<string>();
      const deduplicatedRecords: any[] = [];

      for (const record of filteredRecords) {
        const text = record.text || "";
        // 简单的去重策略：文本相似度
        let isDuplicate = false;
        for (const seenText of seenTexts) {
          const similarity = this.calculateSimilarity(text, seenText);
          if (similarity > 0.8) {
            isDuplicate = true;
            duplicatesRemoved++;
            break;
          }
        }

        if (!isDuplicate) {
          seenTexts.add(text);
          deduplicatedRecords.push(record);
        }
      }

      filteredRecords = deduplicatedRecords;
    }

    // 萃取关键信息
    const extracted = await Promise.all(
      filteredRecords.slice(0, maxResults).map(async (record: any) => {
        const reason = await this.extractImportanceReason(record);
        return {
          id: record.id,
          text: record.text,
          importance: record.importance || 0,
          category: record.category,
          reason,
        };
      })
    );

    return {
      extracted,
      totalProcessed,
      duplicatesRemoved,
    };
  }

  /**
   * 提取重要性原因
   */
  private async extractImportanceReason(record: any): Promise<string> {
    const prompt = `解释为什么这条记忆很重要：

记忆内容：${record.text}
分类：${record.category}
重要性评分：${record.importance}

请用一句话（30字以内）解释为什么这条记忆值得保留。`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "你是一个知识管理助手，擅长解释信息的重要性。",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 100,
        temperature: 0.3,
      });

      return completion.choices[0].message.content?.trim() || "重要信息";
    } catch (error) {
      return "重要信息";
    }
  }

  /**
   * 计算文本相似度（简单的 Jaccard 相似度）
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }
}
