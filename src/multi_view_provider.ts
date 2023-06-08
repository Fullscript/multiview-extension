import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import ignore from 'ignore'


export class MultiViewProvider implements vscode.TreeDataProvider<FileItem> {

    newItems: FileItem[] = []
    allConversions: {[index: string]: FileConversion[]} = {}
    conversions: FileConversion[] = []

    selections: string[] = []
    selection: string = ''

    // Taken from https://github.com/microsoft/vscode-extension-samples/blob/main/tree-view-sample/src/nodeDependencies.ts
    private _onDidChangeTreeData: vscode.EventEmitter<FileItem | undefined | void> = new vscode.EventEmitter<FileItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<FileItem | undefined | void> = this._onDidChangeTreeData.event;

    constructor(private workspaceRoot: string) {
        this.allConversions = this.validateConversions(vscode.workspace.getConfiguration('multiView.conversions'))
        this.selections = Object.keys(this.allConversions)
        if (this.selections.length > 0) {
            this.select(this.selections[0])
        }
    }

    select(selection: string) {
        if (selection !== this.selection && this.selections.includes(selection)) {
            this.selection = selection
            this.conversions = this.allConversions[this.selection]
        }
    }

    refresh() {
        this.allConversions = this.validateConversions(vscode.workspace.getConfiguration('multiView.conversions'))
        this.selections = Object.keys(this.allConversions)
        this.conversions = this.allConversions[this.selection]
        this._onDidChangeTreeData.fire()
    }

    getTreeItem(element: FileItem): vscode.TreeItem {
        return element
    }

    getChildren(element?: FileItem): Thenable<FileItem[]> {
        if (!this.workspaceRoot) {
            vscode.window.showInformationMessage('Empty workspace means no multiview fo you!')
            return Promise.resolve([])
        }

        let children: FileItem[]
        if (!element) {
            this.populateStructure(this.workspaceRoot)
            children = this.newItems
        } else {
            children = element.children
        }

        return Promise.resolve(children)
    }

    // Private methods below 

    validateConversions(input: any) {
        let result: {[index: string]: FileConversion[]} = {}
        let isObject = (typeof input === 'object' && !Array.isArray(input) && input !== null)
        if (!isObject) {
            vscode.window.showWarningMessage("multiView.conversions is not an object. MultiView will not work.")
            return {}
        }
        let errors: {invalidCategories: string[]} = {invalidCategories: []}
        for (let key in input) {
            if (typeof input[key] === 'function') continue
            let conversionList = input[key]
            if (!Array.isArray(conversionList)) {
                errors.invalidCategories.push(key)
                continue
            }
            conversionList.forEach((conversion) => {
                let [fromPattern, toPattern] = conversion
                if (typeof fromPattern !== 'string' || typeof toPattern !== 'string') {
                    errors.invalidCategories.push(key)
                    return
                }
                result[key] ||= []
                result[key].push(new FileConversion(new RegExp(fromPattern), toPattern))
            })
        }

        if (errors.invalidCategories.length > 0) {
            vscode.window.showWarningMessage(`Unable to parse categories: ${errors.invalidCategories.join(', ')}`)
        }
        return result
    }

    applyConversions(origFlatFiles: string[], conversions: FileConversion[]): FileItem[] {
        let fileMap: any = {}
        let newFlatFiles: string[][] = origFlatFiles.map((path) => {
            return [path, path]
        })

        conversions.forEach((conversion) => {
            newFlatFiles = newFlatFiles.map(([origPath, newerPath]) => {
                let newPath = conversion.apply(newerPath)
                return [origPath, newPath]
            })
        })

        newFlatFiles.forEach(paths => {
            this.digSet(fileMap, paths[1].split("/"), paths)
        })

        let rootNode = new FileItem('', this.workspaceRoot, undefined, true)
        rootNode.children = this.fileMapToGraph(fileMap, rootNode)

        return rootNode.children
    }

    fileMapToGraph(fileMap: any, parent: FileItem): FileItem[] {
        let result: FileItem[] = []
        for (let key in fileMap) {
            if (Array.isArray(fileMap[key])) {
                let paths = fileMap[key]
                result.push(new FileItem(paths[1], path.join(this.workspaceRoot, paths[0]), parent))
            } else {
                let newPath = path.join(parent.newPath, key)
                // TODO: the orignal absolute path for a folder doesn't exist
                let folder = new FileItem(newPath, key, parent, true)
                folder.children = this.fileMapToGraph(fileMap[key], folder)
                result.push(folder)
            }
        }

        result = result.sort((a, b) => {
            if (a.isDir !== b.isDir) {
                return a.isDir ? -1 : 1
            } else {
                return (a.newPath || '') < (b.newPath || '') ? -1 : 1
            }
        })

        return result
    }

    digSet(obj: any, keys: string[], value: any) {
        let key = keys.shift() || ''
        if (keys.length == 0) {
            obj[key] = value
        } else {
            let nextObj = obj[key] || {}
            obj[key] = nextObj
            this.digSet(nextObj, keys, value)
        }
    }

    populateStructure(workspaceRoot: string) {
        let gitignorePath: string = vscode.workspace.getConfiguration('multiView').get('ignorePath') || ''
        let ignorer = this.getGitignorer(path.join(workspaceRoot, gitignorePath))
        let origFlatFiles = this.getFlatFiles(workspaceRoot, '', ignorer)
        this.newItems = this.applyConversions(origFlatFiles, this.conversions)
    }

    getFlatFiles(absoluteRoot: string, dir: string = '', ignorer: any = null): string[] {
        let files = fs.readdirSync(path.join(absoluteRoot, dir))
        let result: string[] = []
        files.filter((fileName) => {
            if (ignorer) {
                return !ignorer.ignores(fileName)
            } else {
                return true
            }
        }).forEach((fileName) => {
            let absolutePath = path.join(absoluteRoot, dir, fileName)
            let isDir = fs.statSync(absolutePath).isDirectory()
            if (!isDir) {
                result.push(path.join(dir, fileName))
            } else {
                result.push(...this.getFlatFiles(absoluteRoot, path.join(dir, fileName)))
            }
        })
        return result.sort()
    }

    getGitignorer(absolutePath: string): any { // Can't figure out the type for this
        let contents: string
        try {
            contents = fs.readFileSync(absolutePath, 'utf8')
        } catch (e) {
            vscode.window.showWarningMessage(`Unable to read ignore file '${absolutePath}'`)
            return null
        }
        let lines = contents.split('\n').filter((line) => {
            return line.length > 0 && line.trim()[0] != '#'
        })
        let gitIgnorer = ignore().add(lines)

        return gitIgnorer  
    }


}

class FileItem extends vscode.TreeItem {

    constructor(
        public newPath: string, // Relative path to new location
        public origAbsolutePath: string, // Absolute path of orignal file if it's a file
        public parent?: FileItem,
        public isDir: boolean = false,
        public children: FileItem[] = []
    ) {
        let collapsibleState = isDir ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
        // TODO: get this to work if fileName has been changed
        super(vscode.Uri.parse(newPath), collapsibleState)
        
        if (this.isDir) {
            this.tooltip = undefined
        } else {
            this.tooltip = this.origAbsolutePath
            this.command = new MyCommand('open', 'vscode.open','open', [this.origAbsolutePath])
        }
    }

}


class FileConversion {
    constructor(public fromPattern: RegExp, public toPattern: string) {
    }

    apply(file: string): string {
        return file.replace(this.fromPattern, this.toPattern)
    }
}

class MyCommand implements vscode.Command {
    arguments: any[] = []

    constructor(
        public title: string, 
        public command: string, 
        public tooltip?: string,
        args: any[] = []
    ) {
        this.arguments = args
    }
}