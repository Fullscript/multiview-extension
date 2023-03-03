import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

export class MultiViewProvider implements vscode.TreeDataProvider<ViewItem> {
    constructor(private workspaceRoot: string) {}

    getTreeItem(element: ViewItem): vscode.TreeItem {
        return element
    }

    getChildren(element?: ViewItem): Thenable<ViewItem[]> {
        if (!this.workspaceRoot) {
            vscode.window.showInformationMessage('Empty workspace means no multiview fo you!')
            return Promise.resolve([])
        }
        vscode.window.showInformationMessage('You haz a workspace!')
        return Promise.resolve([])
    }


}


class ViewItem extends vscode.TreeItem {

}