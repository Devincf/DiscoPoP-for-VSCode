import * as fs from 'fs';
import * as vscode from 'vscode';
import { DiscoPoPViewProvider } from '../newdiscopop_webview_provider';
import { executePatIdTask } from '../tasks/task_pat_id';
import { Highlight } from './highlight';
import { getAllPatternFiles, nameFromPath } from './iomanip';

// create a decorator type that we use to decorate small numbers
const decorationType = vscode.window.createTextEditorDecorationType({
    borderWidth: '1px',
    borderStyle: 'solid',
    backgroundColor: '#C0C0C01F',
    overviewRulerColor: '#C0C0C0',
    overviewRulerLane: vscode.OverviewRulerLane.Right,
    light: {
        // this color will be used in light color themes
        borderColor: 'darkblue'
    },
    dark: {
        // this color will be used in dark color themes
        borderColor: 'lightblue'
    }
});

export class SourceHighlighting {
    diagnostics: vscode.Diagnostic[] = [];

    highlights: Map<string, Highlight[] | undefined> = new Map<string,Highlight[] | undefined >();

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

    loadPatterns(fileName: string){
        if(this.discopopView){
            fs.readFile(`${this.discopopView.folderPath}/discopop-tmp/${fileName}_patterns.json`, (err, data) =>  {
                if (err) {
                    throw err;
                }
                    var obj = JSON.parse(data.toString());
                    this.discopopView?.sourceHighlighting.removeAllHighlights(fileName);
                    obj.do_all.forEach((element: any) => {
                        console.log(element);
                        this.discopopView?.sourceHighlighting.addHighlight(fileName, new Highlight(parseInt(element.start_line.split(':')[1])-1, 0,parseInt(element.end_line.split(':')[1])-1,1000, 'Do All Reduction'));
                        //discopopView.sourceHighlighting.reload();
                    });
                    this.discopopView?.sourceHighlighting.refresh();
                
            });
        }
    }

    addHighlight(fileName: string, highlight: Highlight) {
        this.highlights.get(fileName)?.push(highlight);
    }

    removeHighlightAtRange(fileName: string, range: vscode.Range) {
        this.highlights.set(fileName, this.highlights.get(fileName)?.filter(highlight => !(highlight.startLine === range.start.line && highlight.startIndex === range.start.character)));
    }

    removeHighlightAtLine(fileName: string, line: number) {
        this.highlights.set(fileName, this.highlights.get(fileName)?.filter(hl => !(line >= hl.startLine && line <= hl.endLine)));
    }
    removeAllHighlights(fileName: string) {
        this.highlights.set(fileName, []);
    }

    incrementHighlightLinesAfterLine(fileName: string, line: number) {
        console.log("INCREMENTING LINES");
        this.highlights.get(fileName)?.forEach(hl => { if (hl.startLine > line) { hl.startLine += 1; hl.endLine += 1; } });
    }
    decrementHighlightLinesAfterLine(fileName: string, line: number) {
        this.highlights.get(fileName)?.forEach(hl => { if (hl.startLine > line) { hl.startLine -= 1; hl.endLine -= 1; } });
    }

    getHighlightAtLine(fileName: string, line: number) {
        return this.highlights.get(fileName)?.find(hl => line >= hl.startLine && line <= hl.endLine);
    }

    refresh() {
        if (this.lastDoc) {
            this.refreshDiagnostics(this.lastDoc, this.lastCollection);
            this.updateDecorations();
        }
    }

    refreshDiagnostics(doc: vscode.TextDocument, diagnosticCollection: vscode.DiagnosticCollection): void {
        console.log("REFRESHING");
        this.lastDoc = doc;
        this.lastCollection = diagnosticCollection;

        //Load from file




        const diagnostics: vscode.Diagnostic[] = [];

        if(this.discopopView){
            this.highlights.get(nameFromPath(this.discopopView.folderPath, doc.fileName))?.forEach((highlight) => {
                diagnostics.push(this.createDeadCodeDiagnostic(highlight.startLine, highlight.startIndex, highlight.endLine, highlight.endIndex));
            });
        }

        diagnosticCollection.set(doc.uri, diagnostics);
        console.log(diagnosticCollection);

    }

    createDeadCodeDiagnostic(startLine: number, startIndex: number, endLine: number, endIndex: number): vscode.Diagnostic {
        const range = new vscode.Range(startLine, startIndex, endLine, endIndex);

        const diagnostic = new vscode.Diagnostic(range, "This code can be optimized", vscode.DiagnosticSeverity.Information);
        diagnostic.code = 'deadcode_hint';
        diagnostic.source = 'DiscoPoP';
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
                }
            })
        );

        context.subscriptions.push(
            vscode.workspace.onDidChangeTextDocument(e => {
                this.refreshDiagnostics(e.document, diagnosticCollection);

                const newText = e.document.getText();

                let fileName = "";
                if(this.discopopView){
                    fileName = nameFromPath(this.discopopView.folderPath, e.document.fileName);
                }

                if (this.oldText !== '') {


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
                        this.removeHighlightAtLine(fileName,e.document.positionAt(newPragma).line);
                        this.refresh();
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
                        this.incrementHighlightLinesAfterLine(fileName,line - 1);
                        this.refresh();
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
                        this.decrementHighlightLinesAfterLine(fileName,line - 1);
                        this.refresh();
                    }
                }

                this.oldText = newText;
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
        const decorations: vscode.DecorationOptions[] = [];
        let fileName = "";
        if(this.discopopView){
            fileName = nameFromPath(this.discopopView.folderPath, activeEditor.document.fileName);
        }

        this.highlights.get(fileName)?.forEach((highlight) => {
            console.log("Adding highlight");
            const decoration = { range: new vscode.Range(highlight.startLine, highlight.startIndex, highlight.endLine, highlight.endIndex), hoverMessage: highlight.text };
            decorations.push(decoration);
        });
        activeEditor.setDecorations(decorationType, decorations);
    }

    triggerUpdateDecorations() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = undefined;
        }
        this.timeout = setTimeout(this.updateDecorations.bind(this), 500);
    }

    setView(view: DiscoPoPViewProvider) {
        this.discopopView = view;
        const patternFiles = getAllPatternFiles(view.folderPath);
        patternFiles.forEach(file => this.loadPatterns(file));
        //this.loadPatterns(patternFiles);
    }
}
