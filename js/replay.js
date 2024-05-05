import { OthelloBoard } from './othelloBoard.js';

export class ReplayOthello {
    constructor(transcript){
        this.replayBoard = new OthelloBoard;
        this.replayBoard.playline(transcript);
        this.putBoard = new OthelloBoard;
        this.transcript = transcript;
        this.nowIndex = this.transcript.length/2;
        this.setBoardFlg = 0;
    }
    undo(){
        if (this.nowIndex>0) {
            this.replayBoard.undo();
            this.nowIndex -= 1;
        }
        
    }
    next(){
        if(this.replayBoard.Put(this.replayBoard.coordinateToBit(this.transcript.slice(2*this.nowIndex,2*this.nowIndex+1),this.transcript.slice(2*this.nowIndex+1,2*this.nowIndex+2)))){
            this.nowIndex += 1;
        }
    }
    goToStart(){
        if(this.transcript != ""){
            this.replayBoard.new();
            this.nowIndex = 0;
        }
    }
    goToEnd(){
        if(this.transcript !=""){
            this.replayBoard.new();
            this.replayBoard.playline(this.transcript);
            this.nowIndex = this.transcript.length/2;
        }
        
    }
    getReplayBoard(){
        return this.replayBoard;
    }
    setBoard(playerBoard, opponentBoard, isBlackTurn){
        this.setBoardFlg = 1;
        this.replayBoard.setBoard(playerBoard, opponentBoard, isBlackTurn);
    }
}