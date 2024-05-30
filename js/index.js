"use strict"
import { OthelloBoard } from './othelloBoard.js';
import { ReplayOthello } from './replay.js';

// -XO形式の board string を解釈して、bit board 形式に変換する
function parseBoardState(boardString) {
    if (boardString.length !== 64) {
        throw new Error("Input string must be exactly 64 characters long.");
    }
    let xBits = 0n, oBits = 0n;
    for (let i = 0; i < 64; i++) {
        const bitPosition = 63 - i;
        const char = boardString[i];
        if (char === 'X') xBits |= (1n << BigInt(bitPosition));
        else if (char === 'O') oBits |= (1n << BigInt(bitPosition));
    }
    return { xBits, oBits };
}

let canPutState = false; // 状態管理用の変数
let othelloBoard = new OthelloBoard();
let replayOthello;
let playerColor = othelloBoard.BLACK_TURN;
let gameMode;

window.onload = function() {
    const cells = document.querySelectorAll('#myBoard td[name="coordinate"]');
    const urlParams = new URLSearchParams(window.location.search);
    const transcript = urlParams.get('transcript');
    const startBoard = urlParams.get('start_board');
    const startColor = urlParams.get('start_color');
    gameMode = urlParams.get('game_mode') === 'on';

    replayOthello = initializeReplayOthello(transcript, startBoard, startColor, gameMode, othelloBoard);
    setupEventListeners(gameMode, replayOthello, othelloBoard, cells);
    displayBoard(replayOthello.getReplayBoard());
};

// url から transcript または start_board と start_color を取得して、ReplayOthello クラスを初期化してインスタンスを返却する
// start_board で初期化する場合には、othelloboard にも setBoard メソッドで初期化を行う。初期手番のデフォルトは黒のため、whiteかどうかで判定する。
// 対局モード用の手番は、startColorから判断する。空きマスが13個以上の場合には、対局モードを解除する
function initializeReplayOthello(transcript, startBoard, startColor, gameMode, othelloBoard) {
    if (transcript) {
        return new ReplayOthello(transcript.toUpperCase());
    } else if (startBoard) {
        document.getElementById("putCheckbox").checked=true;
        const { xBits, oBits } = parseBoardState(startBoard);
        replayOthello = new ReplayOthello("")
        replayOthello.setBoard(startColor === "white"  ? oBits:xBits,  startColor === "white"  ? xBits : oBits, startColor === "white" ? 0 : 1);
        othelloBoard.setBoard(startColor === "white"  ? oBits:xBits,  startColor === "white"  ? xBits : oBits, startColor === "white" ? 0 : 1);
        playerColor = startColor === "white"  ? othelloBoard.WHITE_TURN:othelloBoard.BLACK_TURN;
        if(othelloBoard.blankcount() > 12) {
            gameMode = false;
        }
        return replayOthello
    } else {
        console.error("No transcript or start board provided in the URL.");
        return new ReplayOthello("");
    }
}

function setupEventListeners(gameMode, replayOthello, othelloBoard, cells) {
    const putCheckbox = document.getElementById("putCheckbox");
    
    // gameModeがtrueの場合、チェックボックスを常にcheckedに設定し、それ以上の変更を不可にする
    if (gameMode) {
        putCheckbox.checked = true;
        putCheckbox.disabled = true;
        canPutState = true; // canPutStateをtrueに固定
        document.getElementById("newbutton").disabled = true;
        document.getElementById("endbutton").disabled = true;
        document.getElementById("undobutton").disabled = true;
        document.getElementById("nextbutton").disabled = true;
        document.getElementById("solvebutton").disabled = true;
    } else {
        // gameModeがfalseの場合、通常通りチェックボックスの変更を許可
        putCheckbox.addEventListener('change', function() {
            canPutState = this.checked;
            updateEventListeners(canPutState, replayOthello, othelloBoard, cells);
            document.getElementById("newbutton").disabled = canPutState;
            document.getElementById("endbutton").disabled = canPutState;
        });
    }

    // ボタンの無効化状態を更新
    canPutState = putCheckbox.checked; // 初期状態のcanPutStateを設定
    document.getElementById("newbutton").disabled = canPutState;
    document.getElementById("endbutton").disabled = canPutState;
    updateEventListeners(canPutState, replayOthello, othelloBoard, cells);
}

// ボタンごとのハンドラーを格納するオブジェクト
const buttonHandlers = {
    "undobutton": function() { handleButtonClick("undobutton"); },
    "nextbutton": function() { handleButtonClick("nextbutton"); },
    "newbutton": function() { handleButtonClick("newbutton"); },
    "endbutton": function() { handleButtonClick("endbutton"); },
    "solvebutton": function() { handleButtonClick("solvebutton"); }
};

function handleButtonClick(buttonId) {
    // gameModeがtrueの場合、指定された5つのボタンを無効にする
    if (canPutState && gameMode) {
        const buttonIds = ["undobutton", "nextbutton", "newbutton", "endbutton", "solvebutton"];
        buttonIds.forEach(id => {
            const button = document.getElementById(id);
            if (button) button.disabled = true;
        });
        return; // これ以上の処理を行わない
    }

    if (canPutState) {
        switch (buttonId) {
            case "undobutton": othelloBoard.undo(); displayBoard(othelloBoard); break;
            case "nextbutton": othelloBoard.next(); displayBoard(othelloBoard); break;
            case "newbutton": if (!canPutState) othelloBoard.goToStart(); displayBoard(othelloBoard); break; //未実装
            case "endbutton": if (!canPutState) othelloBoard.goToEnd(); displayBoard(othelloBoard); break; //未実装
            case "solvebutton": solve(othelloBoard); break;
        }
    } else {
        switch (buttonId) {
            case "undobutton": replayOthello.undo(); displayBoard(replayOthello.getReplayBoard(),gameMode); break;
            case "nextbutton": replayOthello.next(); displayBoard(replayOthello.getReplayBoard(),gameMode); break;
            case "newbutton": replayOthello.goToStart(); displayBoard(replayOthello.getReplayBoard(),gameMode); break;
            case "endbutton": replayOthello.goToEnd(); displayBoard(replayOthello.getReplayBoard(),gameMode); break;
            case "solvebutton": solve(replayOthello.getReplayBoard()); break;
        }
    }    
}


// board の click イベントの更新
// put mode の内部では othelloBoard を動かして表示する
// 再生モードでは replayBoard を表示する
function updateEventListeners(canPutState, replayOthello, othelloBoard, cells) {
    ["undobutton", "nextbutton", "newbutton", "endbutton", "solvebutton"].forEach(buttonId => {
        const button = document.getElementById(buttonId);
        button.removeEventListener('click', buttonHandlers[buttonId]);
        button.addEventListener('click', buttonHandlers[buttonId]);
    });

    if (canPutState) {
        othelloBoard.new();
        if (replayOthello.setBoardFlg) {
            othelloBoard.setBoard(replayOthello.getReplayBoard().playerBoard, replayOthello.getReplayBoard().opponentBoard, replayOthello.getReplayBoard().nowTurn === replayOthello.getReplayBoard().BLACK_TURN)
        } else {
            othelloBoard.playline(replayOthello.getReplayBoard().Kifu());
        }
        
        enableClicks(cells, othelloBoard);
        displayBoard(othelloBoard)
    } else {
        disableClicks(cells, othelloBoard);
        displayBoard(replayOthello.getReplayBoard())
    }
}

// putと再生は UI では背景色で区別される
// すでに定義されている handler を削除して、新たに定義する
function enableClicks(cells, othelloBoard) {
    cells.forEach(cell => {
        cell.style.backgroundColor = 'rgb(35, 166, 196)';
        // Remove any previously added listeners to avoid duplicates
        cell.removeEventListener('click', cell.handler);
        // Define a handler function that can be referenced later for removal
        cell.handler = function() { cellClick(cell, othelloBoard); };
        // Add the handler to the cell
        cell.addEventListener('click', cell.handler);
    });
}

// putと再生は UI では背景色で区別される
// すでに定義されている handler を削除する
function disableClicks(cells, othelloBoard) {
    cells.forEach(cell => {
        // Use the same handler reference for removal
        cell.removeEventListener('click', cell.handler);
        cell.style.backgroundColor = 'rgb(57, 178, 110)';
    });
}

// put による盤面処理は othelloBoard が担う
function cellClick(cell, othelloBoard) {
    // Get the index of the cell within the board
    let rowIndex = Array.from(cell.parentNode.children).indexOf(cell);
    let rowParentIndex = Array.from(cell.parentNode.parentNode.children).indexOf(cell.parentNode);
    let index = (rowParentIndex-1) * 8 + rowIndex-1;
    let mask = 0x8000000000000000n >> BigInt(index);
    if (othelloBoard.Put(mask)) {
        displayBoard(othelloBoard);
    }
}

function updateBoardDisplay(board) {
    const cells = document.querySelectorAll('#myBoard td[name="coordinate"]');
    let mask = 0x8000000000000000n;
    cells.forEach((cell, index) => {
        if ((board.playerBoard & (mask >> BigInt(index))) !== 0n) {
            cell.className = board.nowTurn === board.BLACK_TURN ? "kuro" : "shiro";
        } else if ((board.opponentBoard & (mask >> BigInt(index))) !== 0n) {
            cell.className = board.nowTurn === board.WHITE_TURN ? "kuro" : "shiro";
        } else {
            cell.className = "";
        }
        cell.innerHTML = "";
    });

    document.getElementById("blackdisc").textContent = String(board.bitCount(board.playerBoard));
    document.getElementById("whitedisc").textContent = String(board.bitCount(board.opponentBoard));
}

function displayBoard(board) {
    updateBoardDisplay(board);

    if (gameMode) {
        document.querySelectorAll('#myBoard td[name="coordinate"]').forEach(el => el.disabled = true);

        // 0.5秒ごとに指定の処理を繰り返す
        const intervalID = setInterval(() => {
            if (board.nowTurn !== playerColor) {
                board.playBest();
                updateBoardDisplay(board);
            } else {
                // 条件が満たされない場合、定期的な処理を停止し、入力を再び有効にする
                clearInterval(intervalID);
                document.querySelectorAll('#myBoard td[name="coordinate"], button').forEach(el => {
                    el.disabled = false;
                });
            }
        }, 500);
    }
    else {
        document.getElementById("solvebutton").disabled = gameMode || (board.blankcount() > 12);
    }
}

function solve(board) {
    if (board.blankcount() <= 12) {
        let dict = board.eval();
        for (let key in dict) {
            const cell = document.getElementById(key);
            cell.className = "evalmode";
            cell.textContent = dict[key] * board.nowTurn / board.BLACK_TURN;
        }
    } else {
        alert("完全読みは49手目以降で利用可能です.");
    }
}
