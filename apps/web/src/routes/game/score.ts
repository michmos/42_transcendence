const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

// Custom bitmap font for authentic arcade look
function drawDigit(digit: number, x: number, y: number, size = 4) {
    const pixelSize = size;
    // 5x9 pixel patterns for digits 0-9
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
            [true, true, true, true, true]
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
            [false, false, false, false, true]
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
            [true, true, true, true, true]
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
            [true, true, true, true, true]
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
            [false, false, false, false, true]
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
            [true, true, true, true, true]
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
            [true, true, true, true, true]
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
            [false, false, false, false, true]
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
            [true, true, true, true, true]
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
            [false, false, false, false, true]
        ]
    ];
	const pattern = patterns[digit]!;
	for (let row = 0; row < pattern.length; row++) {
		const currentRow = pattern[row];
		if (!currentRow) continue; // Skip if row is undefined
		
		for (let col = 0; col < currentRow.length; col++) {
			if (currentRow[col]) {
				ctx.fillRect(x + col * pixelSize, y + row * pixelSize, pixelSize, pixelSize);
			}
		}
	}
	}

function drawScore(score: number, x: number, y: number, size: number)
{
	// const digit = score.toString()
	// ctx.font = "48px Arial";
	// ctx.fillText(digit, x, y);
	
	const digits = score.toString().split('').map(d => parseInt(d));
    const digitWidth = 5 * size + 20; // 5 pixels wide + 2 pixel spacing
    // for (let i = 0; i < digits.length; i++)
    // 	drawDigit(digits[i], x + i * digitWidth, y, size);
    
	// Draw digits from right to left (right-aligned)
    for (let i = 0; i < digits.length; i++) {
        const digitIndex = (digits.length - 1) - i; // Get digit from right to left
        drawDigit(digits[digitIndex]!, x - (i + 1) * digitWidth, y, size);
    }
}

export { drawScore }; 