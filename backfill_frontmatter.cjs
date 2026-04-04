const fs = require('fs');
const path = require('path');

const REPO_ROOT = process.cwd();
const DOCS_DIR = path.join(REPO_ROOT, 'docs');

const EXCLUDED_FILES = [
  'docs/BEARING.md',
  'docs/VISION.md',
  'docs/method/process.md',
  'docs/method/release.md',
  'docs/method/release-runbook.md',
  'docs/method/releases/README.md',
  'docs/releases/README.md',
];

const EXCLUDED_DIRS = [
  'docs/method/legends'
];

function getAllMarkdownFiles(dir, allFiles = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const relativePath = path.relative(REPO_ROOT, fullPath);

    if (fs.statSync(fullPath).isDirectory()) {
      if (!EXCLUDED_DIRS.some(d => relativePath === d || relativePath.startsWith(d + '/'))) {
        getAllMarkdownFiles(fullPath, allFiles);
      }
    } else if (file.endsWith('.md')) {
      if (!EXCLUDED_FILES.includes(relativePath)) {
        allFiles.push(fullPath);
      }
    }
  }
  return allFiles;
}

const markdownFiles = getAllMarkdownFiles(DOCS_DIR);

for (const filePath of markdownFiles) {
  const relativePath = path.relative(REPO_ROOT, filePath);
  let content = fs.readFileSync(filePath, 'utf8');

  // If it already has frontmatter, we might need to fix it if we just wrote it wrong
  // But let's just re-process everything that doesn't look like "original" docs
  // Actually, I'll just check if it has the title in frontmatter.

  let title = '';
  let body = content;

  if (content.startsWith('---\n')) {
    const endMatch = content.indexOf('\n---\n', 4);
    if (endMatch !== -1) {
        const fmContent = content.substring(4, endMatch);
        const titleMatch = fmContent.match(/^title:\s+"(.*)"$/m);
        if (titleMatch) {
            title = titleMatch[1];
        }
        body = content.substring(endMatch + 5).trim();
    }
  } else {
    // Match only the first line if it's a heading
    const lines = content.split('\n');
    if (lines[0].startsWith('# ')) {
      title = lines[0].substring(2).trim();
    } else {
      const titleMatch = content.match(/^#\s+(.*)$/m);
      if (titleMatch) {
        title = titleMatch[1].trim();
      }
    }
  }

  const frontmatter = {};
  if (title) {
    frontmatter.title = title;
  }

  // Determine type and extract fields
  if (relativePath.startsWith('docs/design/')) {
    const legendMatch = content.match(/^Legend:\s+(.*)$/m);
    frontmatter.legend = legendMatch ? legendMatch[1].trim() : 'none';
  } else if (relativePath.startsWith('docs/method/retro/') && !relativePath.includes('/witness/')) {
    if (frontmatter.title) {
        frontmatter.title = frontmatter.title.replace(/\s+Retro$/, '');
    }
    const outcomeMatch = content.match(/^Outcome:\s+(.*)$/m);
    frontmatter.outcome = outcomeMatch ? outcomeMatch[1].trim() : '';
    const driftCheckMatch = content.match(/^Drift check:\s+(.*)$/m);
    frontmatter.drift_check = driftCheckMatch ? driftCheckMatch[1].trim() : '';
  } else if (relativePath.startsWith('docs/method/backlog/')) {
    const fileName = path.basename(filePath);
    const prefixMatch = fileName.match(/^([A-Z]+)_/);
    frontmatter.legend = prefixMatch ? prefixMatch[1] : 'untagged';
  }

  // Construct YAML string
  let yamlStr = '---\n';
  const keys = Object.keys(frontmatter);
  if (keys.includes('title')) {
    yamlStr += `title: ${JSON.stringify(frontmatter.title)}\n`;
  }
  for (const key of keys) {
    if (key === 'title') continue;
    // Don't quote outcome, drift_check, legend unless they have spaces
    const value = frontmatter[key];
    if (value.includes(' ') || key === 'title') {
        yamlStr += `${key}: ${JSON.stringify(value)}\n`;
    } else {
        yamlStr += `${key}: ${value}\n`;
    }
  }
  yamlStr += '---\n\n';

  // Cleanup body
  let newBody = body;
  
  // Remove first heading if still there
  const titleMatch = body.match(/^#\s+(.*)$/m);
  if (titleMatch) {
    newBody = newBody.replace(titleMatch[0], '').trim();
  }
  
  if (relativePath.startsWith('docs/design/')) {
    const legendMatch = body.match(/^Legend:\s+(.*)$/m);
    if (legendMatch) {
        newBody = newBody.replace(legendMatch[0], '').trim();
    }
  } else if (relativePath.startsWith('docs/method/retro/') && !relativePath.includes('/witness/')) {
    const outcomeMatch = body.match(/^Outcome:\s+(.*)$/m);
    if (outcomeMatch) {
        newBody = newBody.replace(outcomeMatch[0], '').trim();
    }
    const driftCheckMatch = body.match(/^Drift check:\s+(.*)$/m);
    if (driftCheckMatch) {
        newBody = newBody.replace(driftCheckMatch[0], '').trim();
    }
  }

  fs.writeFileSync(filePath, yamlStr + newBody + '\n');
  console.log(`Processed ${relativePath}`);
}
