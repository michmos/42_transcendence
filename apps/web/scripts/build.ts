#!/usr/bin/env node
import { spawn } from 'child_process';

const buildProcess = spawn('vite', ['build'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: false, // Fix deprecation warning
});

let stdoutBuffer = '';
let stderrBuffer = '';
let skipNextLines = 0;

function isCSSRuleLine(line: string): boolean {
  // Remove ANSI escape codes for checking
  const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '');
  const trimmed = cleanLine.trim();

  // Only filter CSS lines that appear in warning format (with │ prefix)
  if (!trimmed.startsWith('│')) {
    return false;
  }
  return (
    trimmed.includes('background-color:') ||
    trimmed.includes('color:') ||
    trimmed.includes('transform:') ||
    trimmed.includes('flex-direction:') ||
    trimmed.includes('align-items:') ||
    trimmed.includes('justify-content:') ||
    trimmed.includes('grid-template-columns:') ||
    trimmed.includes('border-color:') ||
    trimmed === '│' ||
    trimmed === '│   }' ||
    trimmed === '│     }' ||
    (trimmed.startsWith('│') && trimmed.length < 10 && trimmed.includes('}'))
  );
}

function shouldSkipLine(line: string): boolean {
  const trimmed = line.trim();
  return (
    line.includes('is not recognized as a valid pseudo-class') ||
    line.includes('Did you mean') ||
    line.includes('Issue #') ||
    line.includes('pseudo-element') ||
    line.includes('pseudo-class') ||
    trimmed === '┆' ||
    trimmed.startsWith('┆') ||
    (line.includes('Found') && line.includes('warnings while optimizing'))
  );
}

buildProcess.stdout.on('data', (data: Buffer) => {
  const text = data.toString();
  stdoutBuffer += text;

  const lines = stdoutBuffer.split('\n');
  stdoutBuffer = lines.pop() || '';

  let inWarningBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect start of warning block
    if (
      line.includes('Issue #') ||
      (line.includes('Found') && line.includes('warnings'))
    ) {
      inWarningBlock = true;
      skipNextLines = 5; // Skip the entire warning block
      continue;
    }

    // Skip lines in warning blocks (including CSS code snippets)
    if (inWarningBlock || skipNextLines > 0) {
      if (trimmed === '┆' || trimmed.startsWith('┆')) {
        skipNextLines = Math.max(skipNextLines, 3); // Reset skip counter if we see indicator
      }
      // Also skip CSS rule lines that are part of warning examples
      if (isCSSRuleLine(line)) {
        skipNextLines = Math.max(skipNextLines, 1);
      }
      skipNextLines--;
      if (skipNextLines <= 0 && !isCSSRuleLine(line)) {
        inWarningBlock = false;
      }
      continue;
    }

    if (shouldSkipLine(line)) {
      continue;
    }

    // Skip CSS rule lines that are part of warning output
    if (isCSSRuleLine(line)) {
      continue;
    }

    process.stdout.write(line + '\n');
  }
});

buildProcess.stderr.on('data', (data: Buffer) => {
  const text = data.toString();
  stderrBuffer += text;

  const lines = stderrBuffer.split('\n');
  stderrBuffer = lines.pop() || '';

  let inWarningBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (
      line.includes('Issue #') ||
      (line.includes('Found') && line.includes('warnings'))
    ) {
      inWarningBlock = true;
      skipNextLines = 5;
      continue;
    }

    if (inWarningBlock || skipNextLines > 0) {
      if (trimmed === '┆' || trimmed.startsWith('┆')) {
        skipNextLines = Math.max(skipNextLines, 3);
      }
      if (isCSSRuleLine(line)) {
        skipNextLines = Math.max(skipNextLines, 1);
      }
      skipNextLines--;
      if (skipNextLines <= 0 && !isCSSRuleLine(line)) {
        inWarningBlock = false;
      }
      continue;
    }

    if (shouldSkipLine(line)) {
      continue;
    }

    if (isCSSRuleLine(line)) {
      continue;
    }

    process.stderr.write(line + '\n');
  }
});

buildProcess.on('close', (code: number | null) => {
  // Flush remaining buffers (only if not part of warnings)
  if (stdoutBuffer && !shouldSkipLine(stdoutBuffer)) {
    process.stdout.write(stdoutBuffer);
  }
  if (stderrBuffer && !shouldSkipLine(stderrBuffer)) {
    process.stderr.write(stderrBuffer);
  }
  process.exit(code || 0);
});
