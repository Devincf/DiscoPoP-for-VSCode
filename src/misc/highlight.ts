import * as vscode from 'vscode';


export class Highlight{
    public startLine: number;
    public endLine: number;
    public startIndex: number;
    public endIndex: number;

    public text: string;

    constructor(startLine: number, startIndex: number, endLine: number, endIndex:number, text: string){
        this.startLine = startLine;
        this.startIndex = startIndex;
        this.endLine = endLine;
        this.endIndex = endIndex;
        this.text = text;
    }
}