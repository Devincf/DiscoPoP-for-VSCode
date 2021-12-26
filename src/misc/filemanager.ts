import * as fs from "fs";
import { hasUncaughtExceptionCaptureCallback } from "process";
import * as vscode from 'vscode';


import { Heatmap } from "./heatmap";
import { Pattern } from "./pattern";


function replacer(key: any, value: any) {
    if (value instanceof Map) {
        return {
            dataType: 'Map',
            value: Array.from(value.entries()), // or with spread: value: [...value]
        };
    } else if (value instanceof File) {
        return {
            dataType: 'File',
            value: JSON.stringify(value),
        };
    } else {
        return value;
    }
}

function reviver(key: any, value: any) {
    if (typeof value === 'object' && value !== null) {
        if (value.dataType === 'Map') {
            return new Map(value.value);
        } else if (value.dataType === 'File') {
            let file = new File();
            Object.assign(file, JSON.parse(value.value));
            return file;
        }
    }
    return value;
}

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

export class FileManager {

    static files: Map<number, File> = new Map<number, File>();
    public static folderPath: string = vscode.workspace.workspaceFolders![0].uri.path;
    static configExisted: boolean = false;

    static loadFile(path: string, id: number) {
        let file = this.files.get(id);
        if (file === undefined) {
            file = new File();
            file.id = id;
            file.path = path;
            if (fs.existsSync(`${this.folderPath}/Makefile`)) {
                file.makefileGenerated = true;
            }
            if (fs.existsSync(`${this.folderPath}/discopop-tmp/${id}/Data.xml`)) {
                file.dataxml = fs.readFileSync(`${this.folderPath}/discopop-tmp/${id}/Data.xml`).toString();
            }
            //this.files.set(id, file);
        }
        return file;
    }

    static getFiles() {
        return this.files;
    }

    static getFile(id: number) {
        return this.files.get(id);
    }

    static getFileFromName(fileName: string) {
        return this.pathExists(fileName);
    }

    static getFileId(fileName: string) {
        return this.getFileFromName(fileName)?.id;
    }

    static pathExists(path: string) {
        return Array.from(this.files.values()).find((value) => {
            return value.path === path;
        });
    }

    static reloadFileMapping() {
        let newMap = new Map<number, File>();
        if (fs.existsSync(`${this.folderPath}/discopop-tmp/FileMapping.txt`)) {
            const filemapping = fs.readFileSync(`${this.folderPath}/discopop-tmp/FileMapping.txt`).toString();
            filemapping.split('\n').filter((el) => el !== '').forEach((fileStr) => {
                //console.log(fileStr);
                const fileStrSplit = fileStr.split('\t');
                const path = fileStrSplit[1];
                const newId = parseInt(fileStrSplit[0]);
                let file = this.pathExists(path);
                if (file !== undefined) {
                    file.id = newId;
                    newMap.set(newId, file);
                } else {
                    const newFile = this.loadFile(path, newId);
                    newMap.set(newId, newFile);
                }
            });
            this.files = newMap;
        }
        this.writeToConfigFile();
    }
    static writeToConfigFile() {
        if(!fs.existsSync(`${this.folderPath}/discopop-tmp/discopop_config2.json`) && this.configExisted){
            //got deleted some time... what do?
            this.configExisted = false;
            return false;
        }
        fs.writeFileSync(`${this.folderPath}/discopop-tmp/discopop_config2.json`, JSON.stringify(this.files, replacer));
        this.configExisted = true;
        return true;
    }

    static hasData(){
        return Array.from(this.files.values()).find((value) => {
            return value.heatmaps.length>0 || value.patterns.length>0;
        }) !== undefined;
    }

    static init() {
        if (fs.existsSync(`${this.folderPath}/discopop-tmp/discopop_config2.json`)) {
            const jsonObject = JSON.parse(fs.readFileSync(`${this.folderPath}/discopop-tmp/discopop_config2.json`).toString(), reviver);
            this.files = jsonObject;
            this.configExisted = true;
        } else {
            this.reloadFileMapping();
            this.writeToConfigFile();
        }
    }

}