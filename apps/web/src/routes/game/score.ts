const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

function drawScore(score: string, x: number, y: number)
{
	ctx.font = "48px Arial";
	ctx.fillText(score, x, y);
}

export { drawScore }; 