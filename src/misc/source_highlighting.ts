import * as fs from 'fs';
import * as vscode from 'vscode';
import { DiscoPoPViewProvider } from '../newnewdiscopop_webview_provider';
import { Heatmap } from './heatmap';
import { Pattern } from './pattern';
//import { Settings } from './settings';
import { FileManager } from './filemanager';
import { Decorations } from './decorations';
import { File } from './file';


export class SourceHighlighting {
    diagnostics: vscode.Diagnostic[] = [];

    //highlights: Map<string, Highlight[] | undefined> = new Map<string, Highlight[] | undefined>();
    //heatmaps: Map<string, Heatmap[] | undefined> = new Map<string, Heatmap[] | undefined>();

    decorationTypes: Map<number, vscode.TextEditorDecorationType> = new Map<number, vscode.TextEditorDecorationType>();

    timeout: NodeJS.Timer | undefined = undefined;

    oldText: string = "";
    discopopView: DiscoPoPViewProvider | undefined;

    lastDoc: vscode.TextDocument | undefined;
    lastCollection: any;

    constructor(extContext: vscode.ExtensionContext) {
        //source highlighting


        //this.highlights = [new Highlight(1, 5, 2, 10, "This is a test")];

        let activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            this.triggerUpdateDecorations();
        }

        vscode.window.onDidChangeActiveTextEditor(editor => {
            activeEditor = editor;
            if (editor) {
                this.triggerUpdateDecorations();
            }
        }, null, extContext.subscriptions);


        vscode.workspace.onDidChangeTextDocument(event => {
            if (activeEditor && event.document === activeEditor.document) {
                this.triggerUpdateDecorations();
            }
        }, null, extContext.subscriptions);
    }

    loadDataFromMakefileContent(value: File, key: number, forceReload?: boolean) {
        //load patterns.json
        if (fs.existsSync(`${this.discopopView?.folderPath}/discopop-tmp/patterns.json`)) {
            fs.readFile(`${this.discopopView?.folderPath}/discopop-tmp/patterns.json`, (err, data) => {
                if (err) {
                    throw err;
                }

                var obj = JSON.parse(data.toString());
                //value.removeAllHighlights();
                value.removeAllMeta();
                obj.reduction.forEach((element: any) => {
                    if (element.node_id.startsWith(key.toString())) {
                        //console.log(element);
                        value.addHighlight({
                            startLine: parseInt(element.start_line.split(':')[1]),
                            endLine: parseInt(element.end_line.split(':')[1]),
                            startIndex: 0,
                            endIndex: 1000,
                            active: true,
                            type: 'reduction',
                            decorationType: Decorations.DO_ALL,
                            diagnosticText: 'Insert reduction pragma',
                            text: 'Reduction',
                            data: element,
                        });
                        //value.addHighlight(new Highlight(parseInt(element.start_line.split(':')[1]) - 1, 0, parseInt(element.end_line.split(':')[1]) - 1, 1000, 'Do All Reduction'));
                    }
                });
                obj.do_all.forEach((element: any) => {
                    if (element.node_id.startsWith(key.toString())) {
                        //console.log(element);
                        value.addHighlight({
                            startLine: parseInt(element.start_line.split(':')[1]),
                            endLine: parseInt(element.end_line.split(':')[1]),
                            startIndex: 0,
                            endIndex: 1000,
                            active: true,
                            type: 'do_all',
                            decorationType: Decorations.DO_ALL,
                            diagnosticText: 'Insert do_all pragma',
                            text: 'Do All Reduction',
                            data: element,
                        });
                    }
                    //discopopView.sourceHighlighting.reload();
                });
                obj.pipeline.forEach((element: any) => {
                    if (element.node_id.startsWith(key.toString())) {
                        //console.log(element);
                        value.addHighlight({
                            startLine: parseInt(element.start_line.split(':')[1]),
                            endLine: parseInt(element.end_line.split(':')[1]),
                            startIndex: 0,
                            endIndex: 1000,
                            active: true,
                            type: 'pipeline',
                            decorationType: Decorations.DO_ALL,
                            diagnosticText: 'Insert pipeline stages',
                            text: 'Pipeline',
                            data: element,
                        });
                        //value.addHighlight(new Highlight(parseInt(element.start_line.split(':')[1]) - 1, 0, parseInt(element.end_line.split(':')[1]) - 1, 1000, 'Do All Reduction'));
                    }
                    //discopopView.sourceHighlighting.reload();
                });
                obj.geometric_decomposition.forEach((element: any) => {
                    if (element.node_id.startsWith(key.toString())) {
                        //console.log(element);
                        value.addHighlight({
                            startLine: parseInt(element.start_line.split(':')[1]),
                            endLine: parseInt(element.end_line.split(':')[1]),
                            startIndex: 0,
                            endIndex: 1000,
                            active: true,
                            type: 'geometric_decomposition',
                            decorationType: Decorations.DO_ALL,
                            diagnosticText: 'Insert geometric decomposition pragma',
                            text: 'Geometric Decomposition',
                            data: element,
                        });
                        //value.addHighlight(new Highlight(parseInt(element.start_line.split(':')[1]) - 1, 0, parseInt(element.end_line.split(':')[1]) - 1, 1000, 'Do All Reduction'));
                    }
                    //discopopView.sourceHighlighting.reload();
                });
            });
        }

        //load heatmaps
        if (fs.existsSync(`${this.discopopView?.folderPath}/loop_counter_output.txt`)) {
            fs.readFile(`${this.discopopView?.folderPath}/loop_counter_output.txt`, (err, data) => {
                if (err) {
                    throw err;
                }

                const dataxml = fs.readFileSync(`${this.discopopView?.folderPath}/Data.xml`).toString();

                const loops = data.toString().split('\n').slice(0, -1);
                value.removeAllHeatmaps();
                loops.forEach((loop: string) => {
                    const loopCounter = loop.split(' ');
                    const startLine = parseInt(loopCounter[1]);
                    const amount = parseInt(loopCounter[2]);

                    //find loop End in data.xml
                    const regexStr = `\<Node id="${key}:(.*)" type="2" name="(.*)" startsAtLine = "(.*):${startLine}" endsAtLine = "(.*):(.*)"`;
                    let regExp = new RegExp(regexStr);
                    const a = dataxml.match(regExp);
                    if (a) {
                        const lineEnd = parseInt(a![5]!);

                        value.addLoopHeatmap(new Heatmap(startLine, lineEnd, amount));
                    }
                });
            });
        }
    }

    loadDataNormally(value: File, key: number, forceReload?: boolean) {

        if (value.dataxml === '') {
            if (fs.existsSync(`${this.discopopView?.folderPath}/discopop-tmp/${key}/Data.xml`)) {
                value.updateDataXML(fs.readFileSync(`${this.discopopView?.folderPath}/discopop-tmp/${key}/Data.xml`).toString());
            }
        }

        if (!FileManager.hasData()) {
            if (fs.existsSync(`${this.discopopView?.folderPath}/discopop-tmp/${key}/patterns.json`)) {
                fs.readFile(`${this.discopopView?.folderPath}/discopop-tmp/${key}/patterns.json`, (err, data) => {
                    if (err) {
                        throw err;
                    }

                    var obj = JSON.parse(data.toString());
                    value.removeAllHighlights();
                    obj.reduction.forEach((element: any) => {
                        if (element.node_id.startsWith(key.toString())) {
                            //console.log(element);
                            value.addHighlight({
                                startLine: parseInt(element.start_line.split(':')[1]),
                                endLine: parseInt(element.end_line.split(':')[1]),
                                startIndex: 0,
                                endIndex: 1000,
                                active: true,
                                type: 'reduction',
                                decorationType: Decorations.DO_ALL,
                                diagnosticText: 'Insert reduction pragma',
                                text: 'Reduction',
                                data: element,
                            });
                            //value.addHighlight(new Highlight(parseInt(element.start_line.split(':')[1]) - 1, 0, parseInt(element.end_line.split(':')[1]) - 1, 1000, 'Do All Reduction'));
                        }
                    });
                    obj.do_all.forEach((element: any) => {
                        if (element.node_id.startsWith(key.toString())) {
                            //console.log(element);
                            value.addHighlight({
                                startLine: parseInt(element.start_line.split(':')[1]),
                                endLine: parseInt(element.end_line.split(':')[1]),
                                startIndex: 0,
                                endIndex: 1000,
                                active: true,
                                type: 'do_all',
                                decorationType: Decorations.DO_ALL,
                                diagnosticText: 'Insert do_all pragma',
                                text: 'Do All Reduction',
                                data: element,
                            });
                        }
                        //discopopView.sourceHighlighting.reload();
                    });
                    obj.pipeline.forEach((element: any) => {
                        if (element.node_id.startsWith(key.toString())) {
                            //console.log(element);
                            value.addHighlight({
                                startLine: parseInt(element.start_line.split(':')[1]),
                                endLine: parseInt(element.end_line.split(':')[1]),
                                startIndex: 0,
                                endIndex: 1000,
                                active: true,
                                type: 'pipeline',
                                decorationType: Decorations.DO_ALL,
                                diagnosticText: 'Insert pipeline stages',
                                text: 'Pipeline',
                                data: element,
                            });
                            //value.addHighlight(new Highlight(parseInt(element.start_line.split(':')[1]) - 1, 0, parseInt(element.end_line.split(':')[1]) - 1, 1000, 'Do All Reduction'));
                        }
                        //discopopView.sourceHighlighting.reload();
                    });
                    obj.geometric_decomposition.forEach((element: any) => {
                        if (element.node_id.startsWith(key.toString())) {
                            //console.log(element);
                            value.addHighlight({
                                startLine: parseInt(element.start_line.split(':')[1]),
                                endLine: parseInt(element.end_line.split(':')[1]),
                                startIndex: 0,
                                endIndex: 1000,
                                active: false,
                                type: 'geometric_decomposition',
                                decorationType: Decorations.DO_ALL,
                                diagnosticText: 'Insert geometric decomposition pragma',
                                text: 'Geometric Decomposition',
                                data: element,
                            });
                            //value.addHighlight(new Highlight(parseInt(element.start_line.split(':')[1]) - 1, 0, parseInt(element.end_line.split(':')[1]) - 1, 1000, 'Do All Reduction'));
                        }
                        //discopopView.sourceHighlighting.reload();
                    });
                });
            }
            if (fs.existsSync(`${this.discopopView?.folderPath}/discopop-tmp/${key}/loop_counter_output.txt`)) {
                fs.readFile(`${this.discopopView?.folderPath}/discopop-tmp/${key}/loop_counter_output.txt`, (err, data) => {
                    if (err) {
                        throw err;
                    }
                    const loops = data.toString().split('\n').slice(0, -1);
                    value.removeAllHeatmaps();
                    loops.forEach((loop: string) => {
                        const loopCounter = loop.split(' ');
                        const startLine = parseInt(loopCounter[1]);
                        const amount = parseInt(loopCounter[2]);

                        //find loop End in data.xml
                        const regexStr = `\<Node id="(.*)" type="2" name="(.*)" startsAtLine = "(.*):${startLine}" endsAtLine = "(.*):(.*)"`;
                        let regExp = new RegExp(regexStr);
                        const a = value.dataxml.match(regExp);
                        const lineEnd = parseInt(a![5]!);

                        value.addLoopHeatmap(new Heatmap(startLine, lineEnd, amount));
                    });
                });
            }
        }
    }

    loadData(forceReload: boolean = false) {
        if (this.discopopView) {
            //const files = Configuration.getFiles();
            const files = FileManager.getFiles();
            files?.forEach((value, key) => {
                if (value.makefileGenerated) {
                    // load from normal data ugh.
                    this.loadDataFromMakefileContent(value, key, forceReload);
                } else {
                    this.loadDataNormally(value, key, forceReload);
                }
            });
            this.refresh();
        }
    }

    refresh() {
        if (!FileManager.writeToConfigFile()) {
            this.loadData();
        }
        else if (this.lastDoc) {
            this.refreshDiagnostics(this.lastDoc, this.lastCollection);
            this.updateDecorations();
        }
    }

    refreshDiagnostics(doc: vscode.TextDocument, diagnosticCollection: vscode.DiagnosticCollection): void {
        //console.log("REFRESHING");
        this.lastDoc = doc;
        this.lastCollection = diagnosticCollection;

        //Load from file

        const diagnostics: vscode.Diagnostic[] = [];
        const file = FileManager.getFileFromName(doc.fileName);
        if (file) {

            if (this.discopopView) {
                //this.highlights.get(nameFromPath(this.discopopView.folderPath, doc.fileName))?.forEach((highlight) => {
                file.patterns.forEach((pattern) => {
                    if (pattern.active) {
                        diagnostics.push(this.createDeadCodeDiagnostic(pattern));
                    }
                });
            }

            diagnosticCollection.set(doc.uri, diagnostics);
            //console.log(diagnosticCollection);
        }

    }

    createDeadCodeDiagnostic(pattern: Pattern): vscode.Diagnostic {
        const range = new vscode.Range(pattern.startLine - 1, pattern.startIndex, pattern.endLine - 1, pattern.endIndex);

        const diagnostic = new vscode.Diagnostic(range, pattern.diagnosticText, vscode.DiagnosticSeverity.Information);
        diagnostic.code = pattern.type;
        diagnostic.source = 'DiscoPoP for VSCode';
        return diagnostic;
    }

    indexes(source: string, find: string) {
        if (!source) {
            return [];
        }
        // if find is empty string return all indexes.
        if (!find) {
            // or shorter arrow function:
            // return source.split('').map((_,i) => i);
            return source.split('').map(function (_, i) { return i; });
        }
        var result = [];
        for (let i = 0; i < source.length; ++i) {
            // If you want to search case insensitive use 
            // if (source.substring(i, i + find.length).toLowerCase() == find) {
            if (source.substring(i, i + find.length) === find) {
                result.push(i);
            }
        }
        return result;
    }


    /*createDiagnostic(doc: vscode.TextDocument, lineOfText: vscode.TextLine, lineIndex: number): vscode.Diagnostic {
        // find where in the line of thet the 'emoji' is mentioned
        const index = lineOfText.text.indexOf(EMOJI);
    
        // create range that represents, where in the document the word is
        const range = new vscode.Range(lineIndex, index, lineIndex, index + EMOJI.length);
    
        const diagnostic = new vscode.Diagnostic(range, "When you say 'emoji', do you want to find out more?",
            vscode.DiagnosticSeverity.Error);
        diagnostic.code = 'emoji_mention';
        return diagnostic;
    }*/
    subscribeToDocumentChanges(context: vscode.ExtensionContext, diagnosticCollection: vscode.DiagnosticCollection): void {
        if (vscode.window.activeTextEditor) {
            this.refreshDiagnostics(vscode.window.activeTextEditor.document, diagnosticCollection);
        }
        context.subscriptions.push(
            vscode.window.onDidChangeActiveTextEditor(editor => {
                if (editor) {
                    this.refreshDiagnostics(editor.document, diagnosticCollection);
                    this.oldText = editor.document.getText();
                }
            })
        );

        context.subscriptions.push(
            vscode.workspace.onDidChangeTextDocument(e => {
                //console.log(e.contentChanges);
                this.refreshDiagnostics(e.document, diagnosticCollection);

                const newText = e.document.getText();

                if (e.contentChanges.length === 0) {
                    this.oldText = newText;
                    return;
                }
                let refreshAfter = false;

                let fileName = e.document.fileName;
                const file = FileManager.getFileFromName(fileName);
                /*if (this.discopopView) {
                    fileName = nameFromPath(this.discopopView.folderPath, e.document.fileName);
                }*/
                if (file) {

                    if (this.oldText !== '') {

                        if (this.oldText === newText) {
                            //console.log("SAME TEXT???");
                        }


                        //find new newlines
                        const newlinesOld = this.indexes(this.oldText, '\n');
                        const newlinesNew = this.indexes(newText, '\n');

                        if (newlinesNew.length > newlinesOld.length) {
                            let newNewLine = 0;
                            for (let i = 0; i < newlinesNew.length; i++) {
                                if (newlinesNew[i] !== newlinesOld[i]) {
                                    newNewLine = newlinesNew[i];
                                    break;
                                }
                            }
                            //const newNewline = newlinesNew.filter(pragma => newlinesOld.findIndex(el => el + 1 === pragma) === -1)[0];
                            console.log("new Newline added at position " + newNewLine);
                            const line = e.document.positionAt(newNewLine).line;
                            file.incrementHighlightLinesAfterLine(line);
                            file.incrementHeatmapLinesAfterLine(line);
                            refreshAfter = true;
                        } else if (newlinesNew.length < newlinesOld.length) {
                            let removedNewLine = 0;
                            for (let i = 0; i < newlinesNew.length; i++) {
                                if (newlinesNew[i] !== newlinesOld[i]) {
                                    removedNewLine = newlinesNew[i];
                                    break;
                                }
                            }
                            //const newNewline = newlinesNew.filter(pragma => newlinesOld.findIndex(el => el + 1 === pragma) === -1)[0];
                            console.log("new Newline removed at position " + removedNewLine);
                            const line = e.document.positionAt(removedNewLine).line;
                            file.decrementHighlightLinesAfterLine(line);
                            file.decrementHeatmapLinesAfterLine(line);
                            refreshAfter = true;
                        }

                        //find new pragmas
                        const pragmasOld = this.indexes(this.oldText, '#pragma omp');
                        const pragmasNew = this.indexes(newText, '#pragma omp');

                        if (pragmasNew.length > pragmasOld.length) {

                            //const newPragma = pragmasNew.filter(pragma => pragmasOld.findIndex(el => el === pragma || el + 25 === pragma) === -1)[0];

                            let newPragma = 0;
                            for (let i = 0; i < pragmasNew.length; i++) {
                                if (pragmasNew[i] !== pragmasOld[i]) {
                                    newPragma = pragmasNew[i];
                                    break;
                                }
                            }
                            console.log("new Pragma added at position " + newPragma);
                            const pos = e.document.positionAt(newPragma);
                            //this.removeHighlightAtLine(fileName,e.document.positionAt(newPragma).line);
                            file.deactivateHighlightAtLine(pos.line + 2);
                            refreshAfter = true;
                        }

                        if (pragmasNew.length < pragmasOld.length) {

                            //const newPragma = pragmasNew.filter(pragma => pragmasOld.findIndex(el => el === pragma || el + 25 === pragma) === -1)[0];

                            let newPragma = 0;
                            for (let i = 0; i < pragmasOld.length; i++) {
                                if (pragmasOld[i] !== pragmasNew[i]) {
                                    newPragma = pragmasOld[i];
                                    break;
                                }
                            }
                            console.log("Pragma removed at position " + newPragma);
                            const pos = e.document.positionAt(newPragma);
                            file.activateHighlightAtLine(pos.line + 1);
                            //this.removeHighlightAtLine(fileName,e.document.positionAt(newPragma).line);
                            refreshAfter = true;
                        }

                    }

                    this.oldText = newText;
                }

                if (refreshAfter) {
                    this.refresh();
                }
            })
        );

        context.subscriptions.push(
            vscode.workspace.onDidCloseTextDocument(doc => diagnosticCollection.delete(doc.uri))
        );
    }

    //code highlighting

    updateDecorations() {
        let activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            return;
        }
        const text = activeEditor.document.getText();
        //let fileName = ""
        let fileName = activeEditor.document.fileName;
        /*if (this.discopopView) {
            fileName = nameFromPath(this.discopopView.folderPath, activeEditor.document.fileName);
        }*/
        const file = FileManager.getFileFromName(fileName);
        if (file) {

            {
                let decorationMap = new Map<string, vscode.DecorationOptions[]>([["reduction", []], ["do_all", []], ["pipeline", []], ["geometric_decomposition", []]]);
                file.patterns.forEach((pattern) => {
                    //console.log("Adding highlight");
                    if (pattern.active) {
                        const decoration: vscode.DecorationOptions = { range: new vscode.Range(pattern.startLine - 1, pattern.startIndex, pattern.endLine - 1, pattern.endIndex) };
                        decorationMap.get(pattern.type)?.push(decoration);
                    }
                });
                decorationMap.forEach((value, key) => {
                    if (value.length > 0) {
                        activeEditor?.setDecorations(Decorations.get(key), value);
                    }
                });
            }
            if (vscode.workspace.getConfiguration("discopopvsc").get("loopCounter")) {
                let decorationsArray: vscode.DecorationOptions[][] = [[], [], []];
                file.heatmaps.forEach(heatmap => {
                    //console.log("Adding Heatmap");
                    if (heatmap.active) {
                        const heatmapLevel = this.getHeatmapLevelFromAmount(heatmap.level);
                        const decoration = { range: new vscode.Range(new vscode.Position(heatmap.startLine - 1, 0), new vscode.Position(heatmap.endLine-1, 1000)), hoverMessage: "Loop executed: " + heatmap.level + " times" };
                        decorationsArray[heatmapLevel].push(decoration);
                    }
                });

                decorationsArray.forEach((val, index) => {
                    activeEditor!.setDecorations(Decorations.getHeatmapDecoration(index), val);
                });
            } else {
                for (let i = 0; i < 3; i++) {
                    activeEditor!.setDecorations(Decorations.getHeatmapDecoration(i), []);
                }
            }
        }
    }

    getHeatmapLevelFromAmount(level: number) {
        if (level > 0 && level <= 10) {
            return 0;
        } else if (level > 10 && level <= 30) {
            return 1;
        } else if (level > 30) {
            return 2;
        }
        return -1;
    }

    triggerUpdateDecorations() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = undefined;
        }
        this.timeout = setTimeout(this.refresh.bind(this), 500);
    }

    setView(view: DiscoPoPViewProvider) {
        this.discopopView = view;
        this.loadData();
        //patternFiles.forEach(file => { this.loadPatterns(file); this.loadLoopHeatmap(file); });
        //this.loadPatterns(patternFiles);
    }
}
