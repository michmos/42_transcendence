const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

const ballSize = 10;

let serverState = {
	paddleWidth: 0,
	paddleHeight: 0,
	ballX: 0,
	ballY: 0,
	ballSpeedX: 0,
	leftY: 0,
	rightY: 0,
 };

const ws = new WebSocket("ws://localhost:3001/");

ws.onmessage = (event) => {
  serverState = JSON.parse(event.data);
//   console.log(serverState);
  draw();
};

function draw()
{
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.fillStyle = "white";
	ctx.fillRect(serverState.ballX, serverState.ballY, ballSize, ballSize);

	const dotHeight = 10;
	const dotSpacing = 12;
	for (let y = 0; y < canvas.height; y += dotHeight + dotSpacing) 
		ctx.fillRect((canvas.width / 2) - 2, y, 2, dotHeight);

	ctx.fillRect(0, serverState.leftY, serverState.paddleWidth, serverState.paddleHeight);
	ctx.fillRect(canvas.width - serverState.paddleWidth, serverState.rightY, serverState.paddleWidth, serverState.paddleHeight);
}

const keys: { [key: string]: boolean } = {};

document.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === "p")
	ws.send(JSON.stringify({ game: "pause"}));
})

document.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
})


setInterval(() => {
	if (keys.w)
		ws.send(JSON.stringify({ left: "up"}));
	if (keys.s)
		ws.send(JSON.stringify({ left: "down"}));
	if (keys.o)
		ws.send(JSON.stringify({ right: "up"}));
	if (keys.l)
		ws.send(JSON.stringify({ right: "down"}));
}, 1000 / 60);

// const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
// const ctx = canvas.getContext("2d")!;

// const paddleWidth = 10;
// const paddleHeight = 100;
// const ballSize = 10;
// const moveSpeed = 5;

// let ballX = canvas.width / 2;
// let ballY = canvas.height / 2;
// let ballSpeed = 5;
// let leftY = (canvas.height / 2) - (paddleHeight / 2);
// let rightY = (canvas.height / 2) - (paddleHeight / 2);

// function draw()
// {
// 	ctx.fillStyle = "black";
// 	ctx.fillRect(0, 0, canvas.width, canvas.height);

// 	ctx.fillStyle = "white";

// 	ctx.fillRect(0, leftY, paddleWidth, paddleHeight);
// 	ctx.fillRect(canvas.width - paddleWidth, rightY, paddleWidth, paddleHeight);

// 	ctx.fillRect(ballX, ballY, ballSize, ballSize);

// }

// const keys: { [key: string]: boolean } = {};

// document.addEventListener("keydown", (e) => {
//   keys[e.key.toLowerCase()] = true;
// })

// document.addEventListener("keyup", (e) => {
//   keys[e.key.toLowerCase()] = false;
// })

// function input()
// {
// 	if (keys['w'] && leftY > 0)
// 		leftY -= moveSpeed;
// 	if (keys['s'] && leftY < (canvas.height - paddleHeight))
// 		leftY += moveSpeed;
// }

// function update()
// {
// 	ballX -= ballSpeed;
// 	// ballY -= ballSpeed;

// 	if (ballX <= 0 || ballX >= (canvas.width - ballSize))
// 	{
// 		ballX = canvas.width / 2;
// 		ballY = canvas.height / 2;
// 	}

// 	if (ballX <= paddleWidth && ballY + ballSize >= leftY && ballY <= leftY + paddleHeight)
// 		ballSpeed = ballSpeed * -1;

// 	if (ballX + ballSize >= canvas.width - paddleWidth && ballY + ballSize >= rightY && ballY <= rightY + paddleHeight)
// 		ballSpeed = ballSpeed * -1;

// }

// function gameLoop()
// {
// 	input();
// 	update();
// 	draw();
// 	requestAnimationFrame(gameLoop);
// }

// gameLoop();