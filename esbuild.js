/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path'); // Add this line to import the 'path' module

const polyfill = require('@esbuild-plugins/node-globals-polyfill');
const esbuild = require('esbuild');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

// Plugin to copy fixture files
const copyFixturesPlugin = {
    name: 'copy-fixtures',
    setup(build) {
        build.onEnd(() => {
            if (production) {
                return;
            }
            const srcDir = path.resolve(__dirname, 'test/fixtures');
            const outDir = path.resolve(__dirname, 'out/test/fixtures');

            // Ensure the output directory exists
            if (!fs.existsSync(outDir)) {
                fs.mkdirSync(outDir, { recursive: true });
            }

            // Copy files from src/test/fixtures to out/test/fixtures
            fs.cpSync(srcDir, outDir, { recursive: true });
            console.log('Fixtures copied successfully!');
        });
    },
};

async function main() {
    const outDir = path.resolve(__dirname, 'out');
    if (fs.existsSync(outDir)) {
        fs.rmSync(outDir, { recursive: true, force: true });
    }

    const entryPoints = [{ in: 'src/MythicScribe.ts', out: 'MythicScribe' }];
    if (!production) {
        entryPoints.push({ in: 'test/node/runTests.ts', out: 'test/runTests' });
        entryPoints.push({ in: 'test/node/index.ts', out: 'test/index' });
        const testSuiteDir = path.resolve(__dirname, 'test/node/suite');
        const testFiles = fs.readdirSync(testSuiteDir).map((file) => ({
            in: path.join(testSuiteDir, file),
            out: path.join('test/suite', file.replace(/\.ts$/, '')),
        }));
        entryPoints.push(...testFiles);
    }
    const ctx = await esbuild.context({
        entryPoints: entryPoints,
        bundle: true,
        format: 'cjs',
        minify: production,
        sourcemap: !production,
        sourcesContent: false,
        platform: 'node',
        outdir: 'out/node',
        external: ['vscode'],
        logLevel: 'silent',
        plugins: [esbuildProblemMatcherPlugin, copyFixturesPlugin],
        alias: {
            path: 'path-browserify',
            '@declarations': '@node',
        },
        define: {
            'process.env.RUNTIME_ENV': JSON.stringify('node'),
        },
    });
    const web = await esbuild.context({
        entryPoints: ['src/MythicScribe.ts'],
        bundle: true,
        format: 'cjs',
        minify: production,
        sourcemap: !production,
        sourcesContent: false,
        platform: 'browser',
        outfile: 'out/web/MythicScribe.js',
        external: ['vscode'],
        logLevel: 'silent',
        plugins: [
            esbuildProblemMatcherPlugin,
            polyfill.NodeGlobalsPolyfillPlugin({
                process: true,
                buffer: true,
            }),
        ],
        alias: {
            path: 'path-browserify',
            '@declarations': '@web',
        },
        define: {
            global: 'globalThis',
            'process.env.RUNTIME_ENV': JSON.stringify('web'),
        },
    });

    if (watch) {
        await ctx.watch();
    } else {
        await ctx.rebuild();
        await ctx.dispose();
        await web.rebuild();
        await web.dispose();
    }
}

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
    name: 'esbuild-problem-matcher',

    setup(build) {
        build.onStart(() => {
            console.log('[watch] build started');
        });
        build.onEnd((result) => {
            result.errors.forEach(({ text, location }) => {
                console.error(`✘ [ERROR] ${text}`);
                console.error(`    ${location.file}:${location.line}:${location.column}:`);
            });
            console.log('[watch] build finished');
        });
    },
};

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
