#!/usr/bin/env node

import fs from 'fs/promises';
import matter from 'gray-matter';
import { z } from 'zod';

// Validation schemas
const ActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('overview'), zoom: z.number().optional() }),
  z.object({ 
    type: z.literal('focus'), 
    card: z.string(), 
    zoom: z.number().optional(), 
    duration: z.number().optional() 
  }),
  z.object({ 
    type: z.literal('linkHighlight'), 
    from: z.string(), 
    to: z.string(), 
    kind: z.enum(['uses', 'inspires', 'supports', 'relates']) 
  }),
  z.object({ 
    type: z.literal('revealMeta'), 
    card: z.string(), 
    fields: z.array(z.string()) 
  }),
  z.object({ type: z.literal('pin'), card: z.string() }),
  z.object({ type: z.literal('unpin'), card: z.string() }),
  z.object({ type: z.literal('pulse'), card: z.string() }),
]);

const StepSchema = z.object({
  id: z.string(),
  actions: z.array(ActionSchema),
});

const TrailSchema = z.object({
  id: z.string(),
  title: z.string(),
  steps: z.array(StepSchema),
});

class TrailBuilder {
  constructor() {
    this.trails = new Map();
    this.errors = [];
  }

  async build() {
    console.log('🔄 Building trails...');
    
    try {
      await this.readMarkdownFiles('_trails');
      await this.writeOutput();
      
      if (this.errors.length > 0) {
        console.error('❌ Build failed with errors:');
        this.errors.forEach(error => {
          console.error(`  ${error.type}: ${error.message}${error.file ? ` (${error.file})` : ''}`);
        });
        process.exit(1);
      }
      
      console.log(`✅ Built ${this.trails.size} trails`);
    } catch (error) {
      console.error('❌ Build failed:', error.message);
      process.exit(1);
    }
  }

  async readMarkdownFiles(dir) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.name.endsWith('.md')) {
          const fullPath = `${dir}/${entry.name}`;
          await this.processMarkdownFile(fullPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist - create empty trails
      console.log('📁 No _trails directory found, creating empty trails.json');
    }
  }

  async processMarkdownFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const { data: frontmatter } = matter(content);
      
      // Build trail object
      const trail = {
        id: frontmatter.id || frontmatter.title?.toLowerCase().replace(/\s+/g, '-') || 'default',
        title: frontmatter.title || 'Untitled Trail',
        steps: frontmatter.steps || [],
      };
      
      // Validate trail
      const trailResult = TrailSchema.safeParse(trail);
      if (!trailResult.success) {
        this.errors.push({
          type: 'validation',
          message: `Invalid trail schema: ${trailResult.error.message}`,
          file: filePath,
        });
        return;
      }

      // Check for duplicate IDs
      if (this.trails.has(trail.id)) {
        this.errors.push({
          type: 'duplicate',
          message: `Duplicate trail ID: ${trail.id}`,
          file: filePath,
        });
        return;
      }

      this.trails.set(trail.id, trail);
      
    } catch (error) {
      this.errors.push({
        type: 'validation',
        message: `Failed to process file: ${error.message}`,
        file: filePath,
      });
    }
  }

  async writeOutput() {
    // Ensure public directory exists
    await fs.mkdir('public', { recursive: true });
    
    // Convert Map to Array and sort for stable output
    const trailsArray = Array.from(this.trails.values()).sort((a, b) => a.id.localeCompare(b.id));
    
    await fs.writeFile(
      'public/trails.json',
      JSON.stringify(trailsArray, null, 2),
      'utf-8'
    );
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const builder = new TrailBuilder();
  await builder.build();
}

export default TrailBuilder;