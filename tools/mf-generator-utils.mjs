import fs from 'node:fs';
import path from 'node:path';
import { Buffer } from 'node:buffer';

const workspaceRoot = process.cwd();

export function parseCli(argv = process.argv.slice(2)) {
  const positional = [];
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '-h' || arg === '--help') {
      options.help = true;
      continue;
    }

    if (arg.startsWith('--')) {
      const raw = arg.slice(2);
      const equalsIndex = raw.indexOf('=');

      if (equalsIndex >= 0) {
        options[toCamelCase(raw.slice(0, equalsIndex))] = raw.slice(equalsIndex + 1);
        continue;
      }

      const key = toCamelCase(raw);
      const next = argv[index + 1];
      if (next && !next.startsWith('-')) {
        options[key] = next;
        index += 1;
      } else {
        options[key] = true;
      }
      continue;
    }

    positional.push(arg);
  }

  return { options, positional };
}

export function getBooleanOption(options, key) {
  return options[key] === true;
}

export function getStringOption(options, key, fallback) {
  return typeof options[key] === 'string' ? options[key] : fallback;
}

export function requireName(value, label) {
  const normalized = toKebabCase(value ?? '');
  if (!normalized) {
    throw new Error(`Missing ${label}.`);
  }
  return normalized;
}

export function toKebabCase(value) {
  return String(value)
    .trim()
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export function toPascalCase(value) {
  return toKebabCase(value)
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

export function toCamelCase(value) {
  const pascal = toPascalCase(value);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

export function titleFromName(value) {
  return toKebabCase(value)
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function safeResolve(relativePath) {
  const root = path.resolve(workspaceRoot);
  const resolved = path.resolve(root, relativePath);

  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`Refusing to write outside the workspace: ${relativePath}`);
  }

  return resolved;
}

export function createFile(relativePath, content) {
  return {
    content: content.endsWith('\n') ? content : `${content}\n`,
    relativePath: normalizePath(relativePath)
  };
}

export function createBinaryFile(relativePath, content) {
  return {
    content,
    relativePath: normalizePath(relativePath)
  };
}

export function createFilesFromDirectory(sourceRelativePath, targetRelativePath, options = {}) {
  const sourceRoot = safeResolve(sourceRelativePath);
  if (!fs.existsSync(sourceRoot) || !fs.statSync(sourceRoot).isDirectory()) {
    throw new Error(`Missing template directory: ${normalizePath(sourceRelativePath)}`);
  }

  const files = [];
  for (const sourceFile of listFiles(sourceRoot)) {
    const sourceRelativeFile = normalizePath(path.relative(sourceRoot, sourceFile));
    if (options.filter && !options.filter(sourceRelativeFile)) {
      continue;
    }

    const targetRelativeFile = options.transformPath?.(sourceRelativeFile) ?? sourceRelativeFile;
    const targetPath = normalizePath(path.join(targetRelativePath, targetRelativeFile));
    const content = fs.readFileSync(sourceFile);

    if (isTextTemplateFile(sourceRelativeFile)) {
      const text = content.toString('utf8');
      files.push({ ...createFile(targetPath, options.transformText?.(text, sourceRelativeFile) ?? text), mode: fs.statSync(sourceFile).mode });
      continue;
    }

    files.push({ ...createBinaryFile(targetPath, content), mode: fs.statSync(sourceFile).mode });
  }

  return files;
}

export function writeFiles(files, { dryRun = false, force = false } = {}) {
  const existing = files.filter((entry) => fs.existsSync(safeResolve(entry.relativePath)));

  if (existing.length > 0 && !force) {
    throw new Error(`Refusing to overwrite existing file(s): ${existing.map((entry) => entry.relativePath).join(', ')}`);
  }

  for (const entry of files) {
    if (dryRun) {
      console.log(`would create ${entry.relativePath}`);
      continue;
    }

    const target = safeResolve(entry.relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    if (Buffer.isBuffer(entry.content)) {
      fs.writeFileSync(target, entry.content);
    } else {
      fs.writeFileSync(target, entry.content, 'utf8');
    }
    if (typeof entry.mode === 'number') {
      fs.chmodSync(target, entry.mode);
    }
    console.log(`created ${entry.relativePath}`);
  }
}

export function updateJson(relativePath, updater, { dryRun = false } = {}) {
  const target = safeResolve(relativePath);
  const current = JSON.parse(fs.readFileSync(target, 'utf8'));
  const next = updater(JSON.parse(JSON.stringify(current)));
  const before = JSON.stringify(current);
  const after = JSON.stringify(next);

  if (before === after) {
    return false;
  }

  if (dryRun) {
    console.log(`would update ${normalizePath(relativePath)}`);
    return true;
  }

  fs.writeFileSync(target, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  console.log(`updated ${normalizePath(relativePath)}`);
  return true;
}

export function addTsconfigReference(relativePath, referencePath, options = {}) {
  return updateJson(
    relativePath,
    (config) => {
      const references = Array.isArray(config.references) ? config.references : [];
      if (!references.some((reference) => reference.path === referencePath)) {
        references.push({ path: referencePath });
      }
      config.references = references;
      return config;
    },
    options
  );
}

export function addTsconfigPathAlias(relativePath, alias, targetPath, options = {}) {
  return updateJson(
    relativePath,
    (config) => {
      config.compilerOptions = config.compilerOptions ?? {};
      const paths = config.compilerOptions.paths ?? {};
      const targets = Array.isArray(paths[alias]) ? paths[alias] : [];
      if (!targets.includes(targetPath)) {
        targets.push(targetPath);
      }
      paths[alias] = targets;
      config.compilerOptions.paths = paths;
      return config;
    },
    options
  );
}

export function addPackageDependencies(relativePath, dependencies, options = {}) {
  return updateJson(
    relativePath,
    (manifest) => {
      manifest.dependencies = manifest.dependencies ?? {};
      for (const [name, version] of Object.entries(dependencies)) {
        if (!manifest.dependencies[name]) {
          manifest.dependencies[name] = version;
        }
      }
      return manifest;
    },
    options
  );
}

export function appendLine(relativePath, line, { create = false, dryRun = false } = {}) {
  const target = safeResolve(relativePath);
  const normalized = normalizePath(relativePath);

  if (!fs.existsSync(target)) {
    if (!create) {
      throw new Error(`Missing file: ${normalized}`);
    }

    if (dryRun) {
      console.log(`would create ${normalized}`);
      return true;
    }

    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, `${line}\n`, 'utf8');
    console.log(`created ${normalized}`);
    return true;
  }

  const current = fs.readFileSync(target, 'utf8');
  if (current.split(/\r?\n/).includes(line)) {
    return false;
  }

  if (dryRun) {
    console.log(`would update ${normalized}`);
    return true;
  }

  const separator = current.endsWith('\n') ? '' : '\n';
  fs.writeFileSync(target, `${current}${separator}${line}\n`, 'utf8');
  console.log(`updated ${normalized}`);
  return true;
}

export function assertDirectory(relativePath) {
  const target = safeResolve(relativePath);
  if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) {
    throw new Error(`Missing directory: ${normalizePath(relativePath)}`);
  }
}

export function runCli(handler) {
  try {
    handler();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

function normalizePath(value) {
  return value.replace(/\\/g, '/');
}

function listFiles(directory) {
  const files = [];

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...listFiles(absolutePath));
      continue;
    }

    if (entry.isFile()) {
      files.push(absolutePath);
    }
  }

  return files;
}

function isTextTemplateFile(relativePath) {
  const basename = path.basename(relativePath);
  const extension = path.extname(relativePath);

  return (
    [
      '.bat',
      '.cjs',
      '.env',
      '.gradle',
      '.json',
      '.kt',
      '.pbxproj',
      '.plist',
      '.properties',
      '.storyboard',
      '.swift',
      '.xcprivacy',
      '.xcscheme',
      '.xml'
    ].includes(extension) || ['Podfile', 'gradlew'].includes(basename)
  );
}
