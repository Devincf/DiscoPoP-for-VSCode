import * as vscode from 'vscode';


export class Heatmap{
    public startLine: number;
    public endLine: number;
    public level: number;
    public active: boolean;

    constructor(startLine: number, endLine: number, level: number){
        this.startLine = startLine;
        this.endLine = endLine;
        this.level = level;
        this.active = true;
    }
}