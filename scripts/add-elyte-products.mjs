#!/usr/bin/env node
/**
 * Quick script to add Callaway Elyte 2025 products to the library
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const libraryPath = resolve(__dirname, '..', 'lib', 'productLibrary', 'data', 'golf.json');

const library = JSON.parse(readFileSync(libraryPath, 'utf-8'));

// Find or create Callaway brand
let callaway = library.brands.find(b => b.name === 'Callaway');
if (!callaway) {
  callaway = { name: 'Callaway', aliases: [], products: [], lastUpdated: new Date().toISOString() };
  library.brands.push(callaway);
}

// 2025 Elyte products
const elyteProducts = [
  {
    id: 'callaway-elyte-triple-diamond-driver-2025',
    name: 'Elyte Triple Diamond Driver',
    brand: 'Callaway',
    category: 'golf',
    subcategory: 'drivers',
    releaseYear: 2025,
    msrp: 599,
    visualSignature: {
      primaryColors: ['black', 'red'],
      secondaryColors: ['silver'],
      patterns: ['carbon-weave'],
      finish: 'matte',
      designCues: ['compact head', 'low-spin profile', 'tour-preferred shape'],
      distinguishingFeatures: ['Triple Diamond badge', 'compact 450cc head'],
      logoPlacement: 'crown'
    },
    description: "Callaway's 2025 tour-level driver with the lowest spin profile in their lineup. The Triple Diamond designation indicates the compact, tour-preferred head shape built for elite ball strikers.",
    searchKeywords: ['elyte', 'triple diamond', 'callaway driver', '2025 driver', 'tour driver', 'low spin', 'td'],
    aliases: ['Elyte TD', 'ETD', 'Callaway Elyte TD'],
    variants: [
      {sku: 'CW-ELYTE-TD-9-S', variantName: '9° Stiff', colorway: 'Default', availability: 'current'},
      {sku: 'CW-ELYTE-TD-9-X', variantName: '9° X-Stiff', colorway: 'Default', availability: 'current'},
      {sku: 'CW-ELYTE-TD-10-S', variantName: '10.5° Stiff', colorway: 'Default', availability: 'current'}
    ],
    productUrl: 'https://www.callawaygolf.com/golf-clubs/drivers/elyte-triple-diamond/',
    source: 'inthegolfbag',
    dataConfidence: 95
  },
  {
    id: 'callaway-elyte-driver-2025',
    name: 'Elyte Driver',
    brand: 'Callaway',
    category: 'golf',
    subcategory: 'drivers',
    releaseYear: 2025,
    msrp: 599,
    visualSignature: {
      primaryColors: ['black', 'red'],
      secondaryColors: ['silver'],
      patterns: ['carbon-weave'],
      finish: 'matte',
      designCues: ['460cc head', 'balanced performance'],
      distinguishingFeatures: ['Elyte branding', 'full-size head'],
      logoPlacement: 'crown'
    },
    description: "Callaway's 2025 flagship driver combining distance and forgiveness. The successor to Paradym Ai Smoke with next-gen Ai-designed face technology.",
    searchKeywords: ['elyte', 'callaway driver', '2025 driver', 'callaway elyte'],
    aliases: ['Callaway Elyte'],
    variants: [
      {sku: 'CW-ELYTE-9-S', variantName: '9° Stiff', colorway: 'Default', availability: 'current'},
      {sku: 'CW-ELYTE-105-S', variantName: '10.5° Stiff', colorway: 'Default', availability: 'current'},
      {sku: 'CW-ELYTE-105-R', variantName: '10.5° Regular', colorway: 'Default', availability: 'current'},
      {sku: 'CW-ELYTE-12-R', variantName: '12° Regular', colorway: 'Default', availability: 'current'}
    ],
    productUrl: 'https://www.callawaygolf.com/golf-clubs/drivers/elyte/',
    source: 'inthegolfbag',
    dataConfidence: 95
  },
  {
    id: 'callaway-elyte-max-driver-2025',
    name: 'Elyte Max Driver',
    brand: 'Callaway',
    category: 'golf',
    subcategory: 'drivers',
    releaseYear: 2025,
    msrp: 599,
    visualSignature: {
      primaryColors: ['black', 'red'],
      secondaryColors: ['silver'],
      patterns: ['carbon-weave'],
      finish: 'matte',
      designCues: ['draw-bias design', 'maximum forgiveness'],
      distinguishingFeatures: ['Max branding', 'heel-weighted'],
      logoPlacement: 'crown'
    },
    description: "Maximum forgiveness version of the 2025 Elyte with draw bias for straighter shots. Built for players who want effortless distance with slice-fighting technology.",
    searchKeywords: ['elyte max', 'callaway driver', '2025 driver', 'draw bias', 'forgiving driver'],
    aliases: ['Elyte Max', 'Callaway Elyte Max'],
    variants: [
      {sku: 'CW-ELYTE-MAX-105-S', variantName: '10.5° Stiff', colorway: 'Default', availability: 'current'},
      {sku: 'CW-ELYTE-MAX-105-R', variantName: '10.5° Regular', colorway: 'Default', availability: 'current'},
      {sku: 'CW-ELYTE-MAX-12-R', variantName: '12° Regular', colorway: 'Default', availability: 'current'}
    ],
    productUrl: 'https://www.callawaygolf.com/golf-clubs/drivers/elyte-max/',
    source: 'inthegolfbag',
    dataConfidence: 95
  },
  {
    id: 'callaway-elyte-fairway-wood-2025',
    name: 'Elyte Fairway Wood',
    brand: 'Callaway',
    category: 'golf',
    subcategory: 'fairway-woods',
    releaseYear: 2025,
    msrp: 349,
    visualSignature: {
      primaryColors: ['black', 'red'],
      secondaryColors: ['silver'],
      patterns: ['carbon-weave'],
      finish: 'matte',
      designCues: ['compact head', 'versatile design'],
      distinguishingFeatures: ['Elyte branding'],
      logoPlacement: 'crown'
    },
    description: "Callaway's 2025 fairway wood with next-gen Ai face technology for maximum ball speed off the deck.",
    searchKeywords: ['elyte', 'callaway fairway', '2025 fairway wood', '3 wood', '5 wood'],
    aliases: ['Callaway Elyte FW'],
    variants: [
      {sku: 'CW-ELYTE-FW-3-S', variantName: '3 Wood Stiff', colorway: 'Default', availability: 'current'},
      {sku: 'CW-ELYTE-FW-5-S', variantName: '5 Wood Stiff', colorway: 'Default', availability: 'current'}
    ],
    productUrl: 'https://www.callawaygolf.com/golf-clubs/fairway-woods/elyte/',
    source: 'inthegolfbag',
    dataConfidence: 95
  },
  {
    id: 'callaway-elyte-irons-2025',
    name: 'Elyte Irons',
    brand: 'Callaway',
    category: 'golf',
    subcategory: 'irons',
    releaseYear: 2025,
    msrp: 1199,
    visualSignature: {
      primaryColors: ['silver', 'black'],
      secondaryColors: ['red'],
      patterns: ['solid'],
      finish: 'satin',
      designCues: ['game improvement', 'forgiving cavity back'],
      distinguishingFeatures: ['Elyte branding'],
      logoPlacement: 'back cavity'
    },
    description: "Callaway's 2025 game improvement irons with Ai-designed faces for maximum ball speed and forgiveness across the set.",
    searchKeywords: ['elyte', 'callaway irons', '2025 irons', 'game improvement'],
    aliases: ['Callaway Elyte Iron Set'],
    variants: [
      {sku: 'CW-ELYTE-IR-5P-S', variantName: '5-PW Steel Stiff', colorway: 'Default', availability: 'current'},
      {sku: 'CW-ELYTE-IR-5P-R', variantName: '5-PW Steel Regular', colorway: 'Default', availability: 'current'}
    ],
    productUrl: 'https://www.callawaygolf.com/golf-clubs/irons/elyte/',
    source: 'inthegolfbag',
    dataConfidence: 95
  }
];

// Add products if they don't exist
let added = 0;
for (const product of elyteProducts) {
  const exists = callaway.products.some(p => p.id === product.id);
  if (!exists) {
    callaway.products.push(product);
    console.log('Added:', product.name);
    added++;
  } else {
    console.log('Already exists:', product.name);
  }
}

// Update counts
library.productCount = library.brands.reduce((sum, b) => sum + b.products.length, 0);
library.variantCount = library.brands.reduce((sum, b) =>
  sum + b.products.reduce((pSum, p) => pSum + (p.variants?.length || 0), 0), 0);
library.lastUpdated = new Date().toISOString();

writeFileSync(libraryPath, JSON.stringify(library, null, 2));
console.log(`\nLibrary updated: ${library.productCount} products, ${library.variantCount} variants`);
console.log(`Added ${added} new Elyte products`);
