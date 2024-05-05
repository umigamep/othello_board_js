"use strict"
import { OthelloBoard } from './othelloBoard.js';
import { ReplayOthello } from './replay.js';



window.onload = function(){
    // //tableの要素をとってくる
    let $tableElements = document.getElementsByName('coordinate');
    let canPutState = 0;
    let othelloBoard = new OthelloBoard();

    // transcript パラメータを取得して ReplayBoard を初期化
    // 現在のURLからクエリパラメータを取得
    const urlParams = new URLSearchParams(window.location.search);
    const transcript = urlParams.get('transcript').toUpperCase();

    if (transcript) {
        // transcriptが存在する場合、ReplayOthelloクラスを初期化
        const replayOthello = new ReplayOthello(transcript);
        displayBoard(replayOthello.getReplayBoard());

        let newbutton = document.getElementById("newbutton");
        newbutton.addEventListener('click',function(){
            if(canPutState) {

            } else {
                replayOthello.goToStart();
                displayBoard(replayOthello.getReplayBoard());
            }
        })

        let undobutton = document.getElementById("undobutton");
        undobutton.addEventListener('click',function(){
            if(canPutState) {
                othelloBoard.undo();
                displayBoard(othelloBoard);
            } else {
                replayOthello.undo();
                displayBoard(replayOthello.getReplayBoard());
            }
        });

        let nextbutton = document.getElementById("nextbutton");
        nextbutton.addEventListener('click',function(){
            if(canPutState) {
                othelloBoard.next();
                displayBoard(othelloBoard);
            } else {
                replayOthello.next();
                displayBoard(replayOthello.getReplayBoard());
            }
        });

        let endbutton = document.getElementById("endbutton");
        endbutton.addEventListener('click',function(){
            if(canPutState) {

            } else {
                replayOthello.goToEnd();
                displayBoard(replayOthello.getReplayBoard());
            }
        })

        var checkbox = document.getElementById('putCheckbox');
        var cells = document.querySelectorAll('#myBoard td[name="coordinate"]');
    
        // 盤の背景色変更用イベントリスナー
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                enableClicks(); // クリックイベントを有効化
            } else {
                disableClicks(); // クリックイベントを無効化
            }
        });

        let solvebutton = document.getElementById("solvebutton");
        solvebutton.addEventListener('click',solve);
    
        function enableClicks() {
            cells.forEach(cell => {
                cell.style.backgroundColor = 'rgb(35, 166, 196)';
            });
            othelloBoard.new();
            othelloBoard.playline(replayOthello.getReplayBoard().Kifu());
            for (let $i=0; $i < cells.length; $i++) {
                cells[$i].addEventListener('click', cellClick);
            }
            canPutState = 1;
        }
    
        function disableClicks() {
            cells.forEach(cell => {
                cell.removeEventListener('click', cellClick);
                cell.style.backgroundColor = 'rgb(57, 178, 110)';
            });
            displayBoard(replayOthello.getReplayBoard());
            canPutState = 0;
        }

        function cellClick(){
            //配列に変換する
            let cell_list = [].slice.call(cells);
            //クリックした位置の取得
            let index = cell_list.indexOf(this);
            
            if(putOthello(index)){
                displayBoard(othelloBoard);
            };
        }

        function putOthello(index) {
            let mask = 0x8000000000000000n;
            return othelloBoard.Put(mask >> BigInt(index));
        }

        function displayBoard(board){
            let mask = 0x8000000000000000n;
            let playercolor;
            let opponentcolor;
            let blackdisc,whitedisc;
            if(board.nowTurn==board.BLACK_TURN){
                playercolor = "kuro";
                opponentcolor = "shiro";
                blackdisc = board.bitCount(board.playerBoard);
                whitedisc = board.bitCount(board.opponentBoard);
            } else {
                playercolor = "shiro";
                opponentcolor = "kuro";
                whitedisc = board.bitCount(board.playerBoard);
                blackdisc = board.bitCount(board.opponentBoard);
            }
            for(let i = 0; i < 64; ++i){
                if((board.playerBoard & (mask >> BigInt(i))) == (mask >> BigInt(i))){
                    $tableElements[i].className = playercolor;
                } else if((board.opponentBoard & (mask >> BigInt(i))) == (mask >> BigInt(i))){
                    $tableElements[i].className = opponentcolor;
                } else{
                    $tableElements[i].className = "";
                }
                $tableElements[i].innerHTML = "";
            }
            //document.getElementById("nowkifu").innerHTML = board.Kifu();
            document.getElementById("blackdisc").innerHTML = String(blackdisc);
            document.getElementById("whitedisc").innerHTML = String(whitedisc);
        }

        function solve(){
            let board; 
            if(canPutState){
                board = othelloBoard;
            } else {
                board = replayOthello.getReplayBoard();
            }
            if(board.blankcount()<=10){
                let dict = board.eval();
                for(let key in dict){
                    document.getElementById(key).className="evalmode";
                    document.getElementById(key).innerHTML=(2*dict[key]-64)*board.nowTurn/board.BLACK_TURN;    
                }
            } else {
                alert("完全読みは50手目以降で利用可能です.");
            }
        }

    } else {
        // エラーハンドリング: transcriptが提供されていない場合の処理
        console.error("No transcript provided in the URL.");
    }
}
    