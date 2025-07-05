const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreSpan = document.getElementById('finalScore');
const restartButton = document.getElementById('restartButton');

const gridSize = 20; // ヘビの体の1マスのサイズ
const tileCount = canvas.width / gridSize; // 1列/行のマスの数

let snake = [{ x: 10, y: 10 }]; // ヘビの初期位置 (配列で体の各部分を管理)
let food = {}; // エサの位置
let dx = 0; // x方向の移動量 (1:右, -1:左, 0:停止)
let dy = 0; // y方向の移動量 (1:下, -1:上, 0:停止)
let score = 0;
let gameInterval;
let gameSpeed = 150; // ゲームの速度 (ミリ秒)

// --- ゲーム初期化 ---
function initGame() {
    snake = [{ x: 10, y: 10 }];
    dx = 0;
    dy = 0;
    score = 0;
    gameSpeed = 150;
    gameOverScreen.classList.add('hidden');
    generateFood();
    if (gameInterval) clearInterval(gameInterval); // 既存のインターバルをクリア
    gameInterval = setInterval(gameLoop, gameSpeed); // ゲームループを開始
}

// --- ゲームループ ---
function gameLoop() {
    update();
    draw();
}

// --- 更新処理 (ヘビの移動、衝突判定など) ---
function update() {
    // ヘビの新しい頭の位置を計算
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // ゲームオーバー判定 (壁に衝突 or 自分自身に衝突)
    if (head.x < 0 || head.x >= tileCount ||
        head.y < 0 || head.y >= tileCount ||
        checkCollision(head)) {
        endGame();
        return;
    }

    // 新しい頭をヘビの配列の先頭に追加
    snake.unshift(head);

    // エサを食べたか判定
    if (head.x === food.x && head.y === food.y) {
        score++;
        generateFood(); // 新しいエサを生成
        // スコアに応じて速度を上げる (任意)
        if (score % 3 === 0 && gameSpeed > 50) { // 例: 3点ごとに速度アップ
            gameSpeed -= 10;
            clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, gameSpeed);
        }
    } else {
        // エサを食べていない場合は、しっぽを削除してヘビの長さを保つ
        snake.pop();
    }
}

// --- 描画処理 (ヘビ、エサ、スコアなど) ---
function draw() {
    // キャンバスをクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ヘビを描画
    ctx.fillStyle = 'lime';
    snake.forEach(segment => {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
    });

    // エサを描画
    ctx.fillStyle = 'red';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);

    // スコアを表示
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('スコア: ' + score, 10, 30);
}

// --- エサの生成 ---
function generateFood() {
    food = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };

    // ヘビの体と重ならないように再生成
    snake.forEach(segment => {
        if (segment.x === food.x && segment.y === food.y) {
            generateFood();
        }
    });
}

// --- 衝突判定 (自分自身にぶつかったか) ---
function checkCollision(head) {
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    return false;
}

// --- ゲーム終了 ---
function endGame() {
    clearInterval(gameInterval); // ゲームループを停止
    finalScoreSpan.textContent = score;
    gameOverScreen.classList.remove('hidden'); // ゲームオーバー画面を表示
}

// --- キーボード入力の監視 ---
document.addEventListener('keydown', e => {
    switch (e.key) {
        case 'ArrowUp':
            if (dy === 0) { dx = 0; dy = -1; } // 下に進んでいる時は上に行けない
            break;
        case 'ArrowDown':
            if (dy === 0) { dx = 0; dy = 1; } // 上に進んでいる時は下に行けない
            break;
        case 'ArrowLeft':
            if (dx === 0) { dx = -1; dy = 0; } // 右に進んでいる時は左に行けない
            break;
        case 'ArrowRight':
            if (dx === 0) { dx = 1; dy = 0; } // 左に進んでいる時は右に行けない
            break;
    }
});

// --- リスタートボタンのイベントリスナー ---
restartButton.addEventListener('click', initGame);

// --- ゲーム開始 ---
initGame();
