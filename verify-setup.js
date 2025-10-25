#!/usr/bin/env node

/**
 * Verification script for the consolidated package structure
 * This script verifies that all dependencies are accessible from the expected locations
 */

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Verifying consolidated package structure...\n');

// Check if root package.json exists and has all dependencies
function checkRootPackage() {
    try {
        const packageJson = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8'));
        const deps = Object.keys(packageJson.dependencies || {});
        const devDeps = Object.keys(packageJson.devDependencies || {});
        
        console.log('✅ Root package.json found');
        console.log(`   📦 Dependencies: ${deps.length}`);
        console.log(`   🛠️  DevDependencies: ${devDeps.length}`);
        
        // Check for key dependencies
        const requiredDeps = [
            'express', 'cors', 'dotenv', 'mongodb', 'react', 'react-dom'
        ];
        
        const missing = requiredDeps.filter(dep => !deps.includes(dep));
        if (missing.length === 0) {
            console.log('   ✅ All required dependencies present\n');
            return true;
        } else {
            console.log(`   ❌ Missing dependencies: ${missing.join(', ')}\n`);
            return false;
        }
    } catch (error) {
        console.log('❌ Failed to read root package.json\n');
        return false;
    }
}

// Check backend package.json structure
function checkBackendPackage() {
    try {
        const packageJson = JSON.parse(readFileSync(join(__dirname, 'backend/package.json'), 'utf8'));
        const hasNoDeps = !packageJson.dependencies || Object.keys(packageJson.dependencies).length === 0;
        const hasNoDevDeps = !packageJson.devDependencies || Object.keys(packageJson.devDependencies).length === 0;
        
        console.log('✅ Backend package.json found');
        
        if (hasNoDeps && hasNoDevDeps) {
            console.log('   ✅ Correctly configured (no dependencies - uses root)\n');
            return true;
        } else {
            console.log('   ⚠️  Contains dependencies (should use root dependencies)\n');
            return true; // Not critical, just suboptimal
        }
    } catch (error) {
        console.log('❌ Failed to read backend/package.json\n');
        return false;
    }
}

// Check frontend package.json structure
function checkFrontendPackage() {
    try {
        const packageJson = JSON.parse(readFileSync(join(__dirname, 'frontend/package.json'), 'utf8'));
        const hasNoDeps = !packageJson.dependencies || Object.keys(packageJson.dependencies).length === 0;
        const hasNoDevDeps = !packageJson.devDependencies || Object.keys(packageJson.devDependencies).length === 0;
        
        console.log('✅ Frontend package.json found');
        
        if (hasNoDeps && hasNoDevDeps) {
            console.log('   ✅ Correctly configured (no dependencies - uses root)\n');
            return true;
        } else {
            console.log('   ⚠️  Contains dependencies (should use root dependencies)\n');
            return true; // Not critical, just suboptimal
        }
    } catch (error) {
        console.log('❌ Failed to read frontend/package.json\n');
        return false;
    }
}

// Test dependency resolution
function testDependencyResolution() {
    console.log('🧪 Testing dependency resolution...\n');
    
    const testModules = [
        { name: 'express', location: 'backend' },
        { name: 'react', location: 'frontend' },
        { name: 'cors', location: 'backend' },
        { name: 'mongodb', location: 'backend' }
    ];
    
    let allResolved = true;
    
    for (const module of testModules) {
        try {
            // Test if module can be required from its respective location
            const modulePath = join(__dirname, module.location);
            process.chdir(modulePath);
            
            // Check if the module exists in root node_modules
            const rootNodeModules = join(__dirname, 'node_modules', module.name);
            
            try {
                readFileSync(join(rootNodeModules, 'package.json'));
                console.log(`   ✅ ${module.name} accessible from ${module.location}`);
            } catch {
                console.log(`   ❌ ${module.name} NOT accessible from ${module.location}`);
                allResolved = false;
            }
        } catch (error) {
            console.log(`   ❌ Error testing ${module.name}: ${error.message}`);
            allResolved = false;
        }
    }
    
    // Reset working directory
    process.chdir(__dirname);
    
    console.log('');
    return allResolved;
}

// Main verification
async function main() {
    const results = [
        checkRootPackage(),
        checkBackendPackage(),
        checkFrontendPackage(),
        testDependencyResolution()
    ];
    
    const allPassed = results.every(result => result === true);
    
    console.log('📊 VERIFICATION SUMMARY');
    console.log('='.repeat(50));
    
    if (allPassed) {
        console.log('🎉 All checks passed! Consolidated package structure is working correctly.');
        console.log('\n💡 Quick start commands:');
        console.log('   npm run dev      # Run both backend & frontend');
        console.log('   npm run backend  # Run backend only');
        console.log('   npm run frontend # Run frontend only');
        console.log('   npm start        # Run backend in production mode');
        process.exit(0);
    } else {
        console.log('⚠️  Some issues were found. Please check the output above.');
        console.log('\n🔧 Try running: npm run setup');
        process.exit(1);
    }
}

main().catch(console.error);
