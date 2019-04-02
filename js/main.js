(function() {
  'use strict';

  const NUM_BOMBS = 10;   // 爆弾の数
  const WIDTH = 9;    // ボードの幅
  const HEIGHT = 9;   // ボードの高さ
  const BOARD = document.getElementById("board");     // ボード
  const DIALOG = document.getElementById("dialog");   // ゲーム終了時のダイアログ
  const DIALOG_MSG = document.getElementById("dialog-msg");   // 
  let time = 0;
  let numFlag = 0;
  let clickable = true;
  hide(DIALOG);

  let count = 0;
  let isPlaying = false;
  let board = makeBoard(HEIGHT, WIDTH);

  /** ボードを生成する関数
   * @param   {Number}  h ボードの高さ
   * @param   {Number}  w ボードの幅
   * @return  {Object}    ボード
   */
  function makeBoard(h, w) {
    let b = [];
    for (let i = 0; i < h; i++) {
      let row = [];
      for (let j = 0; j < w; j++) {
        // val: 0~8:周囲の爆弾の数, -1:爆弾
        // state: 0:未開封, 1:開封済み, 2:旗
        row.push({val: 0, state: 0});
        BOARD.rows[i].cells[j].textContent = ".";
        BOARD.rows[i].cells[j].className = "closed";
      }
      b.push(row);
    }
    return b;
  }

  /** 指定座標に爆弾がセットされているかを返す関数
   * @param   {Number}  x x座標
   * @param   {Number}  y y座標
   * @return  {Boolean}   (x,y)が爆弾ならtrue,そうでなければfalse
   */
  function isBomb(x, y) {
    return board[x][y].val === -1;
  }

  /** 座標Aが座標Sと隣接するかを返す関数
   * @param   {Number}  x   Aのx座標
   * @param   {Number}  y   Aのy座標
   * @param   {Number}  sx  Sのx座標
   * @param   {Number}  sy  Sのy座標
   * @return  {Boolean}     隣接していたらtrue, 隣接していなければfalse
   */
  function adjacent(x, y, sx, sy) {
    // 隣接しない場合
    if (x < sx - 1 ||
        x > sx + 1 ||
        y < sy - 1 ||
        y > sy + 1 )
      return false;
    else return true;
  }

  /** 指定マスが隣接するマスの集合を返す関数
   * @param   {Number}  x x座標
   * @param   {Number}  y y座標
   * @return  {Object}    隣接するマス(連想配列)の集合(配列)
   */
  function getSurroundings(x, y) {
    let result = [];  // 結果を格納
    for (let ix = -1; ix <= 1; ix++) {
      if (0 <= x + ix && x + ix < HEIGHT) {
        for (let iy = -1; iy <= 1; iy++) {
          if (0 <= y + iy && y + iy < WIDTH)
            result.push({x: x+ix, y: y+iy});
        }
      }
    }
    return result;
  }

  /** 指定マスの隣接するマスの数値を1増やす
   * @param   {Number}  x x座標
   * @param   {Number}  y y座標
   */
  function incSurroundings(srr) {
    for (let s of srr) {
      if (board[s.x][s.y].val >= 0) board[s.x][s.y].val++;
    }
  }

  /** 爆弾を1つセットする
   * @param {Number}  sx  開始点のx座標
   * @param {Number}  sy  開始点のy座標
   */
  function setBomb(sx, sy) {
    let x, y;
    while (true) {
      x = Math.floor(Math.random() * WIDTH);
      y = Math.floor(Math.random() * HEIGHT);
      // そのマスに爆弾がない && スタート地点の周囲8マスではない
      if (!isBomb(x, y) && !adjacent(x, y, sx, sy)) break;
    }
    board[x][y].val = -1;

    // 爆弾周囲の数値を++する
    let sur = getSurroundings(x, y);
    incSurroundings(sur);
  }

  /** 画面表示を行う
   */
  function display(x, y) {
    const cell = BOARD.rows[x].cells[y];

    switch (board[x][y].val) {
      case -1:
        cell.innerHTML = '<i class="fas fa-poo"></i>';
        cell.className = "bomb";
        break;
      case 0:
        cell.className = "opened";
        break;
      default:
        cell.textContent = board[x][y].val;
        cell.className = "opened";
        break;
    }
  }

  /** 指定マスを開く
   * @param   {Number}  x 開くマスのx座標
   * @param   {Number}  y 開くマスのy座標
   * @return  {Boolean}   開いたらtrue, 開かなかったらfalse
   */
  function tap(x, y) {
    let cur = board[x][y];
    if (cur.state !== 0) return false; // 未開封でないとき

    // state を更新
    cur.state = 1;
    count++;
    display(x, y);


    // (x, y) が爆弾のときの処理
    if (isBomb(x, y)) {
      // gameover処理を呼び出す。
      gameover(x, y);
      console.log("GAME OVER!");
      return false;
    }


    // 隣接マスの処理
    if (cur.val === 0) {
      let sur = getSurroundings(x, y);
      sur.forEach(function(cell) {
        tap(cell.x, cell.y);
      });
    }

    // クリア処理
    if (count === (HEIGHT * WIDTH - NUM_BOMBS)) {
      // クリア処理を呼び出す
      gameclear();
      console.log("GAME CLEAR!!");
      return true;
    }

    return true;
  }

  function drawFlagNum() {
    let s = ' ';
    let n = NUM_BOMBS - numFlag;
    if (n < 10) s += 0;
    s += n;
    document.getElementById("flagcount").innerHTML = s;
  }

  /** 指定マスに旗を立てる
   */
  function setFlag(x, y) {
    let cell = board[x][y];
    switch (cell.state) {
      case 0:
        BOARD.rows[x].cells[y].innerHTML = '<i class="fas fa-flag"></i>';
        BOARD.rows[x].cells[y].classList.add("flag");
        cell.state = 2;
        numFlag++;
        drawFlagNum();
        break;
      case 1:
        break;
      case 2:
        console.log("aaaa");
        BOARD.rows[x].cells[y].textContent = ".";
        BOARD.rows[x].cells[y].classList.remove("flag");
        cell.state = 0;
        numFlag--;
        drawFlagNum();
      default:

    }

  }

  // 初期設定
  function init(x, y) {
    for (let i = 0; i < NUM_BOMBS; i++) setBomb(x, y);
    tap(x, y);
    isPlaying = true;
    drawFlagNum();
    timer();
  }

  // 左クリックの処理
  function leftClick(x, y) {
    console.log("(" + x + ", " + y + ") is clicked.");
    if (isPlaying) {
      tap(x,y);
    } else {
      init(x,y);
      isPlaying = true;
    }
    printVS();
  }

  // 右クリックの処理
  function rightClick(x, y) {
    console.log("right clicked.");
    setFlag(x, y);
  }

  // クリックしたときの挙動まとめ
  function click() {
    for (let i = 0; i < HEIGHT; i++) {
      for (let j = 0; j < WIDTH; j++) {
        BOARD.rows[i].cells[j].onclick = function() {if (clickable) leftClick(i, j)};
        BOARD.rows[i].cells[j].oncontextmenu = function() {if (clickable) rightClick(i, j)};
      }
    }
  }

  // 出力用関数
  function printVal() {
    let c = 0;
    board.forEach(function(rows) {
      let s = c + ":";
      rows.forEach(function(cell) {
        if (cell.val < 0) s += "x";
        else s += cell.val;
      });
      console.log(s);
      c++;
    });
  }
  function printState() {
    let c = 0;
    board.forEach(function(rows) {
      let s = c + ":";
      rows.forEach(function(cell) {
        if (cell.state === 1) s += "O";
        else s += ".";
      });
      console.log(s);
      c++;
    });
  }
  function printVS() {
    let c = 0;
    board.forEach(function(rows) {
      let s = c + ":";
      rows.forEach(function(cell) {
        if (!cell.state === 1) s += ".";
        else if (cell.val < 0) s += "x";
        else s += cell.val;
      });
      console.log(s);
      c++;
    });
  }

  // GAME OVER
  function gameover(x, y) {
    // ダイアログを表示
    show(DIALOG);
    DIALOG_MSG.innerHTML = "<h3>GAME OVER</h3>";
    let arr = [{x:x, y:y}];
    const cur = BOARD.rows[x].cells[y];
    isPlaying = false;
    clickable = false;
    // 爆弾を全てオープンする処理
    openAllBombs(arr, x, y);
    // 点滅
    //setInterval(flash, 100, arr);
    BOARD.classList.add("opac");
  }

  /** 爆弾を全てオープンさせる関数
   * @param {Object} arr オープン済みのセルを格納する配列
   * @param {Object} x   オープン済みセルのx座標
   * @param {Object} y   オープン済みセルのy座標
   */
  function openAllBombs(arr, x, y) {
    let cnt = 0;
    for (let ix = 0; ix < HEIGHT; ix++) {
      for (let iy = 0; iy < WIDTH; iy++) {
        if (isBomb(ix, iy) && !(ix === x && iy === y)) {
          // 遅延させる
          setTimeout(function() {
            // 処理内容
            arr.push({x: ix, y: iy});
            display(ix, iy);
          }, 1000 + (50 * cnt++));
        }
      }
    }
  }

  /** 点滅させる関数
   * @param {Object}  arr 点滅させたいcellの集合
   */
  function flash(arr) {
    let cur;
    for(let i in arr) {
      cur = BOARD.rows[arr[i].x].cells[arr[i].y];
      if (cur.classList.contains("opac")) {
        cur.classList.remove("opac");
      } else {
        cur.classList.add("opac");
      }
    }
  }

  /** displayを切り替える関数 */
  function hide(obj) {
    obj.style.display = 'none';
  }
  function show(obj) {
    obj.style.display = '';
  }

  /** GAME CLEAR */
  function gameclear() {
    isPlaying = false;
    clickable = false;
    show(DIALOG);
    DIALOG_MSG.innerHTML = '<h3>GAME CLEAR!</h3><p>clear time </p>' + convertSecToText(time - 1);
    BOARD.classList.add("opac");
  }

  function timer() {
    if (!isPlaying) return;
    document.getElementById('timer').innerHTML = convertSecToText(time++);
    console.log('time');
    setTimeout(timer, 1000);
  }
  function convertSecToText(sec) {
    let text = '';
    let min = Math.floor(sec / 60);
    sec = sec % 60;

    if (min < 10) text += '0';
    text += min;
    text += ':';
    if (sec < 10) text += '0';
    text += sec;
    return text;
  }

  // === main ===

  click();


})();
