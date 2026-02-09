import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';
import { glob } from 'glob';

export interface SkillMetadata {
  name: string;
  description: string;
  author?: string;
  version?: string;
  license?: string;
  tags?: string[];
}

export interface Skill extends SkillMetadata {
  path: string;
  content: string;
  rawContent: string;
}

export class SkillsManager {
  private skills: Map<string, Skill> = new Map();
  private skillsPath: string;

  constructor(skillsPath?: string) {
    this.skillsPath = skillsPath || process.env.SKILLS_PATH || './skills';
  }

  async loadSkills(): Promise<void> {
    const pattern = path.join(this.skillsPath, '**/SKILL.md').replace(/\\/g, '/');
    const files = await glob(pattern);
    
    for (const file of files) {
      try {
        const skill = await this.parseSkillFile(file);
        if (skill) {
          this.skills.set(skill.name, skill);
        }
      } catch (error) {
        console.error(`Error loading skill from ${file}:`, error);
      }
    }
    
    console.error(`Loaded ${this.skills.size} skills from ${this.skillsPath}`);
  }

  private async parseSkillFile(filePath: string): Promise<Skill | null> {
    const rawContent = await fs.promises.readFile(filePath, 'utf-8');
    const { data, content } = matter(rawContent);
    
    if (!data.name) {
      console.error(`Skill at ${filePath} missing 'name' in frontmatter`);
      return null;
    }

    const metadata = data.metadata || {};
    
    return {
      name: data.name,
      description: data.description || '',
      author: metadata.author || data.author,
      version: metadata.version || data.version,
      license: data.license,
      tags: this.extractTags(data, content),
      path: filePath,
      content: content.trim(),
      rawContent
    };
  }

  private extractTags(frontmatter: Record<string, unknown>, content: string): string[] {
    const tags: Set<string> = new Set();
    
    // Tags from frontmatter
    if (Array.isArray(frontmatter.tags)) {
      frontmatter.tags.forEach((tag: string) => tags.add(tag.toLowerCase()));
    }
    
    // Extract from description trigger
    const description = String(frontmatter.description || '');
    const triggerMatch = description.match(/trigger:\s*(.+)/i);
    if (triggerMatch) {
      const triggerWords = triggerMatch[1]
        .toLowerCase()
        .split(/[,\s]+/)
        .filter(word => word.length > 3);
      triggerWords.forEach(word => tags.add(word));
    }
    
    return Array.from(tags);
  }

  list(): SkillMetadata[] {
    return Array.from(this.skills.values()).map(skill => ({
      name: skill.name,
      description: skill.description,
      author: skill.author,
      version: skill.version,
      license: skill.license,
      tags: skill.tags
    }));
  }

  get(name: string): Skill | undefined {
    return this.skills.get(name);
  }

  search(query: string, tags?: string[], limit: number = 5): Skill[] {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);
    
    const results: Array<{ skill: Skill; score: number }> = [];
    
    for (const skill of this.skills.values()) {
      let score = 0;
      
      // Name match (highest weight)
      if (skill.name.toLowerCase().includes(queryLower)) {
        score += 10;
      }
      
      // Description match
      const descLower = skill.description.toLowerCase();
      for (const word of queryWords) {
        if (descLower.includes(word)) {
          score += 3;
        }
      }
      
      // Content match
      const contentLower = skill.content.toLowerCase();
      for (const word of queryWords) {
        if (contentLower.includes(word)) {
          score += 1;
        }
      }
      
      // Tag boost
      if (tags && tags.length > 0 && skill.tags) {
        const matchingTags = tags.filter(tag => 
          skill.tags!.some(t => t.includes(tag.toLowerCase()))
        );
        score += matchingTags.length * 2;
      }
      
      if (score > 0) {
        results.push({ skill, score });
      }
    }
    
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(r => r.skill);
  }

  getSkillsPath(): string {
    return this.skillsPath;
  }
}
