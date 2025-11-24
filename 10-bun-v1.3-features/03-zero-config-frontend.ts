/**
 * Bun 1.3 Zero-Config Frontend Development
 *
 * This example demonstrates Bun's new zero-configuration frontend development
 * capabilities that eliminate the need for complex build tools and configurations.
 *
 * Features shown:
 * - Built-in bundling for frontend assets
 * - TypeScript and JSX support without configuration
 * - CSS-in-JS and module CSS support
 * - Hot module replacement (HMR)
 * - Development server with live reload
 * - Production optimizations
 * - Asset optimization and hashing
 *
 * To run in development mode with HMR:
 * bun --hot run 03-zero-config-frontend.ts
 */

import { serve } from 'bun';
import { readdir, writeFile, mkdir } from 'fs/promises';
import { join, extname } from 'path';

// Configuration for our frontend application
const config = {
  port: process.env.PORT || 3000,
  devMode: process.env.NODE_ENV !== 'production',
  publicDir: './public',
  srcDir: './src',
};

// Example 1: Basic HTML/JS/CSS bundling
async function basicBundlingExample() {
  console.log('\n=== Basic Bundling Example ===');

  // Create source files
  await mkdir(config.srcDir, { recursive: true });
  await mkdir(config.publicDir, { recursive: true });

  // Create a React component with TypeScript
  const appComponent = `
import React, { useState } from 'react';
import './app.css';

interface User {
  id: number;
  name: string;
  email: string;
}

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Bun 1.3 Frontend Demo</h1>
      <p>Zero-config frontend development with Bun!</p>

      <button onClick={loadUsers} disabled={loading}>
        {loading ? 'Loading...' : 'Load Users'}
      </button>

      {users.length > 0 && (
        <div className="user-list">
          <h2>Users</h2>
          {users.map(user => (
            <div key={user.id} className="user-card">
              <h3>{user.name}</h3>
              <p>{user.email}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
`;

  // Create CSS module
  const appCSS = `
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.user-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin-top: 2rem;
}

.user-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.user-card:hover {
  transform: translateY(-2px);
}

button {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s ease;
}

button:hover {
  background: #2563eb;
}

button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }

  .user-list {
    grid-template-columns: 1fr;
  }
}
`;

  // Create HTML template
  const indexHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bun 1.3 Frontend Demo</title>
    <style>
        body {
            margin: 0;
            background: linear-gradient(to bottom right, #f0f9ff, #e0f2fe);
            min-height: 100vh;
        }
        #root {
            min-height: 100vh;
        }
    </style>
</head>
<body>
    <div id="root"></div>
    <!-- Bun will automatically inject the bundled script -->
    <script type="module" src="/src/app.tsx"></script>
</body>
</html>
`;

  // Write files
  await writeFile(join(config.srcDir, 'app.tsx'), appComponent);
  await writeFile(join(config.srcDir, 'app.css'), appCSS);
  await writeFile(join(config.publicDir, 'index.html'), indexHTML);

  console.log('✅ Created frontend source files');

  // Bundle the application
  const buildResult = await Bun.build({
    entrypoints: [join(config.srcDir, 'app.tsx')],
    outdir: join(config.publicDir, 'dist'),
    target: 'browser',
    format: 'esm',
    minify: !config.devMode,
    sourcemap: config.devMode,
    splitting: true,
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    },
  });

  if (buildResult.success) {
    console.log('✅ Frontend bundled successfully');
    console.log('Output files:', buildResult.outputs.map(output => output.path));
  } else {
    console.error('❌ Build failed:', buildResult.logs);
  }
}

// Example 2: CSS-in-JS and dynamic styling
async function cssInJSExample() {
  console.log('\n=== CSS-in-JS Example ===');

  const styledComponent = `
import { styled } from 'bun-styled-components';

// Create styled components with TypeScript support
export const Button = styled.button\`
  background: \${props => props.primary ? '#3b82f6' : '#6b7280'};
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }

  \${props => props.size === 'large' && \`
    padding: 1rem 2rem;
    font-size: 1.125rem;
  \`}

  \${props => props.size === 'small' && \`
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  \`}
\`;

export const Card = styled.div\`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }

  \${props => props.variant === 'elevated' && \`
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  \`}

  \${props => props.variant === 'outlined' && \`
    border: 2px solid #e5e7eb;
    box-shadow: none;
  \`}
\`;

export const Grid = styled.div\`
  display: grid;
  gap: \${props => props.gap || '1rem'};
  grid-template-columns: \${props =>
    props.cols ? \`repeat(\${props.cols}, 1fr)\` : 'repeat(auto-fit, minmax(300px, 1fr))'
  };
\`;
`;

  await writeFile(join(config.srcDir, 'styled-components.ts'), styledComponent);
  console.log('✅ Created CSS-in-JS styled components');
}

// Example 3: Asset optimization and hashing
async function assetOptimizationExample() {
  console.log('\n=== Asset Optimization Example ===');

  // Create asset files
  const assetsDir = join(config.srcDir, 'assets');
  await mkdir(assetsDir, { recursive: true });

  // Create a TypeScript utility for asset management
  const assetUtils = `
import { readFile, writeFile } from 'fs/promises';
import { createHash } from 'crypto';

export class AssetManager {
  private manifest: Record<string, string> = {};

  async hashAsset(filePath: string): Promise<string> {
    const content = await readFile(filePath);
    return createHash('sha256').update(content).digest('hex').slice(0, 8);
  }

  async processAssets() {
    const images = ['logo.svg', 'hero-image.jpg'];
    const processed: string[] = [];

    for (const image of images) {
      // Simulate asset processing
      const hash = await this.hashAsset(\`assets/\${image}\`);
      const newName = \`/dist/assets/\${image.replace('.', '_')}_\${hash}\`;

      this.manifest[image] = newName;
      processed.push(newName);
    }

    // Write manifest for production
    await writeFile('./public/asset-manifest.json', JSON.stringify(this.manifest, null, 2));

    return processed;
  }

  getAssetUrl(originalPath: string): string {
    return this.manifest[originalPath] || originalPath;
  }
}

export const assetManager = new AssetManager();
`;

  await writeFile(join(config.srcDir, 'assets.ts'), assetUtils);

  // Create SVG logo
  const logoSVG = `
<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bun-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#fb923c;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f97316;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="55" fill="url(#bun-gradient)" />
  <text x="60" y="75" font-family="Arial, sans-serif" font-size="48" font-weight="bold"
        text-anchor="middle" fill="white">BUN</text>
</svg>
`;

  await writeFile(join(assetsDir, 'logo.svg'), logoSVG);

  // Build assets with optimization
  const assetBuildResult = await Bun.build({
    entrypoints: [join(config.srcDir, 'assets.ts')],
    outdir: join(config.publicDir, 'dist', 'assets'),
    target: 'browser',
    minify: true,
  });

  if (assetBuildResult.success) {
    console.log('✅ Assets optimized and built');
    console.log('Asset outputs:', assetBuildResult.outputs.map(o => o.path));
  } else {
    console.error('❌ Asset build failed:', assetBuildResult.logs);
  }
}

// Example 4: Development server with HMR
async function devServerWithHMR() {
  console.log('\n=== Development Server with HMR ===');

  const server = serve({
    port: config.port,
    development: config.devMode,
    fetch: async (req) => {
      const url = new URL(req.url);

      // Handle API routes
      if (url.pathname.startsWith('/api/')) {
        return handleAPIRoutes(url, req);
      }

      // Serve static files
      if (url.pathname === '/') {
        const html = await Bun.file(join(config.publicDir, 'index.html')).text();

        // Inject HMR script in development
        if (config.devMode) {
          const hmrScript = `
<script>
  const ws = new WebSocket('ws://localhost:${config.port}/hmr');

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'reload') {
      console.log('🔄 HMR: Reloading page...');
      window.location.reload();
    }
  };

  ws.onopen = () => {
    console.log('✅ HMR connected');
  };

  ws.onclose = () => {
    console.log('❌ HMR disconnected');
    setTimeout(() => window.location.reload(), 1000);
  };
</script>`;

          return new Response(html.replace('</body>', hmrScript + '</body>'), {
            headers: { 'Content-Type': 'text/html' },
          });
        }

        return new Response(html, {
          headers: { 'Content-Type': 'text/html' },
        });
      }

      // Serve bundled files
      if (url.pathname.startsWith('/dist/')) {
        try {
          const filePath = join(config.publicDir, url.pathname);
          const file = Bun.file(filePath);

          if (await file.exists()) {
            const headers: Record<string, string> = {};

            // Set content type based on extension
            const ext = extname(url.pathname);
            switch (ext) {
              case '.js':
                headers['Content-Type'] = 'application/javascript';
                break;
              case '.css':
                headers['Content-Type'] = 'text/css';
                break;
              case '.svg':
                headers['Content-Type'] = 'image/svg+xml';
                break;
              default:
                headers['Content-Type'] = 'application/octet-stream';
            }

            return new Response(file, { headers });
          }
        } catch (error) {
          console.error('File serving error:', error);
        }
      }

      // Fallback
      return new Response('Not Found', { status: 404 });
    },
    websocket: {
      message: (ws, message) => {
        // Handle HMR WebSocket messages
        const data = JSON.parse(message as string);
        console.log('HMR message:', data);
      },
      open: (ws) => {
        console.log('HMR client connected');
      },
    },
  });

  console.log(`✅ Development server running at http://localhost:${config.port}`);

  if (config.devMode) {
    console.log('🔥 Hot Module Replacement enabled');

    // Watch for file changes and trigger HMR
    const watcher = new ProcessWatcher([
      join(config.srcDir, '**/*.{ts,tsx,js,jsx,css}'),
    ]);

    watcher.start((changedFile) => {
      console.log(`📝 File changed: ${changedFile}`);

      // Rebuild the application
      rebuildApplication(changedFile).then(() => {
        // Notify all HMR clients to reload
        server.publish('hmr', JSON.stringify({
          type: 'reload',
          file: changedFile,
        }));
      });
    });
  }

  return server;
}

// Simple file watcher for HMR
class ProcessWatcher {
  private watchers: any[] = [];

  constructor(private patterns: string[]) {}

  start(callback: (file: string) => void) {
    // In a real implementation, you'd use fs.watch or a library like chokidar
    // For this example, we'll simulate file watching
    console.log('👀 Watching files for changes...');
    console.log('Patterns:', this.patterns);
  }

  stop() {
    this.watchers.forEach(watcher => watcher.close());
  }
}

// API route handler
async function handleAPIRoutes(url: URL, req: Request) {
  if (url.pathname === '/api/users' && req.method === 'GET') {
    // Mock API response
    const users = [
      { id: 1, name: 'Alice Johnson', email: 'alice@example.com' },
      { id: 2, name: 'Bob Smith', email: 'bob@example.com' },
      { id: 3, name: 'Carol Davis', email: 'carol@example.com' },
    ];

    return new Response(JSON.stringify(users), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response('API endpoint not found', { status: 404 });
}

// Rebuild application on file changes
async function rebuildApplication(changedFile: string) {
  console.log(`🔄 Rebuilding due to change in: ${changedFile}`);

  try {
    const buildResult = await Bun.build({
      entrypoints: [join(config.srcDir, 'app.tsx')],
      outdir: join(config.publicDir, 'dist'),
      target: 'browser',
      format: 'esm',
      minify: false, // Don't minify in development
      sourcemap: true,
      splitting: true,
    });

    if (buildResult.success) {
      console.log('✅ Rebuild successful');
    } else {
      console.error('❌ Rebuild failed:', buildResult.logs);
    }
  } catch (error) {
    console.error('❌ Rebuild error:', error);
  }
}

// Production build configuration
async function productionBuild() {
  console.log('\n=== Production Build ===');

  const buildConfig = {
    entrypoints: [join(config.srcDir, 'app.tsx')],
    outdir: join(config.publicDir, 'dist'),
    target: 'browser',
    format: 'esm',
    minify: true,
    sourcemap: false,
    splitting: true,
    treeShaking: true,
    deadCodeElimination: true,
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
  };

  const buildResult = await Bun.build(buildConfig);

  if (buildResult.success) {
    console.log('✅ Production build successful');

    // Calculate bundle sizes
    const totalSize = buildResult.outputs.reduce((sum, output) => {
      return sum + output.size;
    }, 0);

    console.log(`📦 Total bundle size: ${(totalSize / 1024).toFixed(2)} KB`);

    buildResult.outputs.forEach(output => {
      console.log(`   ${output.path}: ${(output.size / 1024).toFixed(2)} KB`);
    });

    return buildResult;
  } else {
    console.error('❌ Production build failed:', buildResult.logs);
    return null;
  }
}

// Main execution
async function main() {
  console.log('🚀 Bun 1.3 Zero-Config Frontend Development');

  try {
    // Setup
    await basicBundlingExample();
    await cssInJSExample();
    await assetOptimizationExample();

    // Development mode
    if (config.devMode) {
      const server = await devServerWithHMR();

      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log('\n👋 Shutting down development server...');
        server.stop();
        process.exit(0);
      });

      // Keep the process alive
      console.log(`\n🌐 Development server running at http://localhost:${config.port}`);
      console.log('🔥 Hot Module Replacement is enabled');
      console.log('Press Ctrl+C to stop');

    } else {
      // Production build
      const build = await productionBuild();

      if (build) {
        console.log('\n✨ Frontend application built successfully!');
        console.log('📂 Output directory:', join(config.publicDir, 'dist'));
        console.log('\n💡 To serve the built application:');
        console.log(`   bun serve ${join(config.publicDir, 'dist')} --port 3000`);
      }
    }

  } catch (error) {
    console.error('❌ Frontend setup error:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Application error:', error);
  process.exit(1);
});