"use strict"
import { OthelloBoard } from './othelloBoard.js';
import { ReplayOthello } from './replay.js';

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

window.onload = function() {
    const cells = document.querySelectorAll('#myBoard td[name="coordinate"]');
    const urlParams = new URLSearchParams(window.location.search);
    const transcript = urlParams.get('transcript');
    const startBoard = urlParams.get('start_board');
    const startColor = urlParams.get('start_color');

    replayOthello = initializeReplayOthello(transcript, startBoard, startColor, othelloBoard);
    setupEventListeners(replayOthello, othelloBoard, cells);
    displayBoard(replayOthello.getReplayBoard());
};

function initializeReplayOthello(transcript, startBoard, startColor, othelloBoard) {
    if (transcript) {
        return new ReplayOthello(transcript.toUpperCase());
    } else if (startBoard) {
        document.getElementById("putCheckbox").checked=true;
        const { xBits, oBits } = parseBoardState(startBoard);
        replayOthello = new ReplayOthello("")
        replayOthello.setBoard(startColor === "white" ? oBits : xBits, startColor === "white" ? xBits : oBits, startColor === "white" ? 0 : 1);
        return replayOthello
    } else {
        console.error("No transcript or start board provided in the URL.");
        return new ReplayOthello("");
    }
}

function setupEventListeners(replayOthello, othelloBoard, cells) {
    document.getElementById("putCheckbox").addEventListener('change', function() {
        canPutState = this.checked;
        updateEventListeners(canPutState, replayOthello, othelloBoard, cells);
    });
    canPutState = document.getElementById("putCheckbox").checked
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
    if(canPutState){
        switch (buttonId) {
            case "undobutton": othelloBoard.undo(); displayBoard(othelloBoard); break;
            case "nextbutton": othelloBoard.next(); displayBoard(othelloBoard); break;
            case "newbutton": if (!canPutState) othelloBoard.goToStart(); displayBoard(othelloBoard); break; //未実装
            case "endbutton": if (!canPutState) othelloBoard.goToEnd(); displayBoard(othelloBoard); break; //未実装
            case "solvebutton": solve(othelloBoard); break;
        }
    } else {
        switch (buttonId) {
            case "undobutton": replayOthello.undo(); displayBoard(replayOthello.getReplayBoard()); break;
            case "nextbutton": replayOthello.next(); displayBoard(replayOthello.getReplayBoard()); break;
            case "newbutton": replayOthello.goToStart(); displayBoard(replayOthello.getReplayBoard()); break;
            case "endbutton": replayOthello.goToEnd(); displayBoard(replayOthello.getReplayBoard()); break;
            case "solvebutton": solve(replayOthello.getReplayBoard()); break;
        }
    }    
}

function updateEventListeners(canPutState, replayOthello, othelloBoard, cells) {
    ["undobutton", "nextbutton", "newbutton", "endbutton", "solvebutton"].forEach(buttonId => {
        const button = document.getElementById(buttonId);
        button.removeEventListener('click', buttonHandlers[buttonId]);
        button.addEventListener('click', buttonHandlers[buttonId]);
    });

    if (canPutState) {
        othelloBoard.new();
        if (replayOthello.setBoardFlg) {
            othelloBoard.setBoard(replayOthello.getReplayBoard().playerBoard, replayOthello.getReplayBoard().opponentBoard, replayOthello.getReplayBoard().nowTurn)
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

function disableClicks(cells, othelloBoard) {
    cells.forEach(cell => {
        // Use the same handler reference for removal
        cell.removeEventListener('click', cell.handler);
        cell.style.backgroundColor = 'rgb(57, 178, 110)';
    });
}

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


function displayBoard(board) {
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

function solve(board) {
    if (board.blankcount() <= 12) {
        let dict = board.eval();
        for (let key in dict) {
            const cell = document.getElementById(key);
            cell.className = "evalmode";
            cell.textContent = (2 * dict[key] - 64) * board.nowTurn / board.BLACK_TURN;
        }
    } else {
        alert("完全読みは49手目以降で利用可能です.");
    }
}
