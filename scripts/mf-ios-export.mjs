import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const appPath = getOption('app', 'apps/showcase');
const skipPreflight = args.includes('--skip-preflight');
const projectName = getOption('project', getProjectName());
const scheme = getOption('scheme', projectName);
const archivePath = resolve(getOption('archive-path', `${appPath}/ios/build/archive/${scheme}.xcarchive`));
const exportPath = resolve(getOption('export-path', `${appPath}/ios/build/export`));
const exportOptionsPlist = resolve(getOption('export-options-plist', `${appPath}/ios/ExportOptions.plist`));
const evidenceDir = resolve(getOption('evidence-dir', 'data/runtime-evidence/ios'));

if (!isDirectory(archivePath)) {
  fail(`iOS archive is missing: ${relative(archivePath)}`);
}

if (!isFile(exportOptionsPlist)) {
  fail(
    [
      `ExportOptions.plist is missing: ${relative(exportOptionsPlist)}.`,
      'Pass --export-options-plist <path> with a local or CI-provided export options file.'
    ].join(' ')
  );
}

if (!skipPreflight) {
  runPreflight();
}

runExportArchive();
const evidence = verifyExportOutput();
writeEvidence(evidence);

function runPreflight() {
  const result = spawnSync(process.execPath, ['scripts/mf-native-build-preflight.mjs', '--app', appPath, '--platform', 'ios', '--strict'], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: 'inherit'
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runExportArchive() {
  const xcodeArgs = [
    '-exportArchive',
    '-archivePath',
    archivePath,
    '-exportPath',
    exportPath,
    '-exportOptionsPlist',
    exportOptionsPlist
  ];

  console.log(`running iOS archive export for ${appPath}: xcodebuild ${xcodeArgs.join(' ')}`);

  const result = spawnSync('xcodebuild', xcodeArgs, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: 'inherit'
  });

  if (result.status !== 0) {
    fail(`iOS archive export failed for ${appPath}`, result.status ?? 1);
  }
}

function verifyExportOutput() {
  const ipaPath = findIpa(exportPath);
  if (!ipaPath) {
    fail(`exported IPA is missing under ${relative(exportPath)}`);
  }

  const ipaStat = fs.statSync(ipaPath);
  if (!ipaStat.isFile() || ipaStat.size <= 0) {
    fail(`exported IPA is empty or not a file: ${relative(ipaPath)}`);
  }

  const evidence = {
    appPath,
    archivePath: relative(archivePath),
    exportOptionsPlist: relative(exportOptionsPlist),
    exportPath: relative(exportPath),
    ipaPath: relative(ipaPath),
    ipaSha256: sha256(ipaPath),
    ipaSizeBytes: ipaStat.size,
    platform: process.platform,
    projectName,
    scheme
  };

  console.log('iOS IPA export verified');
  console.log(`- ipa: ${evidence.ipaPath}`);
  console.log(`- sha256: ${evidence.ipaSha256}`);

  return evidence;
}

function writeEvidence(exportEvidence) {
  fs.mkdirSync(evidenceDir, { recursive: true });

  const evidence = {
    ...exportEvidence,
    generatedAt: new Date().toISOString(),
    nodeVersion: process.version
  };
  const evidencePath = path.join(evidenceDir, `${safeName(appPath)}-export-evidence.json`);

  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  console.log(`- evidence: ${relative(evidencePath)}`);
}

function findIpa(targetDirectory) {
  if (!isDirectory(targetDirectory)) {
    return null;
  }

  return listFiles(targetDirectory).find((filePath) => filePath.endsWith('.ipa')) ?? null;
}

function listFiles(target) {
  const files = [];
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    const absolutePath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(absolutePath));
    } else if (entry.isFile()) {
      files.push(absolutePath);
    }
  }
  return files.sort();
}

function getProjectName() {
  const appJsonPath = resolve(`${appPath}/app.json`);
  if (!fs.existsSync(appJsonPath)) {
    return 'MobileFrame';
  }

  try {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    return appJson.name ?? 'MobileFrame';
  } catch {
    return 'MobileFrame';
  }
}

function sha256(target) {
  return crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex');
}

function getOption(name, fallback) {
  const equalsPrefix = `--${name}=`;
  const equalsValue = args.find((arg) => arg.startsWith(equalsPrefix));
  if (equalsValue) {
    return equalsValue.slice(equalsPrefix.length);
  }

  const index = args.indexOf(`--${name}`);
  if (index >= 0 && args[index + 1] && !args[index + 1].startsWith('--')) {
    return args[index + 1];
  }

  return fallback;
}

function isDirectory(target) {
  return fs.existsSync(target) && fs.statSync(target).isDirectory();
}

function isFile(target) {
  return fs.existsSync(target) && fs.statSync(target).isFile();
}

function safeName(value) {
  return value.replace(/\\/g, '/').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
}

function resolve(relativePath) {
  return path.resolve(repoRoot, relativePath);
}

function relative(target) {
  return path.relative(repoRoot, target).replace(/\\/g, '/');
}

function fail(message, status = 1) {
  console.error(message);
  process.exit(status);
}
