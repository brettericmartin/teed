import { parseText } from '../lib/textParsing';

const inputs = [
  'LG UltraGear Gaming Monitor',
  'JBL Flip 6 Bluetooth Speaker',
];

for (const input of inputs) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Input: "${input}"`);
  console.log('='.repeat(60));

  const result = parseText(input);

  console.log('Parsed result:');
  console.log('  Brand:', result.brand?.value || 'null', `(confidence: ${result.brand?.confidence})`);
  console.log('  Product:', result.productName?.value || 'null');
  console.log('  Color:', result.color || 'null');
  console.log('  Category:', result.inferredCategory || 'null');
  console.log('  Remaining text:', result.remainingText);
  console.log('  Stages run:', result.stagesRun.join(' → '));
  console.log('\n  Components:');
  for (const c of result.components) {
    console.log(`    - ${c.type}: "${c.value}" (${c.source}, confidence: ${c.confidence})`);
  }
}
