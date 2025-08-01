#!/usr/bin/env node

// Quick script to generate initial data
import CardBuilder from './build-cards.mjs';
import TrailBuilder from './build-trails.mjs';

async function generateAll() {
  console.log('🚀 Generating all data files...');
  
  const cardBuilder = new CardBuilder();
  await cardBuilder.build();
  
  const trailBuilder = new TrailBuilder();
  await trailBuilder.build();
  
  console.log('✅ All data files generated successfully!');
}

generateAll().catch(console.error);