import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'





export class MultiViewProvider implements vscode.TreeDataProvider<FileItem> {

    newItems: FileItem[] = []
    conversions = [new FileConversion(/spec\/(.*)/, 'app/$1')]

    constructor(private workspaceRoot: string) {
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

        // children = children.sort((a, b) => {
        //     if (a.isDir !== b.isDir) {
        //         return a.isDir ? -1 : 1
        //     } else {
        //         return (a.newPath || '') < (b.newPath || '') ? -1 : 1
        //     }
        // })

        return Promise.resolve(children)
    }

    // Private methods below 

    applyConversions(origFlatFiles: string[], conversions: FileConversion[]): FileItem[] {
        let fileMap: any = {}
        let newFlatFiles: string[][] = []

        origFlatFiles.forEach(path => {
            let newPath = conversions[0].apply(path)
            newFlatFiles.push([path, newPath])
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
        let origFlatFiles = this.getFlatFiles(workspaceRoot)
        this.newItems = this.applyConversions(origFlatFiles, this.conversions)
    }

    getFlatFiles(absoluteRoot: string, dir: string = ''): string[] {
        let files = fs.readdirSync(path.join(absoluteRoot, dir))
        let result: string[] = []
        files.filter((fileName) => {
            return fileName != 'node_modules' && fileName[0] != '.'
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