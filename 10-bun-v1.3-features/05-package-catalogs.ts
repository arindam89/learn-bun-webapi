/**
 * Bun 1.3 Package Catalogs - Advanced Package Management
 *
 * This example demonstrates Bun's new package catalog feature that provides
 * centralized version management, dependency resolution optimization, and
 * improved monorepo support.
 *
 * Features shown:
 * - Package catalog configuration
 * - Version constraint management
 * - Dependency optimization
 * - Monorepo workspace management
 * - Package aliasing and overrides
 * - Scoped package management
 * - Runtime package resolution
 * - Catalog-based dependency updates
 */

import { spawn } from 'child_process';
import { writeFile, readFile, exists } from 'fs/promises';
import { join, dirname } from 'path';

// Example 1: Package catalog configuration
async function packageCatalogExample() {
  console.log('\n=== Package Catalog Configuration ===');

  // Create a comprehensive package.json with catalog
  const packageJson = {
    name: 'bun-v13-catalog-demo',
    version: '1.0.0',
    type: 'module',
    scripts: {
      dev: 'bun run index.ts',
      build: 'bun build ./src/index.ts --outdir ./dist',
      test: 'bun test',
      'catalog:update': 'bun update --catalog',
      'catalog:check': 'bun pm ls --catalog',
    },
    workspaces: [
      'packages/*',
      'apps/*'
    ],
    // New Bun 1.3 package catalog feature
    catalog: {
      // Define versions for commonly used packages
      versions: {
        'react': '^18.2.0',
        'react-dom': '^18.2.0',
        'typescript': '^5.2.0',
        'zod': '^3.22.0',
        '@types/react': '^18.2.0',
        '@types/react-dom': '^18.2.0',
        'eslint': '^8.50.0',
        'prettier': '^3.0.0',
        'vitest': '^0.34.0',
        '@vitest/ui': '^0.34.0',
        'hono': '^3.12.0',
        'bcrypt': '^5.1.0',
        'jsonwebtoken': '^9.0.0',
        'helmet': '^7.1.0',
        'cors': '^2.8.5',
      },
      // Override versions for specific environments
      overrides: {
        'development': {
          'react': '18.2.0',
          'typescript': '5.2.2',
        },
        'production': {
          'react': '18.2.0',
          'typescript': '5.2.0',
        }
      },
      // Package aliases for migration or compatibility
      aliases: {
        'old-package': 'new-package',
        'legacy-utils': 'modern-utils@^2.0.0',
        'react-router-dom': 'react-router@^6.15.0'
      }
    },
    // Dependencies now reference catalog versions
    dependencies: {
      'react': 'catalog:react',
      'react-dom': 'catalog:react-dom',
      'hono': 'catalog:hono',
      'zod': 'catalog:zod',
      'bcrypt': 'catalog:bcrypt',
      'jsonwebtoken': 'catalog:jsonwebtoken',
    },
    devDependencies: {
      'typescript': 'catalog:typescript',
      '@types/react': 'catalog:@types/react',
      '@types/react-dom': 'catalog:@types/react-dom',
      'eslint': 'catalog:eslint',
      'prettier': 'catalog:prettier',
      'vitest': 'catalog:vitest',
      '@vitest/ui': 'catalog:@vitest/ui',
    },
    peerDependencies: {
      'helmet': 'catalog:helmet',
      'cors': 'catalog:cors',
    }
  };

  await writeFile('package.json', JSON.stringify(packageJson, null, 2));
  console.log('✅ Created package.json with catalog configuration');

  // Create bun.lockb (simulated catalog usage)
  console.log('📦 Package catalog allows:');
  console.log('   • Centralized version management');
  console.log('   • Consistent versions across workspaces');
  console.log('   • Environment-specific overrides');
  console.log('   • Package aliasing for migration');
  console.log('   • Optimized dependency resolution');
}

// Example 2: Monorepo workspace management
async function monorepoWorkspaceExample() {
  console.log('\n=== Monorepo Workspace Management ===');

  // Create workspace configuration
  const workspaceConfig = {
    name: 'bun-monorepo',
    version: '1.0.0',
    private: true,
    workspaces: [
      'packages/*',
      'apps/*',
      'tools/*'
    ],
    catalog: {
      versions: {
        'typescript': '^5.2.0',
        'zod': '^3.22.0',
        'hono': '^3.12.0',
        'bun-types': '^1.0.0',
      },
      shared: {
        // Shared dependencies across all workspaces
        dependencies: ['typescript', 'zod'],
        devDependencies: ['bun-types'],
      },
      workspace: {
        // Workspace-specific catalogs
        'packages/api': {
          'hono': '^3.12.0',
          'zod': '^3.22.0',
        },
        'packages/ui': {
          'react': '^18.2.0',
          'react-dom': '^18.2.0',
        },
        'apps/web': {
          'react': '^18.2.0',
          'hono': '^3.12.0',
        }
      }
    }
  };

  await writeFile(join('packages', 'package.json'), JSON.stringify(workspaceConfig, null, 2));
  console.log('✅ Created monorepo workspace configuration');

  // Example package structure
  const apiPackage = {
    name: '@monorepo/api',
    version: '1.0.0',
    main: './dist/index.js',
    types: './dist/index.d.ts',
    scripts: {
      build: 'bun build ./src/index.ts --outdir ./dist',
      dev: 'bun --hot run ./src/index.ts',
    },
    dependencies: {
      'hono': 'catalog:hono',
      'zod': 'catalog:zod',
    },
    devDependencies: {
      'typescript': 'catalog:typescript',
    }
  };

  await writeFile(join('packages', 'api', 'package.json'), JSON.stringify(apiPackage, null, 2));
  console.log('✅ Created API package with catalog dependencies');

  // Create shared utilities package
  const sharedPackage = {
    name: '@monorepo/shared',
    version: '1.0.0',
    main: './dist/index.js',
    types: './dist/index.d.ts',
    scripts: {
      build: 'bun build ./src/index.ts --outdir ./dist',
    },
    dependencies: {
      'zod': 'catalog:zod',
    },
    devDependencies: {
      'typescript': 'catalog:typescript',
    }
  };

  await writeFile(join('packages', 'shared', 'package.json'), JSON.stringify(sharedPackage, null, 2));
  console.log('✅ Created shared utilities package');
}

// Example 3: Package catalog manager class
class PackageCatalogManager {
  private catalog: any;
  private workspace: string;

  constructor(workspace: string = '.') {
    this.workspace = workspace;
  }

  async loadCatalog(): Promise<void> {
    try {
      const packageJsonPath = join(this.workspace, 'package.json');
      const packageJsonContent = await readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(packageJsonContent);
      this.catalog = packageJson.catalog || { versions: {}, overrides: {} };
    } catch (error) {
      console.error('❌ Failed to load package catalog:', error.message);
      this.catalog = { versions: {}, overrides: {} };
    }
  }

  getVersion(packageName: string, environment?: string): string | null {
    if (!this.catalog) return null;

    // Check environment-specific overrides first
    if (environment && this.catalog.overrides?.[environment]?.[packageName]) {
      return this.catalog.overrides[environment][packageName];
    }

    // Check main catalog versions
    return this.catalog.versions?.[packageName] || null;
  }

  updateVersion(packageName: string, version: string, environment?: string): void {
    if (!this.catalog) {
      this.catalog = { versions: {}, overrides: {} };
    }

    if (environment) {
      if (!this.catalog.overrides) {
        this.catalog.overrides = {};
      }
      if (!this.catalog.overrides[environment]) {
        this.catalog.overrides[environment] = {};
      }
      this.catalog.overrides[environment][packageName] = version;
    } else {
      this.catalog.versions[packageName] = version;
    }
  }

  getCatalogSummary(): any {
    return {
      totalPackages: Object.keys(this.catalog?.versions || {}).length,
      hasOverrides: Object.keys(this.catalog?.overrides || {}).length > 0,
      environments: Object.keys(this.catalog?.overrides || {}),
      packages: this.catalog?.versions || {},
      aliases: this.catalog?.aliases || {},
    };
  }

  async saveCatalog(): Promise<void> {
    try {
      const packageJsonPath = join(this.workspace, 'package.json');
      const packageJsonContent = await readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(packageJsonContent);

      packageJson.catalog = this.catalog;
      await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    } catch (error) {
      console.error('❌ Failed to save package catalog:', error.message);
    }
  }

  // Check for outdated packages in catalog
  async checkOutdated(): Promise<any[]> {
    const packages = Object.keys(this.catalog?.versions || {});
    const outdated = [];

    for (const pkg of packages) {
      try {
        // Simulate checking latest version (in real implementation, this would call npm registry)
        const currentVersion = this.catalog.versions[pkg];
        const latestVersion = await this.getLatestVersion(pkg);

        if (this.isNewerVersion(latestVersion, currentVersion)) {
          outdated.push({
            name: pkg,
            current: currentVersion,
            latest: latestVersion,
            updateAvailable: true,
          });
        }
      } catch (error) {
        console.warn(`⚠️  Could not check version for ${pkg}:`, error.message);
      }
    }

    return outdated;
  }

  private async getLatestVersion(packageName: string): Promise<string> {
    // Simulate API call to npm registry
    // In a real implementation, this would fetch from registry.npmjs.org
    const mockVersions: Record<string, string> = {
      'react': '18.3.0',
      'typescript': '5.3.0',
      'zod': '3.23.0',
      'hono': '3.15.0',
    };
    return mockVersions[packageName] || '1.0.0';
  }

  private isNewerVersion(latest: string, current: string): boolean {
    const parseVersion = (version: string): number[] => {
      return version.replace(/^[\^~]/, '').split('.').map(Number);
    };

    const latestParts = parseVersion(latest);
    const currentParts = parseVersion(current);

    for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
      const latestPart = latestParts[i] || 0;
      const currentPart = currentParts[i] || 0;

      if (latestPart > currentPart) return true;
      if (latestPart < currentPart) return false;
    }

    return false;
  }
}

// Example 4: Runtime package resolution with catalog
class CatalogAwareResolver {
  private catalogManager: PackageCatalogManager;

  constructor(workspace: string) {
    this.catalogManager = new PackageCatalogManager(workspace);
  }

  async resolveDependency(packageName: string): Promise<string> {
    await this.catalogManager.loadCatalog();

    const environment = process.env.NODE_ENV || 'development';
    const version = this.catalogManager.getVersion(packageName, environment);

    if (!version) {
      console.warn(`⚠️  Package ${packageName} not found in catalog`);
      return packageName; // Fallback to package name only
    }

    // Handle catalog references
    if (version.startsWith('catalog:')) {
      const catalogPackage = version.replace('catalog:', '');
      const catalogVersion = this.catalogManager.getVersion(catalogPackage, environment);
      return catalogVersion ? `${catalogPackage}@${catalogVersion}` : catalogPackage;
    }

    return `${packageName}@${version}`;
  }

  async installWithCatalog(packages: string[]): Promise<void> {
    console.log('📦 Installing packages using catalog versions...');

    const resolvedPackages: string[] = [];
    for (const pkg of packages) {
      const resolved = await this.resolveDependency(pkg);
      resolvedPackages.push(resolved);
      console.log(`   ${pkg} → ${resolved}`);
    }

    // Simulate bun install with resolved packages
    console.log(`\n🚀 Running: bun add ${resolvedPackages.join(' ')}`);

    // In a real implementation, this would spawn bun process
    // spawn('bun', ['add', ...resolvedPackages], { stdio: 'inherit' });
  }
}

// Example 5: Catalog-based build optimization
class CatalogAwareBuilder {
  private catalogManager: PackageCatalogManager;

  constructor(workspace: string) {
    this.catalogManager = new PackageCatalogManager(workspace);
  }

  async optimizeDependencies(): Promise<any> {
    console.log('\n=== Optimizing Dependencies with Catalog ===');

    await this.catalogManager.loadCatalog();
    const summary = this.catalogManager.getCatalogSummary();

    console.log(`📊 Catalog Summary:`);
    console.log(`   • Total managed packages: ${summary.totalPackages}`);
    console.log(`   • Environments configured: ${summary.environments.join(', ') || 'None'}`);
    console.log(`   • Package aliases: ${Object.keys(summary.aliases).length}`);

    // Analyze dependency tree
    const analysis = {
      totalSize: 0,
      duplicates: [],
      optimizations: [],
    };

    // Simulate dependency analysis
    const commonDependencies = ['react', 'typescript', 'zod'];
    for (const dep of commonDependencies) {
      const version = this.catalogManager.getVersion(dep);
      if (version) {
        console.log(`   ✅ ${dep}: ${version} (catalog managed)`);
        analysis.optimizations.push({
          package: dep,
          benefit: 'Consistent version across workspaces',
        });
      }
    }

    return analysis;
  }

  async generateBundleAnalysis(): Promise<void> {
    console.log('\n=== Bundle Analysis with Catalog ===');

    await this.catalogManager.loadCatalog();
    const outdated = await this.catalogManager.checkOutdated();

    if (outdated.length > 0) {
      console.log('🔄 Outdated packages found:');
      outdated.forEach(pkg => {
        console.log(`   • ${pkg.name}: ${pkg.current} → ${pkg.latest}`);
      });
    } else {
      console.log('✅ All catalog packages are up to date');
    }

    // Generate update suggestions
    const updateCommands = outdated.map(pkg =>
      `bun catalog update ${pkg.name}@${pkg.latest}`
    );

    if (updateCommands.length > 0) {
      console.log('\n💡 Suggested update commands:');
      updateCommands.forEach(cmd => console.log(`   ${cmd}`));
    }
  }
}

// Example 6: Environment-specific catalog usage
async function environmentSpecificCatalog() {
  console.log('\n=== Environment-Specific Catalog Usage ===');

  const envManager = new PackageCatalogManager('.');
  await envManager.loadCatalog();

  // Set different versions for different environments
  envManager.updateVersion('typescript', '^5.2.0', 'development');
  envManager.updateVersion('typescript', '5.2.0', 'production');
  envManager.updateVersion('react', '^18.3.0-canary.0', 'staging');

  // Demonstrate environment resolution
  const environments = ['development', 'staging', 'production'];
  const packages = ['typescript', 'react'];

  environments.forEach(env => {
    console.log(`\n📋 ${env.toUpperCase()} environment:`);
    packages.forEach(pkg => {
      const version = envManager.getVersion(pkg, env);
      console.log(`   ${pkg}: ${version || 'Not specified'}`);
    });
  });

  await envManager.saveCatalog();
}

// Example 7: Advanced catalog features
async function advancedCatalogFeatures() {
  console.log('\n=== Advanced Catalog Features ===');

  // Create a complex catalog configuration
  const advancedCatalog = {
    catalog: {
      versions: {
        'express': '^4.18.0',
        'mongoose': '^7.5.0',
        'jsonwebtoken': '^9.0.0',
        'helmet': '^7.1.0',
        'cors': '^2.8.5',
      },
      // Scoped catalogs for different teams
      scopes: {
        '@frontend/*': {
          'react': '^18.2.0',
          'typescript': '^5.2.0',
        },
        '@backend/*': {
          'express': 'catalog:express',
          'mongoose': 'catalog:mongoose',
        },
        '@shared/*': {
          'zod': '^3.22.0',
          'jsonwebtoken': 'catalog:jsonwebtoken',
        }
      },
      // Constraint-based versioning
      constraints: {
        compatibility: {
          'react': '>=18.0.0 <19.0.0',
          'node': '>=18.0.0',
          'bun': '>=1.0.0',
        },
        security: {
          // Only allow packages with no known vulnerabilities
          'lodash': '>=4.17.21', // Fixed security vulnerabilities
          'axios': '>=1.4.0', // Security fixes
        }
      },
      // Integration-specific requirements
      integrations: {
        'nextjs': {
          'react': '18.2.0',
          'react-dom': '18.2.0',
        },
        'nestjs': {
          '@nestjs/core': '^10.0.0',
          '@nestjs/common': '^10.0.0',
        }
      }
    }
  };

  console.log('🔧 Advanced catalog features:');
  console.log('   • Scoped package management for teams');
  console.log('   • Constraint-based versioning');
  console.log('   • Integration-specific requirements');
  console.log('   • Security-focused constraints');
  console.log('   • Team-based workflow optimization');
}

// Example 8: Catalog utilities and CLI simulation
class CatalogCLI {
  private catalogManager: PackageCatalogManager;

  constructor(workspace: string) {
    this.catalogManager = new PackageCatalogManager(workspace);
  }

  async list(): Promise<void> {
    await this.catalogManager.loadCatalog();
    const summary = this.catalogManager.getCatalogSummary();

    console.log('\n📦 Package Catalog Contents:');
    Object.entries(summary.packages).forEach(([name, version]) => {
      console.log(`   ${name}@${version}`);
    });

    if (Object.keys(summary.aliases).length > 0) {
      console.log('\n🔄 Package Aliases:');
      Object.entries(summary.aliases).forEach(([alias, target]) => {
        console.log(`   ${alias} → ${target}`);
      });
    }
  }

  async add(packageName: string, version: string): Promise<void> {
    await this.catalogManager.loadCatalog();
    this.catalogManager.updateVersion(packageName, version);
    await this.catalogManager.saveCatalog();
    console.log(`✅ Added ${packageName}@${version} to catalog`);
  }

  async update(packageName: string, newVersion: string): Promise<void> {
    await this.catalogManager.loadCatalog();
    this.catalogManager.updateVersion(packageName, newVersion);
    await this.catalogManager.saveCatalog();
    console.log(`✅ Updated ${packageName} to ${newVersion} in catalog`);
  }

  async sync(): Promise<void> {
    console.log('🔄 Syncing catalog with workspaces...');
    // Simulate syncing catalog versions across all workspaces
    console.log('✅ Catalog synced successfully');
  }

  async clean(): Promise<void> {
    console.log('🧹 Cleaning unused catalog entries...');
    // Simulate cleanup of unused packages
    console.log('✅ Catalog cleaned');
  }
}

// Main execution
async function main() {
  console.log('🚀 Bun 1.3 Package Catalogs Demo');

  try {
    // Basic catalog configuration
    await packageCatalogExample();

    // Monorepo workspace management
    await monorepoWorkspaceExample();

    // Catalog manager demonstration
    const catalogManager = new PackageCatalogManager('.');
    await catalogManager.loadCatalog();
    catalogManager.updateVersion('react', '^18.2.0');
    catalogManager.updateVersion('typescript', '^5.2.0', 'development');

    const summary = catalogManager.getCatalogSummary();
    console.log('\n📊 Catalog Summary:', summary);

    // Runtime dependency resolution
    const resolver = new CatalogAwareResolver('.');
    await resolver.installWithCatalog(['react', 'typescript']);

    // Build optimization
    const builder = new CatalogAwareBuilder('.');
    await builder.optimizeDependencies();
    await builder.generateBundleAnalysis();

    // Environment-specific usage
    await environmentSpecificCatalog();

    // Advanced features
    await advancedCatalogFeatures();

    // CLI simulation
    const cli = new CatalogCLI('.');
    await cli.list();
    await cli.add('zod', '^3.22.0');
    await cli.sync();

    console.log('\n✨ Package catalogs demonstration completed!');
    console.log('\n💡 Key benefits of Bun 1.3 package catalogs:');
    console.log('   • Centralized version management');
    console.log('   • Consistent dependencies across monorepos');
    console.log('   • Environment-specific optimization');
    console.log('   • Reduced bundle sizes through deduplication');
    console.log('   • Team-based workflow optimization');
    console.log('   • Security-focused constraint management');

  } catch (error) {
    console.error('❌ Package catalogs error:', error.message);
  }
}

main().catch(error => {
  console.error('❌ Application error:', error);
  process.exit(1);
});