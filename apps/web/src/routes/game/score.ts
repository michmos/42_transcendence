import { getCanvas, getCtx } from './state';

// Custom bitmap font for authentic arcade look
function drawDigit(digit: number, x: number, y: number, size = 4) {
  const ctx = getCtx();
  if (!ctx) return;
  const pixelSize = size;
  // 5x9 pixel patterns for digits 0-9 & :
  const patterns = [
    // 0
    [
      [true, true, true, true, true],
      [true, false, false, false, true],
      [true, false, false, false, true],
      [true, false, false, false, true],
      [true, false, false, false, true],
      [true, false, false, false, true],
      [true, false, false, false, true],
      [true, false, false, false, true],
      [true, true, true, true, true],
    ],
    // 1
    [
      [false, false, false, false, true],
      [false, false, false, false, true],
      [false, false, false, false, true],
      [false, false, false, false, true],
      [false, false, false, false, true],
      [false, false, false, false, true],
      [false, false, false, false, true],
      [false, false, false, false, true],
      [false, false, false, false, true],
    ],
    // 2
    [
      [true, true, true, true, true],
      [false, false, false, false, true],
      [false, false, false, false, true],
      [false, false, false, false, true],
      [true, true, true, true, true],
      [true, false, false, false, false],
      [true, false, false, false, false],
      [true, false, false, false, false],
      [true, true, true, true, true],
    ],
    // 3
    [
      [true, true, true, true, true],
      [false, false, false, false, true],
      [false, false, false, false, true],
      [false, false, false, false, true],
      [true, true, true, true, true],
      [false, false, false, false, true],
      [false, false, false, false, true],
      [false, false, false, false, true],
      [true, true, true, true, true],
    ],
    // 4
    [
      [true, false, false, false, true],
      [true, false, false, false, true],
      [true, false, false, false, true],
      [true, false, false, false, true],
      [true, true, true, true, true],
      [false, false, false, false, true],
      [false, false, false, false, true],
      [false, false, false, false, true],
      [false, false, false, false, true],
    ],
    // 5
    [
      [true, true, true, true, true],
      [true, false, false, false, false],
      [true, false, false, false, false],
      [true, false, false, false, false],
      [true, true, true, true, true],
      [false, false, false, false, true],
      [false, false, false, false, true],
      [false, false, false, false, true],
      [true, true, true, true, true],
    ],
    // 6
    [
      [true, false, false, false, false],
      [true, false, false, false, false],
      [true, false, false, false, false],
      [true, false, false, false, false],
      [true, true, true, true, true],
      [true, false, false, false, true],
      [true, false, false, false, true],
      [true, false, false, false, true],
      [true, true, true, true, true],
    ],
    // 7
    [
      [true, true, true, true, true],
      [false, false, false, false, true],
      [false, false, false, false, true],
      [false, false, false, false, true],
      [false, false, false, false, true],
      [false, false, false, false, true],
      [false, false, false, false, true],
      [false, false, false, false, true],
      [false, false, false, false, true],
    ],
    // 8
    [
      [true, true, true, true, true],
      [true, false, false, false, true],
      [true, false, false, false, true],
      [true, false, false, false, true],
      [true, true, true, true, true],
      [true, false, false, false, true],
      [true, false, false, false, true],
      [true, false, false, false, true],
      [true, true, true, true, true],
    ],
    // 9
    [
      [true, true, true, true, true],
      [true, false, false, false, true],
      [true, false, false, false, true],
      [true, false, false, false, true],
      [true, true, true, true, true],
      [false, false, false, false, true],
      [false, false, false, false, true],
      [false, false, false, false, true],
      [false, false, false, false, true],
    ],
    // :
    [
      [false, false, false, false, false],
      [false, false, false, false, false],
      [false, false, false, false, true],
      [false, false, false, false, false],
      [false, false, false, false, false],
      [false, false, false, false, false],
      [false, false, false, false, true],
      [false, false, false, false, false],
      [false, false, false, false, false],
    ],
  ];
  const pattern = patterns[digit] ?? [
    [false, false, false, false, false],
    [false, false, false, false, false],
    [false, false, false, false, false],
    [false, false, false, false, false],
    [false, false, false, false, false],
    [false, false, false, false, false],
    [false, false, false, false, false],
    [false, false, false, false, false],
    [false, false, false, false, false],
  ];
  for (let row = 0; row < pattern.length; row++) {
    const currentRow = pattern[row];
    if (!currentRow) continue; // Skip if row is undefined

    for (let col = 0; col < currentRow.length; col++) {
      if (currentRow[col]) {
        ctx.fillRect(
          x + col * pixelSize,
          y + row * pixelSize,
          pixelSize,
          pixelSize
        );
      }
    }
  }
}

export function drawScore(score: number, x: number, y: number, size: number) {
  const digits = score
    .toString()
    .split('')
    .map((d) => parseInt(d));
  const digitWidth = 5 * size + 20; // 5 pixels wide + 2 pixel spacing

  // Draw digits from right to left (right-aligned)
  for (let i = 0; i < digits.length; i++) {
    const digitIndex = digits.length - 1 - i; // Get digit from right to left
    const digit = digits[digitIndex];
    if (digit !== undefined) {
      drawDigit(digit, x - (i + 1) * digitWidth, y, size);
    }
  }
}

export function drawTime(
  milliseconds: number,
  x: number,
  y: number,
  size: number
) {
  const canvas = getCanvas();
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const digitsMin = minutes
    .toString()
    .padStart(2, '0')
    .split('')
    .map((d) => parseInt(d));
  const digitsSec = seconds
    .toString()
    .padStart(2, '0')
    .split('')
    .map((d) => parseInt(d));
  const digitWidth = (canvas.width / 480) * size + 20;

  for (let i = 0; i < digitsMin.length; i++) {
    const digitIndex = digitsMin.length - 1 - i; // Get digit from right to left
    const digit = digitsMin[digitIndex];
    if (digit !== undefined) {
      drawDigit(digit, x - (i + 1) * digitWidth, y, size);
    }
  }

  drawDigit(10, x - 1 * digitWidth + size * 2, y, size);

  for (let i = 0; i < digitsSec.length; i++) {
    const digit = digitsSec[i];
    if (digit !== undefined) {
      drawDigit(digit, x + i * digitWidth + size, y, size);
    }
  }
}
