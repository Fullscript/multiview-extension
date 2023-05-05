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
        let stuff = fs.readdirSync(this.workspaceRoot)
        
        return Promise.resolve(stuff.map((fileName) => {
            let isDirectory = fs.statSync(path.join(this.workspaceRoot, fileName)).isDirectory()
            let state = isDirectory ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
            return {fileName, state}
            // console.log({fileName, state})
            // return new ViewItem(fileName, state)
        }).sort((a, b) => {
            let diff = b.state - a.state
            if (diff != 0) {
                return diff
            } else {
                return a.fileName < b.fileName ? -1 : 1
            }
        }).map((result) => {
            return new ViewItem(result.fileName, result.state)
        })
        )
    }

}


class ViewItem extends vscode.TreeItem {
    constructor(label: string | vscode.TreeItemLabel, collapsibleState?: vscode.TreeItemCollapsibleState) {
        super(label, collapsibleState)
    }
}