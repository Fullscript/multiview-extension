// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
import { MultiViewProvider } from './multi_view_provider'

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "multiview" is now active!')

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('multiView.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from multiview!')
	})
	context.subscriptions.push(disposable)


	// My new stuff
	console.log('registering')
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
			console.log({selection})
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
