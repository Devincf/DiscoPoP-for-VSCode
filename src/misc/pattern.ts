import * as vscode from 'vscode';


export class Pattern{
    public startLine: number = 0;
    public endLine: number = 0;
    public startIndex: number = 0;
    public endIndex: number = 0;
    public active: boolean = true;

    public type: string = "";
    public decorationType: vscode.TextEditorDecorationType;
    public diagnosticText: string = "";


    public data: any;


    public text: string;

    constructor(startLine: number, startIndex: number, endLine: number, endIndex:number, text: string, decorationType: vscode.TextEditorDecorationType){
        this.startLine = startLine;
        this.startIndex = startIndex;
        this.endLine = endLine;
        this.endIndex = endIndex;
        this.text = text;
        this.decorationType = decorationType;
    }
}