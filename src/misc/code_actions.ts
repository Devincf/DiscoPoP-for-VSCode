import * as vscode from 'vscode';
import { FileManager } from './filemanager';
import { SourceHighlighting } from './source_highlighting';
export class CodeActions implements vscode.CodeActionProvider {

	public static readonly providedCodeActionKinds = [
		vscode.CodeActionKind.QuickFix
	];

	sourceHighlight: SourceHighlighting;

	constructor(sourceHighlight: SourceHighlighting){
		this.sourceHighlight = sourceHighlight;
	}

	provideCodeActions(document: vscode.TextDocument, range: vscode.Range, context: vscode.CodeActionContext, token: vscode.CancellationToken): vscode.CodeAction[] | undefined {
		return context.diagnostics
		.filter(diagnostic => diagnostic.source === "DiscoPoP for VSCode")
		.map(diagnostic => this.createFix(document, range, diagnostic));

		/*const pragmaInsertion = this.createFix(document, range);
		Marking a single fix as `preferred` means that users can apply it with a
		single keyboard shortcut using the `Auto Fix` command.
        

		return [
			pragmaInsertion,
		];*/
	}

	private extractStrings(strArr: string[]){
		return strArr.map((val, index) => { 
			return (index>0? ',': '') + val;
		}).join('');
	}

	private addClauseIfExist(clause: string, strArr: string[]){
		if(strArr.length===0){
			return '';
		}

		return `${clause}(${this.extractStrings(strArr)})`;
	}

	private createFix(document: vscode.TextDocument, range: vscode.Range, diagnostic: vscode.Diagnostic): vscode.CodeAction {
		const fix = new vscode.CodeAction('', vscode.CodeActionKind.QuickFix);
		fix.edit = new vscode.WorkspaceEdit();
		//fix.edit.replace(document.uri, new vscode.Range(range.start, range.start.translate(0, 2)), emoji);
		//const highlight = FileManager.getFileFromName(document.fileName)?.getHighlightAtLine(range.start.line);
		const line = diagnostic.range.start.line+1;
		const highlight = FileManager.getFileFromName(document.fileName)?.getPatternAtLineTest(line, diagnostic.code?.toString());
		//const highlight = this.sourceHighlight.getHighlightAtLine(nameFromPath(this.sourceHighlight.discopopView?.folderPath,document.fileName), range.start.line);

		if(highlight){
			fix.diagnostics = [diagnostic];
			fix.title = highlight.diagnosticText;
			const startOffset = document.offsetAt(new vscode.Position(highlight.startLine-1, 0));
			if(diagnostic.code === 'reduction'){
				fix.edit.insert(document.uri, new vscode.Position(highlight.startLine-1, 0), `#pragma omp parallel for reduction(${highlight.data.reduction[0]}) ${this.addClauseIfExist('firstprivate', highlight.data.first_private)} ${this.addClauseIfExist('private', highlight.data.private)} ${this.addClauseIfExist('lastprivate', highlight.data.last_private)} ${this.addClauseIfExist('shared', highlight.data.shared)}\n`);
			}else if(diagnostic.code === 'do_all'){
				fix.edit.insert(document.uri,new vscode.Position(highlight?.startLine-1, 0), `#pragma omp parallel for ${this.addClauseIfExist('firstprivate', highlight.data.first_private)} ${this.addClauseIfExist('private', highlight.data.private)} ${this.addClauseIfExist('lastprivate', highlight.data.last_private)} ${this.addClauseIfExist('shared', highlight.data.shared)}\n`);
			}else if(diagnostic.code === 'pipeline'){
				//fix.edit.insert(document.uri, new vscode.Position(highlight?.startLine, 1000), "\n#pragma omp pipeline");
			}else if(diagnostic.code === 'geometric_decomposition'){
				//fix.edit.insert(document.uri, new vscode.Position(highlight?.startLine, 1000), "\n#pragma omp geometric_decomposition");
			}
		}else{
			console.log("??");
		}
		return fix;
	}
}