/* eslint-disable @typescript-eslint/naming-convention */

import * as vscode from 'vscode';
export class Decorations {
    static DO_ALL = vscode.window.createTextEditorDecorationType({
        backgroundColor: '#C0C0C010',
        overviewRulerColor: '#C0C0C0',
        overviewRulerLane: vscode.OverviewRulerLane.Right
    });
    static REDUCTION = vscode.window.createTextEditorDecorationType({
        backgroundColor: '#e8ad0c10',
        overviewRulerColor: '#e8ad0c10',
        overviewRulerLane: vscode.OverviewRulerLane.Right
    });
    static PIPELINE = vscode.window.createTextEditorDecorationType({
        backgroundColor: '#ffff0010',
        overviewRulerColor: '#ffff0010',
        overviewRulerLane: vscode.OverviewRulerLane.Right
    });
    static GEOMETRIC = vscode.window.createTextEditorDecorationType({
        backgroundColor: '#33cc3310',
        overviewRulerColor: '#33cc3310',
        overviewRulerLane: vscode.OverviewRulerLane.Right
    });

    private static HEATMAP_GREEN = vscode.window.createTextEditorDecorationType({
        overviewRulerLane: vscode.OverviewRulerLane.Right,
        borderWidth: '1px',
        borderStyle: 'dotted',
        light: {
            borderColor: '#00ff0040'
        },
        dark: {
            borderColor: '#00ff0040'
        }
    });
    private static HEATMAP_ORANGE = vscode.window.createTextEditorDecorationType({
        overviewRulerLane: vscode.OverviewRulerLane.Right,
        borderWidth: '1px',
        borderStyle: 'dashed',
        light: {
            // this color will be used in light color themes
            borderColor: '#ffa50040'
        },
        dark: {
            // this color will be used in dark color themes
            borderColor: '#ffa50040'
        }
    });
    private static HEATMAP_RED = vscode.window.createTextEditorDecorationType({
        overviewRulerLane: vscode.OverviewRulerLane.Right,
        borderWidth: '1px',
        borderStyle: 'solid',
        light: {
            // this color will be used in light color themes
            borderColor: '#ff000040'
        },
        dark: {
            // this color will be used in dark color themes
            borderColor: '#ff000040'
        }
    });


    static get(key: string) {
        switch (key) {
            case 'do_all':
            default:
                return this.DO_ALL;
            case 'reduction':
                return this.REDUCTION;
            case 'pipeline':
                return this.PIPELINE;
            case 'geometric_decomposition':
                return this.GEOMETRIC;
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