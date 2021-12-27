import { FileManager } from "./filemanager";
import { Heatmap } from "./heatmap";
import { Pattern } from "./pattern";

export class File {
    id: number = 0;
    path: string = "";
    dataxml: string = "";

    makefileGenerated: boolean = false;

    patterns: Pattern[] = [];
    heatmaps: Heatmap[] = [];

    updateDataXML(xml: string) {
        this.dataxml = xml;
    }

    addLoopHeatmap(heatmap: Heatmap) {
        this.heatmaps.push(heatmap);
        //TODO: Change all to heatmaps
    }

    incrementHeatmapLinesAfterLine(line: number) {
        this.heatmaps.forEach(hl => {
            if (hl.startLine > line) {
                hl.startLine += 1; hl.endLine += 1;
            } else if (hl.startLine <= line) {
                if (hl.endLine > line) {
                    hl.endLine += 1;
                }
            }
        });
    }
    decrementHeatmapLinesAfterLine(line: number) {
        this.heatmaps.forEach(hl => {
            if (hl.startLine > line) {
                hl.startLine -= 1; hl.endLine -= 1;
            } else if (hl.startLine <= line) {
                if (hl.endLine > line) {
                    hl.endLine -= 1;
                }
            }
        });
    }

    deactivateHeatmapAtLine(line: number) {
        let heatmap = this.heatmaps.find(hl => hl.startLine === line);
        heatmap!.active = false;
        FileManager.writeToConfigFile();
    }
    activateHeatmapAtLine(line: number) {
        let heatmap = this.heatmaps.find(hl => hl.startLine === line + 1);
        heatmap!.active = true;
    }
    removeAllHeatmaps() {
        this.heatmaps = [];
    }


    addHighlight(highlight: Pattern) {
        if (this.patterns.find((pattern) => {
            return pattern.type === highlight.type &&
                pattern.startLine === highlight.startLine &&
                pattern.startIndex === highlight.startIndex &&
                pattern.endLine === highlight.endLine &&
                pattern.endIndex === highlight.endIndex;
        })) {
            return;
        }
        this.patterns.push(highlight);
    }

    getPatternAtLine(line: number, type?: string) {
        const a = this.patterns.filter((pat)=> pat.type === type).find((pattern) => {
            return line >= pattern.startLine && line <= pattern.endLine;
        });
        return a;
    }
    getPatternAtLineTest(line: number, type?: string) {
        const a = this.patterns.filter((pat)=> pat.type === type).find((pattern) => {
            return line === pattern.startLine;
        });
        return a;
    }

    /*removeHighlightAtRange(range: vscode.Range) {
        this.highlights = this.highlights.filter(highlight => !(highlight.startLine === range.start.line && highlight.startIndex === range.start.character));
        FileManager.writeToConfigFile();
    }

    removeHighlightAtLine(line: number) {
        this.highlights = this.highlights.filter(hl => !(line >= hl.startLine && line <= hl.endLine));
        FileManager.writeToConfigFile();
    }*/
    removeAllHighlights() {
        this.patterns = [];
    }

    incrementHighlightLinesAfterLine(line: number) {
        this.patterns.forEach(hl => {
            if (hl.startLine > line) {
                hl.startLine += 1; hl.endLine += 1;
            } else if (hl.startLine <= line) {
                if (hl.endLine > line) {
                    hl.endLine += 1;
                }
            }
        });
    }
    decrementHighlightLinesAfterLine(line: number) {
        this.patterns.forEach(hl => {
            if (hl.startLine > line) {
                hl.startLine -= 1; hl.endLine -= 1;
            } else if (hl.startLine <= line) {
                if (hl.endLine > line) {
                    hl.endLine -= 1;
                }
            }
        });
    }

    getHighlightAtLine(line: number) {
        return this.patterns.find(hl => line >= hl.startLine && line <= hl.endLine);
    }

    deactivateHighlightAtLine(line: number) {
        let highlight = this.patterns.find(hl => hl.startLine === line);
        if(highlight){
            highlight.active = false;
        }
    }
    activateHighlightAtLine(line: number) {
        let highlight = this.patterns.find(hl => hl.startLine === line);
        if(highlight){
            highlight.active = true;
        }
    }

    removeAllMeta() {
        this.removeAllHighlights();
        this.removeAllHeatmaps();
    }
}