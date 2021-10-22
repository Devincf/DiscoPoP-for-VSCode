import * as vscode from 'vscode';
import { nameFromPath } from './iomanip';
import { SourceHighlighting } from './source_highlighting';
export class CodeActions implements vscode.CodeActionProvider {

	public static readonly providedCodeActionKinds = [
		vscode.CodeActionKind.QuickFix,
	];

	sourceHighlight: SourceHighlighting;

	constructor(sourceHighlight: SourceHighlighting){
		this.sourceHighlight = sourceHighlight;
	}

	public provideCodeActions(document: vscode.TextDocument, range: vscode.Range, context: vscode.CodeActionContext, token: vscode.CancellationToken): vscode.CodeAction[] | undefined {
		return context.diagnostics
		.filter(diagnostic => diagnostic.code === 'deadcode_hint')
		.map(diagnostic => this.createFix(document, range));

		const pragmaInsertion = this.createFix(document, range);
		// Marking a single fix as `preferred` means that users can apply it with a
		// single keyboard shortcut using the `Auto Fix` command.
        

		return [
			pragmaInsertion,
		];
	}

	private createFix(document: vscode.TextDocument, range: vscode.Range): vscode.CodeAction {
		const fix = new vscode.CodeAction(`Insert Pragma`, vscode.CodeActionKind.QuickFix);
		fix.edit = new vscode.WorkspaceEdit();
		//fix.edit.replace(document.uri, new vscode.Range(range.start, range.start.translate(0, 2)), emoji);
		const highlight = this.sourceHighlight.getHighlightAtLine(nameFromPath(this.sourceHighlight.discopopView?.folderPath,document.fileName), range.start.line);
		if(highlight){
			fix.edit.insert(document.uri,new vscode.Position(highlight?.startLine -1, 1000), "\n#pragma omp parallel for");
		}
		//this.sourceHighlight.removeHighlight(range);
		return fix;
	}
}