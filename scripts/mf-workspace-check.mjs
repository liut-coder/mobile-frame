import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const workspaceRoots = ['apps', 'packages', 'templates', 'tools'];
const errors = [];

const rootTsconfig = readJson('tsconfig.json');
const baseTsconfig = readJson('tsconfig.base.json');
const workspacePackages = discoverWorkspacePackages();
const packagesByName = new Map(workspacePackages.map((workspacePackage) => [workspacePackage.manifest.name, workspacePackage]));

checkRootTsconfigReferences();
checkPathAliasesAndExports();
checkWorkspaceImports();

if (errors.length > 0) {
  console.error(`workspace check failed with ${errors.length} issue(s):`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('workspace check passed');

function discoverWorkspacePackages() {
  const packages = [];

  for (const workspaceRoot of workspaceRoots) {
    const absoluteRoot = path.join(repoRoot, workspaceRoot);
    if (!fs.existsSync(absoluteRoot)) {
      continue;
    }

    for (const entry of fs.readdirSync(absoluteRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }

      const relativeDir = normalizePath(path.join(workspaceRoot, entry.name));
      const manifestPath = path.join(repoRoot, relativeDir, 'package.json');
      if (!fs.existsSync(manifestPath)) {
        continue;
      }

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      const tsconfigPath = path.join(repoRoot, relativeDir, 'tsconfig.json');
      const tsconfig = fs.existsSync(tsconfigPath) ? JSON.parse(fs.readFileSync(tsconfigPath, 'utf8')) : null;

      packages.push({
        dir: relativeDir,
        manifest,
        packageJsonPath: `${relativeDir}/package.json`,
        tsconfig,
        tsconfigPath: tsconfig ? `${relativeDir}/tsconfig.json` : null
      });
    }
  }

  return packages.sort((left, right) => left.dir.localeCompare(right.dir));
}

function checkRootTsconfigReferences() {
  const referencedPaths = new Set((rootTsconfig.references ?? []).map((reference) => normalizeReference(reference.path)));
  const expectedPaths = new Set(
    workspacePackages.filter((workspacePackage) => workspacePackage.tsconfig).map((workspacePackage) => normalizeReference(`./${workspacePackage.dir}`))
  );

  for (const workspacePackage of workspacePackages) {
    if (!workspacePackage.tsconfig) {
      continue;
    }

    const referencePath = normalizeReference(`./${workspacePackage.dir}`);
    if (!referencedPaths.has(referencePath)) {
      errors.push(`root tsconfig.json missing reference for ${workspacePackage.manifest.name}: ./${workspacePackage.dir}`);
    }
  }

  for (const referencedPath of referencedPaths) {
    if (!expectedPaths.has(referencedPath)) {
      errors.push(`root tsconfig.json has stale reference: ${referencedPath}`);
    }
  }
}

function checkPathAliasesAndExports() {
  const paths = baseTsconfig.compilerOptions?.paths ?? {};

  for (const workspacePackage of workspacePackages) {
    if (!workspacePackage.dir.startsWith('packages/') || !workspacePackage.manifest.name?.startsWith('@mobile-frame/')) {
      continue;
    }

    const indexPath = `${workspacePackage.dir}/src/index.ts`;
    if (fs.existsSync(path.join(repoRoot, indexPath))) {
      expectPathAlias(paths, workspacePackage.manifest.name, indexPath);
    }

    const exports = workspacePackage.manifest.exports;
    if (!exports || typeof exports !== 'object') {
      continue;
    }

    for (const [exportPath, target] of Object.entries(exports)) {
      const targetPath = getExportTarget(target);
      if (!targetPath) {
        errors.push(`${workspacePackage.packageJsonPath} export ${exportPath} must use a string target in this scaffold`);
        continue;
      }

      const normalizedTarget = normalizePath(path.join(workspacePackage.dir, targetPath.replace(/^\.\//, '')));
      if (!fs.existsSync(path.join(repoRoot, normalizedTarget))) {
        errors.push(`${workspacePackage.packageJsonPath} export ${exportPath} points to missing file: ${normalizedTarget}`);
      }

      if (exportPath === '.') {
        expectPathAlias(paths, workspacePackage.manifest.name, normalizedTarget);
      } else if (exportPath.startsWith('./')) {
        expectPathAlias(paths, `${workspacePackage.manifest.name}/${exportPath.slice(2)}`, normalizedTarget);
      }
    }
  }
}

function checkWorkspaceImports() {
  for (const sourcePackage of workspacePackages) {
    const sourceDir = path.join(repoRoot, sourcePackage.dir, 'src');
    if (!fs.existsSync(sourceDir)) {
      continue;
    }

    for (const sourceFile of listSourceFiles(sourceDir)) {
      const imports = getWorkspaceImports(fs.readFileSync(sourceFile, 'utf8'));

      for (const specifier of imports) {
        const targetName = getWorkspacePackageName(specifier);
        const targetPackage = packagesByName.get(targetName);

        if (!targetPackage || targetName === sourcePackage.manifest.name) {
          continue;
        }

        if (!hasPackageDependency(sourcePackage.manifest, targetName)) {
          errors.push(`${sourcePackage.packageJsonPath} missing dependency for ${specifier} imported in ${relative(sourceFile)}`);
        }

        if (sourcePackage.tsconfig && targetPackage.tsconfig && !hasTsconfigReference(sourcePackage, targetPackage)) {
          errors.push(`${sourcePackage.tsconfigPath} missing reference to ${targetPackage.dir} for ${specifier} imported in ${relative(sourceFile)}`);
        }
      }
    }
  }
}

function expectPathAlias(paths, alias, expectedPath) {
  const targets = paths[alias] ?? [];
  if (!targets.includes(expectedPath)) {
    errors.push(`tsconfig.base.json missing path alias ${alias} -> ${expectedPath}`);
  }
}

function getExportTarget(target) {
  if (typeof target === 'string') {
    return target;
  }

  if (target && typeof target === 'object' && typeof target.default === 'string') {
    return target.default;
  }

  return null;
}

function listSourceFiles(directory) {
  const files = [];

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...listSourceFiles(absolutePath));
      continue;
    }

    if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      files.push(absolutePath);
    }
  }

  return files;
}

function getWorkspaceImports(source) {
  const imports = new Set();
  const importPattern = /(?:from\s+|import\s*\(\s*|import\s+)['"](@mobile-frame\/[^'"]+)['"]/g;
  let match = importPattern.exec(source);

  while (match) {
    imports.add(match[1]);
    match = importPattern.exec(source);
  }

  return imports;
}

function getWorkspacePackageName(specifier) {
  const parts = specifier.split('/');
  return parts.slice(0, 2).join('/');
}

function hasPackageDependency(manifest, dependencyName) {
  return Boolean(
    manifest.dependencies?.[dependencyName] ??
      manifest.devDependencies?.[dependencyName] ??
      manifest.peerDependencies?.[dependencyName] ??
      manifest.optionalDependencies?.[dependencyName]
  );
}

function hasTsconfigReference(sourcePackage, targetPackage) {
  const expectedReference = normalizeReference(path.relative(path.join(repoRoot, sourcePackage.dir), path.join(repoRoot, targetPackage.dir)));
  const references = sourcePackage.tsconfig.references ?? [];

  return references.some((reference) => normalizeReference(reference.path) === expectedReference);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function normalizeReference(value) {
  return normalizePath(value).replace(/^\.\//, '');
}

function normalizePath(value) {
  return value.replace(/\\/g, '/');
}

function relative(absolutePath) {
  return normalizePath(path.relative(repoRoot, absolutePath));
}
