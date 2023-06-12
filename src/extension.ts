// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
import { MultiViewProvider } from './multi_view_provider'

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath || ''
	let multiViewProvider = new MultiViewProvider(rootPath)
	vscode.window.registerTreeDataProvider('multiView', multiViewProvider)

	context.subscriptions.push(vscode.commands.registerCommand('multiView.refresh', () => {
		multiViewProvider.refresh()
	}))

	context.subscriptions.push(vscode.commands.registerCommand('multiView.selectCategory', () => {
		const quickPick = vscode.window.createQuickPick()
		quickPick.items = multiViewProvider.selections.map((selection) => {return {label: selection}})
		quickPick.onDidChangeSelection((item) => {
			let selection = item[0].label
			multiViewProvider.select(selection)
			multiViewProvider.refresh()
			quickPick.hide()
		})
		quickPick.onDidHide(() => quickPick.dispose())
		quickPick.show()
	}))


}

// This method is called when your extension is deactivated
export function deactivate() {}
