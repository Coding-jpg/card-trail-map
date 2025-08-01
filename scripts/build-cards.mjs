#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { z } from 'zod';

// Validation schemas
console.log('Loading Zod schemas...');

const CardKindSchema = z.enum(['profile', 'goal', 'hobby', 'skill', 'project']);
const LineKindSchema = z.enum(['uses', 'inspires', 'supports', 'relates']);
const BadgeSchema = z.enum(['NEW', 'UPDATED', 'DRAFT']);

// Debug function to check schema shape
function assertZodShape(name, schema) {
  if (!schema || !schema._zod || schema._zod.def?.type !== 'object') return;
  const shape = schema._zod.def.shape;
  const bad = Object.entries(shape).filter(([_, v]) => !v || !v._zod);
  if (bad.length) {
    throw new Error(
      `[${name}] invalid Zod shape entries: ` +
      bad.map(([k]) => k).join(', ') +
      `. Check imports/optional chaining.`
    );
  }
  console.log(`✅ ${name} shape validation passed`);
}

// Build schemas with explicit fallbacks
const MediaSchema = z.object({
  type: z.enum(['image', 'none']),
  src: z.string().optional(),
  alt: z.string().optional(),
});

const PosSchema = z.object({
  x: z.number(),
  y: z.number(),
});

// Build CardSchema with safe references
console.log('Building CardSchema...');
const CardSchema = z.object({
  id: z.string(),
  kind: CardKindSchema,
  title: z.string(),
  subtitle: z.string().optional(),
  media: MediaSchema.optional(),
  tags: z.array(z.string()).optional(),
  badges: z.array(BadgeSchema).optional(),
  meta: z.record(z.any()).optional(),
  href: z.string().optional(),
  pos: PosSchema.optional(),
  body: z.string().optional(),
}).passthrough();

console.log('CardSchema created, checking shape...');
assertZodShape('CardSchema', CardSchema);

const LineSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  kind: LineKindSchema,
  weight: z.number().min(0.2).max(1).optional(),
  label: z.string().optional(),
});

class CardBuilder {
  constructor() {
    this.cards = new Map();
    this.lines = new Map();
    this.errors = [];
  }

  async build() {
    console.log('🔄 Building cards and lines...');
    
    try {
      await this.readMarkdownFiles('_cards');
      this.validateReferences();
      await this.writeOutput();
      
      if (this.errors.length > 0) {
        console.error('❌ Build failed with errors:');
        this.errors.forEach(error => {
          console.error(`  ${error.type}: ${error.message}${error.file ? ` (${error.file})` : ''}`);
        });
        process.exit(1);
      }
      
      console.log(`✅ Built ${this.cards.size} cards and ${this.lines.size} lines`);
    } catch (error) {
      console.error('❌ Build failed:', error.message);
      process.exit(1);
    }
  }

  async readMarkdownFiles(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await this.readMarkdownFiles(fullPath);
      } else if (entry.name.endsWith('.md')) {
        await this.processMarkdownFile(fullPath);
      }
    }
  }

  async processMarkdownFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const { data: frontmatter, content: body } = matter(content);
      
      // Generate card ID from filename if not specified
      const id = frontmatter.id || path.basename(filePath, '.md');
      
      // Build card object
      const card = this.buildCard(id, frontmatter, body, filePath);
      
      // Validate card with detailed error handling
      try {
        console.log(`About to validate card for ${filePath}:`);
        console.log('Card data:', JSON.stringify(card, null, 2));
        console.log('CardSchema has _zod:', !!CardSchema._zod);
        console.log('CardSchema shape:', Object.keys(CardSchema._zod.def.shape));
        
        // Check nested schemas
        const mediaSchema = CardSchema._zod.def.shape.media;
        console.log('Media schema exists:', !!mediaSchema);
        if (mediaSchema) {
          console.log('Media schema type:', mediaSchema.constructor.name);
          console.log('Media schema _zod:', !!mediaSchema._zod);
        }
        
        const posSchema = CardSchema._zod.def.shape.pos;
        console.log('Pos schema exists:', !!posSchema);
        if (posSchema) {
          console.log('Pos schema type:', posSchema.constructor.name);
          console.log('Pos schema _zod:', !!posSchema._zod);
        }
        
        console.log('Starting safeParse...');
        const cardResult = CardSchema.safeParse(card);
        console.log('safeParse completed');
        
        if (!cardResult.success) {
          this.errors.push({
            type: 'validation',
            message: `Invalid card schema: ${cardResult.error.message}`,
            file: filePath,
          });
          return;
        }
      } catch (error) {
        console.error('Error during validation:', error);
        console.error('Error stack:', error.stack);
        this.errors.push({
          type: 'validation',
          message: `Zod validation crashed: ${error.message} (at: ${error.stack})`,
          file: filePath,
        });
        return;
      }

      // Check for duplicate IDs
      if (this.cards.has(id)) {
        this.errors.push({
          type: 'duplicate',
          message: `Duplicate card ID: ${id}`,
          file: filePath,
        });
        return;
      }

      this.cards.set(id, card);
      
      // Generate lines from relations
      this.generateLines(card, frontmatter, body);
      
    } catch (error) {
      this.errors.push({
        type: 'validation',
        message: `Failed to process file: ${error.message}`,
        file: filePath,
      });
    }
  }

  buildCard(id, frontmatter, body, filePath) {
    // Generate initial position based on kind and index
    const pos = frontmatter.pos || this.generatePosition(frontmatter.kind, id);
    
    return {
      id,
      kind: frontmatter.kind,
      title: frontmatter.title,
      subtitle: frontmatter.subtitle,
      media: frontmatter.media,
      tags: frontmatter.tags,
      badges: frontmatter.badges,
      meta: this.buildMeta(frontmatter),
      href: frontmatter.href || `/${frontmatter.kind}s/${id}`,
      pos,
      body: body.trim() || undefined,
    };
  }

  buildMeta(frontmatter) {
    const meta = { ...frontmatter };
    
    // Remove standard card fields from meta
    delete meta.id;
    delete meta.kind;
    delete meta.title;
    delete meta.subtitle;
    delete meta.media;
    delete meta.tags;
    delete meta.badges;
    delete meta.href;
    delete meta.pos;
    delete meta.uses;
    delete meta.inspired_by;
    delete meta.supports;
    delete meta.relates;
    
    return Object.keys(meta).length > 0 ? meta : undefined;
  }

  generatePosition(kind, id) {
    // Simple positioning algorithm - can be improved
    const kindOffsets = {
      profile: { x: 0, y: 0 },
      goal: { x: 300, y: -200 },
      hobby: { x: -300, y: 200 },
      skill: { x: 400, y: 100 },
      project: { x: -100, y: -100 },
    };
    
    const baseOffset = kindOffsets[kind] || { x: 0, y: 0 };
    const hashCode = id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    
    return {
      x: baseOffset.x + (hashCode % 200) - 100,
      y: baseOffset.y + ((hashCode * 7) % 200) - 100,
    };
  }

  generateLines(card, frontmatter, body) {
    const { id } = card;
    
    // Process explicit relations
    if (frontmatter.uses) {
      frontmatter.uses.forEach(target => {
        this.addLine(id, target, 'uses');
      });
    }
    
    if (frontmatter.inspired_by) {
      frontmatter.inspired_by.forEach(source => {
        this.addLine(source, id, 'inspires');
      });
    }
    
    if (frontmatter.supports) {
      frontmatter.supports.forEach(target => {
        this.addLine(id, target, 'supports');
      });
    }
    
    if (frontmatter.relates) {
      frontmatter.relates.forEach(target => {
        this.addLine(id, target, 'relates');
        // Two-way relation
        this.addLine(target, id, 'relates');
      });
    }
    
    // Process wiki-links in body
    if (body) {
      const wikiLinks = body.match(/\[\[([^\]]+)\]\]/g);
      if (wikiLinks) {
        wikiLinks.forEach(link => {
          const target = link.slice(2, -2);
          this.addLine(id, target, 'relates');
          this.addLine(target, id, 'relates');
        });
      }
    }
  }

  addLine(source, target, kind) {
    const lineId = `${source}-${kind}-${target}`;
    
    // Avoid duplicate lines
    if (this.lines.has(lineId)) return;
    
    const line = {
      id: lineId,
      source,
      target,
      kind,
      weight: kind === 'supports' ? 0.5 : 1.0,
    };
    
    // Validate line
    const lineResult = LineSchema.safeParse(line);
    if (lineResult.success) {
      this.lines.set(lineId, line);
    }
  }

  validateReferences() {
    for (const line of this.lines.values()) {
      if (!this.cards.has(line.source)) {
        this.errors.push({
          type: 'reference',
          message: `Line references missing source card: ${line.source}`,
        });
      }
      
      if (!this.cards.has(line.target)) {
        this.errors.push({
          type: 'reference',
          message: `Line references missing target card: ${line.target}`,
        });
      }
    }
  }

  async writeOutput() {
    // Ensure public directory exists
    await fs.mkdir('public', { recursive: true });
    
    // Convert Maps to Arrays and sort for stable output
    const cardsArray = Array.from(this.cards.values()).sort((a, b) => a.id.localeCompare(b.id));
    const linesArray = Array.from(this.lines.values()).sort((a, b) => a.id.localeCompare(b.id));
    
    await Promise.all([
      fs.writeFile(
        'public/cards.json',
        JSON.stringify(cardsArray, null, 2),
        'utf-8'
      ),
      fs.writeFile(
        'public/lines.json',
        JSON.stringify(linesArray, null, 2),
        'utf-8'
      ),
    ]);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const builder = new CardBuilder();
  await builder.build();
}

export default CardBuilder;