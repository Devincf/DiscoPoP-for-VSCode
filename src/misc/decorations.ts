/* eslint-disable @typescript-eslint/naming-convention */

import * as vscode from 'vscode';
export class Decorations {
    static DO_ALL = vscode.window.createTextEditorDecorationType({
        borderWidth: '1px',
        borderStyle: 'solid',
        backgroundColor: '#C0C0C010',
        overviewRulerColor: '#C0C0C0',
        overviewRulerLane: vscode.OverviewRulerLane.Right,
        light: {
            // this color will be used in light color themes
            borderColor: 'blue'
        },
        dark: {
            // this color will be used in dark color themes
            borderColor: 'blue'
        }
    });
    static REDUCTION = vscode.window.createTextEditorDecorationType({
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: '#cc000010',
        backgroundColor: '#C0C0C010',
        overviewRulerColor: '#C0C0C0',
        overviewRulerLane: vscode.OverviewRulerLane.Right,
        light: {
            // this color will be used in light color themes
            borderColor: 'red'
        },
        dark: {
            // this color will be used in dark color themes
            borderColor: 'red'
        }
    });

    private static HEATMAP_GREEN = vscode.window.createTextEditorDecorationType({
        backgroundColor: '#00ff0010',
        overviewRulerColor: '#00ff0010',
        overviewRulerLane: vscode.OverviewRulerLane.Right
    });
    private static HEATMAP_ORANGE = vscode.window.createTextEditorDecorationType({
        backgroundColor: '#ffa50010',
        overviewRulerColor: '#ffa50010',
        overviewRulerLane: vscode.OverviewRulerLane.Right
    });
    private static HEATMAP_RED = vscode.window.createTextEditorDecorationType({
        backgroundColor: '#ff000010',
        overviewRulerColor: '#ff000010',
        overviewRulerLane: vscode.OverviewRulerLane.Right
    });


    static get(key: string) {
        switch (key) {
            case 'do_all':
            default:
                return this.DO_ALL;
            case 'reduction':
                return this.REDUCTION;
            case 'pipeline':
                return this.DO_ALL;
            case 'geometric_decomposition':
                return this.DO_ALL;
        }
    }

    static getHeatmapDecoration(level: number) {
        switch(level){
            default:
            case 0: return this.HEATMAP_GREEN;
            case 1: return this.HEATMAP_ORANGE;
            case 2: return this.HEATMAP_RED;
        }
    }
}