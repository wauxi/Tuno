#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');

const root = process.cwd();
const partialPath = path.join(root, 'src', 'partials', 'header.html');
const outDir = path.join(root, 'dist');

async function readAllHtml(dir) {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const d of dirents) {
    const res = path.join(dir, d.name);
    if (d.isDirectory()) {
      // skip dist, node_modules and partials directories
      if (d.name === 'dist' || d.name === 'node_modules' || d.name === 'src' && d.name === 'partials') continue;
      // also skip node_modules and dist
      if (d.name === 'dist' || d.name === 'node_modules' || d.name === 'partials') continue;
      files.push(...await readAllHtml(res));
    } else {
      if (res.endsWith('.html')) files.push(res);
    }
  }
  return files;
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function build() {
  // read header partial
  const header = await fs.readFile(partialPath, 'utf8');

  // find all html files
  const htmlFiles = await readAllHtml(root);

  // prepare outDir
  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(outDir, { recursive: true });

  for (const srcPath of htmlFiles) {
    const rel = path.relative(root, srcPath);
    const outPath = path.join(outDir, rel);
    const outDirname = path.dirname(outPath);
    await fs.mkdir(outDirname, { recursive: true });

    let html = await fs.readFile(srcPath, 'utf8');
    if (html.includes('<!-- @@header -->')) {
      html = html.replace(/<!-- @@header -->/g, header);
    }
    await fs.writeFile(outPath, html, 'utf8');
    console.log('Built', outPath);
  }

  // copy public/img to dist/img if exists
  try {
    const srcImg = path.join(root, 'public', 'img');
    const destImg = path.join(outDir, 'img');
    await copyDir(srcImg, destImg);
    console.log('Copied images to dist/img');
  } catch (e) {
    console.warn('No public/img folder to copy (skipped).');
  }
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});
