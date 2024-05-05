import { OthelloBoard } from './othelloBoard.js';

export class ReplayOthello {
    constructor(transcript){
        this.replayBoard = new OthelloBoard;
        this.replayBoard.playline(transcript);
        this.putBoard = new OthelloBoard;
        this.transcript = transcript;
        this.nowIndex = this.transcript.length/2;
    }
    undo(){
        this.replayBoard.undo();
        this.nowIndex -= 1;
    }
    next(){
        this.replayBoard.Put(this.replayBoard.coordinateToBit(this.transcript.slice(2*this.nowIndex,2*this.nowIndex+1),this.transcript.slice(2*this.nowIndex+1,2*this.nowIndex+2)));
        this.nowIndex += 1;
    }
    goToStart(){
        this.replayBoard.new();
        this.nowIndex = 0;
    }
    goToEnd(){
        this.replayBoard.new();
        this.replayBoard.playline(this.transcript);
        this.nowIndex = this.transcript.length/2;
    }
    getReplayBoard(){
        return this.replayBoard;
    }
}