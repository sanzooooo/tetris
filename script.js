const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

// ブロックのサイズと盤面のサイズ
const grid = 24; // 1ブロックのサイズ(ピクセル)
const rowCount = 20; // 盤面の高さ（20行）
const colCount = 10; // 盤面の幅（10列）

// 盤面データを保存する2次元配列 (0は空、それ以外は色情報)
const playfield = [];
for (let row = -2; row < rowCount; row++) {
    playfield[row] = [];
    for (let col = 0; col < colCount; col++) {
        playfield[row][col] = 0;
    }
}

// テトリミノ（ブロック）の形を定義
const tetrominos = {
    'I': [
        [0,0,0,0],
        [1,1,1,1],
        [0,0,0,0],
        [0,0,0,0]
    ],
    'J': [
        [1,0,0],
        [1,1,1],
        [0,0,0],
    ],
    'L': [
        [0,0,1],
        [1,1,1],
        [0,0,0],
    ],
    'O': [
        [1,1],
        [1,1],
    ],
    'S': [
        [0,1,1],
        [1,1,0],
        [0,0,0],
    ],
    'Z': [
        [1,1,0],
        [0,1,1],
        [0,0,0],
    ],
    'T': [
        [0,1,0],
        [1,1,1],
        [0,0,0],
    ]
};

// マリオの世界観に合うようなポップな色を設定
const colors = {
    'I': '#00ffff', // 水色
    'O': '#ffff00', // 黄色
    'T': '#cc00ff', // 紫
    'S': '#00ff00', // 緑
    'Z': '#ff0000', // 赤
    'J': '#0000ff', // 青
    'L': '#ff8800'  // オレンジ
};

// 次に出るブロックの順番をランダムに決める配列
let tetrominoSequence = [];

function generateSequence() {
    const sequence = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    while (sequence.length) {
        const rand = Math.floor(Math.random() * sequence.length);
        const name = sequence.splice(rand, 1)[0];
        tetrominoSequence.push(name);
    }
}

function getNextTetromino() {
    if (tetrominoSequence.length === 0) {
        generateSequence();
    }
    const name = tetrominoSequence.pop();
    const matrix = tetrominos[name];

    // ブロックを盤面の上の真ん中に出現させる
    const col = playfield[0].length / 2 - Math.ceil(matrix[0].length / 2);
    const row = name === 'I' ? -1 : -2;

    return {
        name: name,      // ブロックの種類 ('I', 'J' など)
        matrix: matrix,  // ブロックの形（2次元配列）
        row: row,        // 現在の行位置
        col: col         // 現在の列位置
    };
}

let tetromino = getNextTetromino();
let count = 0; // ブロックの落下スピードを調整するカウンター

// 壁や他のブロックにぶつかっていないか確認する関数
function isValidMove(matrix, cellRow, cellCol) {
    for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
            if (matrix[r][c] && (
                // 画面の左端より外側
                cellCol + c < 0 ||
                // 画面の右端より外側
                cellCol + c >= playfield[0].length ||
                // 画面の一番下より外側
                cellRow + r >= playfield.length ||
                // 他のブロックに重なっている
                playfield[cellRow + r][cellCol + c])
            ) {
                return false;
            }
        }
    }
    return true;
}

let score = 0;
const scoreElement = document.getElementById('score');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreElement = document.getElementById('final-score');
const retryButton = document.getElementById('retry-button');

// 動かせなくなったブロックを盤面に固定する関数
function placeTetromino() {
    for (let r = 0; r < tetromino.matrix.length; r++) {
        for (let c = 0; c < tetromino.matrix[r].length; c++) {
            if (tetromino.matrix[r][c]) {
                // ブロックが画面の天井より上で固定されたらゲームオーバー
                if (tetromino.row + r < 0) {
                    return stopGame();
                }
                playfield[tetromino.row + r][tetromino.col + c] = tetromino.name;
            }
        }
    }

    // ラインが揃ったか確認して消す処理
    let linesCleared = 0;
    for (let row = playfield.length - 1; row >= 0; ) {
        // 全ての列にブロックがあるか（空きがないか）チェック
        if (playfield[row].every(cell => !!cell)) {
            // その行を消して、上の行をすべて1段下ろす
            playfield.splice(row, 1);
            // 新しく一番上に空の行を追加する
            const newRow = new Array(colCount).fill(0);
            playfield.unshift(newRow);
            linesCleared++;
            // 行が下がったので、今の行（row）をもう一度チェックする（row--しない）
        } else {
            row--; // 揃っていなければ上の行をチェックしにいく
        }
    }

    // スコア加算（一度に消した行数が多いほど高得点）
    if (linesCleared > 0) {
        if (linesCleared === 1) score += 100;
        else if (linesCleared === 2) score += 300;
        else if (linesCleared === 3) score += 500;
        else if (linesCleared === 4) score += 800; // テトリス！
        
        scoreElement.textContent = score;
    }

    // 次のブロックを用意する
    tetromino = getNextTetromino();
}

// ゲームオーバー処理
function stopGame() {
    console.log("GAMEOVER");
    cancelAnimationFrame(rAF); // ゲームループを止める
    rAF = null; // リセット
    
    // スコアの保存とランキングの更新（ブラウザの記憶機能を使う）
    let highScores = JSON.parse(localStorage.getItem('tetrisHighScores')) || [];
    highScores.push(score);
    // スコアが高い順（降順）に並び替える
    highScores.sort((a, b) => b - a);
    // 上位3つを残す
    highScores = highScores.slice(0, 3);
    // 保存し直す
    localStorage.setItem('tetrisHighScores', JSON.stringify(highScores));

    // 画面のランキングリストを書き換える
    const highScoresList = document.getElementById('high-scores-list');
    highScoresList.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const li = document.createElement('li');
        // もしデータがあればスコアを、なければ「---」を表示
        li.textContent = highScores[i] !== undefined ? highScores[i] : '---';
        highScoresList.appendChild(li);
    }

    // ゲームオーバー画面を表示
    finalScoreElement.textContent = score;
    gameOverScreen.classList.remove('hidden');
}

// リトライ（もう一度遊ぶ）ボタンの処理
retryButton.addEventListener('click', function() {
    // スコアと盤面のリセット
    score = 0;
    scoreElement.textContent = score;

    for (let row = -2; row < rowCount; row++) {
        for (let col = 0; col < colCount; col++) {
            playfield[row][col] = 0;
        }
    }

    // 次のブロックを用意
    tetrominoSequence = [];
    tetromino = getNextTetromino();

    // スピードと時間をリセット
    speed = 35;
    lastSpeedUpTime = Date.now();

    // 画面を隠してゲーム再開
    gameOverScreen.classList.add('hidden');
    count = 0;
    rAF = requestAnimationFrame(loop);
});

// ========== ここから新しく追加：ブロックを回転・移動させる機能 ==========

// ブロックを右に90度回転させる関数
function rotate(matrix) {
    const N = matrix.length - 1;
    const result = matrix.map((row, i) =>
        row.map((val, j) => matrix[N - j][i])
    );
    return result;
}

// 【パソコン用】キーボード（矢印キー）がおされたときの動き
document.addEventListener('keydown', function(e) {
    if (!tetromino) return;

    // 左矢印キー (コード: 37) または 'A' キー
    if (e.which === 37 || e.which === 65) {
        const col = tetromino.col - 1;
        if (isValidMove(tetromino.matrix, tetromino.row, col)) {
            tetromino.col = col;
        }
    }
    // 右矢印キー (コード: 39) または 'D' キー
    else if (e.which === 39 || e.which === 68) {
        const col = tetromino.col + 1;
        if (isValidMove(tetromino.matrix, tetromino.row, col)) {
            tetromino.col = col;
        }
    }
    // 上矢印キー (コード: 38) または 'W' キー または スペースキー：回転
    else if (e.which === 38 || e.which === 87 || e.which === 32) {
        const matrix = rotate(tetromino.matrix);
        if (isValidMove(matrix, tetromino.row, tetromino.col)) {
            tetromino.matrix = matrix;
        }
    }
    // 下矢印キー (コード: 40) または 'S' キー：早く落とす
    else if(e.which === 40 || e.which === 83) {
        const row = tetromino.row + 1;
        if (!isValidMove(tetromino.matrix, row, tetromino.col)) {
            tetromino.row = row - 1;
            placeTetromino();
            return;
        }
        tetromino.row = row;
    }
});

// 【スマホ用】画面のボタンをタップしたときの動き
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
const btnRotate = document.getElementById('btn-rotate');
const btnDown = document.getElementById('btn-down');

// ボタンを押した時の共通関数
function handleControl(action) {
    if (!tetromino) return;
    
    // スクロールなどのデフォルトの動きを止めるための設定
    if (action === 'left') {
        const col = tetromino.col - 1;
        if (isValidMove(tetromino.matrix, tetromino.row, col)) tetromino.col = col;
    } else if (action === 'right') {
        const col = tetromino.col + 1;
        if (isValidMove(tetromino.matrix, tetromino.row, col)) tetromino.col = col;
    } else if (action === 'rotate') {
        const matrix = rotate(tetromino.matrix);
        if (isValidMove(matrix, tetromino.row, tetromino.col)) tetromino.matrix = matrix;
    } else if (action === 'down') {
        const row = tetromino.row + 1;
        if (!isValidMove(tetromino.matrix, row, tetromino.col)) {
            tetromino.row = row - 1;
            placeTetromino();
            return;
        }
        tetromino.row = row;
    }
}

// 各ボタンがタップされたとき（またはマウスでクリックされたとき）に割り当てる
btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); handleControl('left'); });
btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); handleControl('right'); });
btnRotate.addEventListener('touchstart', (e) => { e.preventDefault(); handleControl('rotate'); });
btnDown.addEventListener('touchstart', (e) => { e.preventDefault(); handleControl('down'); });

btnLeft.addEventListener('mousedown', (e) => { e.preventDefault(); handleControl('left'); });
btnRight.addEventListener('mousedown', (e) => { e.preventDefault(); handleControl('right'); });
btnRotate.addEventListener('mousedown', (e) => { e.preventDefault(); handleControl('rotate'); });
btnDown.addEventListener('mousedown', (e) => { e.preventDefault(); handleControl('down'); });

// ========== ここまで新しく追加 ==========

let speed = 35; // 何フレームごとにブロックが落ちるか（少ないほど速い）
let lastSpeedUpTime = Date.now(); // 最後にスピードアップした時間

// ゲームのメインループ（これを繰り返し実行して画面を動かす）
let rAF = null; // requestAnimationFrameのID

function loop() {
    rAF = requestAnimationFrame(loop);
    context.clearRect(0, 0, canvas.width, canvas.height); // 一度画面をすべて消す

    // --- 新規追加：1分（60000ミリ秒）ごとにスピードを1.2倍にする処理 ---
    const now = Date.now();
    if (now - lastSpeedUpTime > 60000) {
        speed = speed / 1.2; // 待機フレーム数を割る＝スピードが上がる
        lastSpeedUpTime = now;
        console.log("スピードアップ！ 現在の速度:", speed);
    }
    // ----------------------------------------------------------------

    // 既に固定されているブロックを描画
    for (let row = 0; row < 20; row++) {
        for (let col = 0; col < 10; col++) {
            if (playfield[row][col]) {
                const name = playfield[row][col];
                context.fillStyle = colors[name];
                context.fillRect(col * grid, row * grid, grid - 1, grid - 1); // 1pxは隙間用
            }
        }
    }

    // 今操作中（落下中）のブロックを描画
    if (tetromino) {
        // 設定したスピードごとにブロックを1マス下へ
        if (++count > speed) {
            tetromino.row++;
            count = 0;

            // もし下に動かせなくなったら、ブロックを固定する
            if (!isValidMove(tetromino.matrix, tetromino.row, tetromino.col)) {
                tetromino.row--; // ぶつかったので1個上に戻す
                placeTetromino();
            }
        }

        context.fillStyle = colors[tetromino.name];
        // 落ちてきているブロックを実際に画面に描画
        for (let r = 0; r < tetromino.matrix.length; r++) {
            for (let c = 0; c < tetromino.matrix[r].length; c++) {
                if (tetromino.matrix[r][c]) {
                    context.fillRect((tetromino.col + c) * grid, (tetromino.row + r) * grid, grid - 1, grid - 1);
                }
            }
        }
    }
}

// アニメーションを開始！
rAF = requestAnimationFrame(loop);

