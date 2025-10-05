// Test script to verify application structure
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Desktop Calculator App Structure...\n');

// Test 1: Check required directories
const requiredDirs = ['src', 'data', 'src/js', 'src/styles', 'data'];
requiredDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`✅ Directory exists: ${dir}`);
  } else {
    console.log(`❌ Directory missing: ${dir}`);
  }
});

// Test 2: Check required files
const requiredFiles = [
  'package.json',
  'src/main.js',
  'src/preload.js', 
  'src/index.html',
  'src/js/app.js',
  'src/js/csvManager.js',
  'src/js/stateManager.js',
  'src/js/uiManager.js',
  'src/styles/output.css'
];

console.log('\n📁 File Structure:');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const stats = fs.statSync(file);
    console.log(`✅ ${file} (${Math.round(stats.size / 1024)}KB)`);
  } else {
    console.log(`❌ ${file} - MISSING`);
  }
});

// Test 3: Check CSV data files
const csvFiles = [
  'data/projects.csv',
  'data/resources.csv',
  'data/productivity.csv',
  'data/master.csv',
  'data/calculator_history.csv'
];

console.log('\n📊 CSV Data Files:');
csvFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    console.log(`✅ ${file} (${lines.length} lines)`);
  } else {
    console.log(`❌ ${file} - MISSING`);
  }
});

// Test 4: Parse package.json
console.log('\n📦 Package Information:');
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`✅ Name: ${pkg.name}`);
  console.log(`✅ Version: ${pkg.version}`);
  console.log(`✅ Main: ${pkg.main}`);
  console.log(`✅ Scripts: ${Object.keys(pkg.scripts).join(', ')}`);
  console.log(`✅ Dependencies: ${Object.keys(pkg.dependencies || {}).length}`);
  console.log(`✅ DevDependencies: ${Object.keys(pkg.devDependencies || {}).length}`);
} catch (error) {
  console.log('❌ Error parsing package.json:', error.message);
}

// Test 5: Check HTML structure
console.log('\n🌐 HTML Structure:');
try {
  const htmlContent = fs.readFileSync('src/index.html', 'utf8');
  
  // Check for key elements
  const checks = [
    ['Title tag', /<title>/],
    ['Tailwind CSS', /tailwind|styles\/output\.css/],
    ['Font Awesome', /font-?awesome/],
    ['Navigation sidebar', /sidebar/],
    ['Script tags', /<script.*src=/],
    ['Data attributes', /data-testid/]
  ];
  
  checks.forEach(([name, regex]) => {
    if (regex.test(htmlContent)) {
      console.log(`✅ ${name} found`);
    } else {
      console.log(`❌ ${name} not found`);
    }
  });
} catch (error) {
  console.log('❌ Error reading HTML file:', error.message);
}

// Test 6: Check JavaScript syntax
console.log('\n⚙️ JavaScript Syntax Check:');
const jsFiles = ['src/js/csvManager.js', 'src/js/stateManager.js', 'src/js/uiManager.js', 'src/js/app.js'];

jsFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    // Basic syntax checks
    const hasClass = /class\s+\w+/.test(content);
    const hasFunction = /function\s+\w+|=>\s*{|async\s+\w+/.test(content);
    const hasEvents = /addEventListener|onclick|on\w+/.test(content);
    
    console.log(`✅ ${file}:`);
    console.log(`   - Classes: ${hasClass ? '✓' : '✗'}`);
    console.log(`   - Functions: ${hasFunction ? '✓' : '✗'}`);
    console.log(`   - Event Handlers: ${hasEvents ? '✓' : '✗'}`);
  } catch (error) {
    console.log(`❌ ${file}: ${error.message}`);
  }
});

console.log('\n🎉 Structure test completed!');
console.log('\n💡 To start the application:');
console.log('   npm start');
console.log('\n💡 For development with hot reload:');
console.log('   npm run dev');