import * as vscode from 'vscode';


export class SourceHighlighting {
	diagnostics: vscode.Diagnostic[] = [];

    refreshDiagnostics(doc: vscode.TextDocument, diagnosticCollection: vscode.DiagnosticCollection): void {
        console.log("REFRESHING");

        //Load from file

        const diagnostics: vscode.Diagnostic[] = [];

        diagnostics.push(this.createDeadCodeDiagnostic(15,0,10));
        
        diagnosticCollection.set(doc.uri, diagnostics);
        console.log(diagnosticCollection);
    }

    createDeadCodeDiagnostic(lineIndex: number, startIndex: number, endIndex: number): vscode.Diagnostic{
        const range = new vscode.Range(lineIndex, startIndex, lineIndex, endIndex);

        const diagnostic = new vscode.Diagnostic(range, "This code does never get executed", vscode.DiagnosticSeverity.Hint);
        diagnostic.code = 'deadcode_hint';
        diagnostic.source = 'DiscoPoP'
        return diagnostic;
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
            vscode.workspace.onDidChangeTextDocument(e => this.refreshDiagnostics(e.document, diagnosticCollection))
        );
    
        context.subscriptions.push(
            vscode.workspace.onDidCloseTextDocument(doc => diagnosticCollection.delete(doc.uri))
        );
    
    }
}
