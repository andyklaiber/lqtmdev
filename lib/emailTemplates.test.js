'use strict';
const { 
  getDefaultTemplate, 
  normalizeTemplate, 
  prepareTemplateData,
  renderTemplate 
} = require('./emailTemplates');

/**
 * Simple test suite for email templates
 * Run with: node lib/emailTemplates.test.js
 */

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function testGetDefaultTemplate() {
  console.log('Testing getDefaultTemplate...');
  const template = getDefaultTemplate();
  assert(template.subject, 'Default template should have a subject');
  assert(template.body, 'Default template should have a body');
  assert(template.subject.includes('{{eventName}}'), 'Default subject should include eventName variable');
  console.log('✓ getDefaultTemplate passed');
}

function testNormalizeTemplateWithObject() {
  console.log('Testing normalizeTemplate with object...');
  const input = {
    subject: 'Custom Subject',
    body: '<html>Custom Body</html>'
  };
  const result = normalizeTemplate(input);
  assert(result.subject === 'Custom Subject', 'Should preserve custom subject');
  assert(result.body === '<html>Custom Body</html>', 'Should preserve custom body');
  console.log('✓ normalizeTemplate with object passed');
}

function testNormalizeTemplateWithString() {
  console.log('Testing normalizeTemplate with string (backwards compatibility)...');
  const oldTemplate = '<html><body>Old format template</body></html>';
  const result = normalizeTemplate(oldTemplate);
  assert(result.subject === '{{eventName}} Registration', 'Should use default subject for old string templates');
  assert(result.body === oldTemplate, 'Should use string as body');
  console.log('✓ normalizeTemplate with string (backwards compatibility) passed');
}

function testNormalizeTemplateWithNull() {
  console.log('Testing normalizeTemplate with null...');
  const result = normalizeTemplate(null);
  assert(result.subject, 'Should return default template when null');
  assert(result.body, 'Should return default template when null');
  console.log('✓ normalizeTemplate with null passed');
}

function testPrepareTemplateData() {
  console.log('Testing prepareTemplateData...');
  const regData = {
    first_name: 'john',
    last_name: 'doe',
    sponsor: 'Test Team',
    email: 'john@example.com',
    raceid: 'race123',
    category: 'cat1'
  };
  
  const raceData = {
    eventDetails: {
      name: 'Test Race',
      homepageUrl: 'https://example.com'
    },
    contactEmail: 'contact@example.com',
    regCategories: [
      { id: 'cat1', catdispname: 'Men\'s Cat 1' }
    ]
  };
  
  const capitalizeName = (name) => name.toUpperCase();
  
  const data = prepareTemplateData(regData, raceData, capitalizeName);
  
  assert(data.name === 'JOHN DOE', 'Should capitalize name');
  assert(data.sponsor === 'Test Team', 'Should include sponsor');
  assert(data.eventName === 'Test Race', 'Should include event name');
  assert(data.category === 'Men\'s Cat 1', 'Should include category display name');
  assert(data.rosterLink.includes('race123'), 'Should include roster link with raceid');
  console.log('✓ prepareTemplateData passed');
}

function testRenderTemplateWithObject() {
  console.log('Testing renderTemplate with object template...');
  const template = {
    subject: 'Welcome to {{eventName}}',
    body: '<html><body>Hello {{name}}, you registered for {{eventName}}</body></html>'
  };
  
  const data = {
    name: 'John Doe',
    eventName: 'Test Race'
  };
  
  const result = renderTemplate(template, data);
  
  assert(result.subject === 'Welcome to Test Race', 'Should render subject with data');
  assert(result.html.includes('Hello John Doe'), 'Should render body with name');
  assert(result.html.includes('you registered for Test Race'), 'Should render body with event name');
  console.log('✓ renderTemplate with object passed');
}

function testRenderTemplateWithString() {
  console.log('Testing renderTemplate with string (backwards compatibility)...');
  const oldTemplate = '<html><body>Hello {{name}}</body></html>';
  
  const data = {
    name: 'John Doe',
    eventName: 'Test Race'
  };
  
  const result = renderTemplate(oldTemplate, data);
  
  assert(result.subject === 'Test Race Registration', 'Should use default subject pattern');
  assert(result.html.includes('Hello John Doe'), 'Should render old template with data');
  console.log('✓ renderTemplate with string (backwards compatibility) passed');
}

function runTests() {
  console.log('\n=== Running Email Template Tests ===\n');
  
  try {
    testGetDefaultTemplate();
    testNormalizeTemplateWithObject();
    testNormalizeTemplateWithString();
    testNormalizeTemplateWithNull();
    testPrepareTemplateData();
    testRenderTemplateWithObject();
    testRenderTemplateWithString();
    
    console.log('\n✅ All tests passed!\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };

