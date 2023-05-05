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
        
        let dir = !element ? '' : path.join(element.dir, element.label)

        // vscode.window.showInformationMessage('You haz a workspace!')
        let absolutePath = path.join(this.workspaceRoot,dir)
        console.log({absolutePath})
        let stuff = fs.readdirSync(absolutePath)
        
        return Promise.resolve(stuff.map((fileName) => {
            let isDir = fs.statSync(path.join(this.workspaceRoot, dir, fileName)).isDirectory() ? 1 : 0
            return {fileName, isDir}
        }).sort((a, b) => {
            let diff = b.isDir - a.isDir
            if (diff != 0) {
                return diff
            } else {
                return a.fileName < b.fileName ? -1 : 1
            }
        }).map((result) => {
            return new ViewItem(dir, result.fileName, !!result.isDir)
        }))
    }

}


class ViewItem extends vscode.TreeItem {


    constructor(
        public dir: string,
        public label: string, 
        public isDir: boolean = false,
        public contents: ViewItem[] = []
    ) {
        // let label = path.split("/").at(-1) || ""
        let collapsibleState = isDir ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
        super(label, collapsibleState)
    }
}