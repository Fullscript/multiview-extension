import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'



class FileConversion {
    constructor(public fromPattern: RegExp, public toPattern: string) {
        
    }

    apply(file: string): string {
        return file.replace(this.fromPattern, this.toPattern)
    }
}


export class MultiViewProvider implements vscode.TreeDataProvider<FileItem> {

    newItems: FileItem[] = []
    conversions = [new FileConversion(/spec\/(.*)/, 'app/$1')]

    constructor(private workspaceRoot: string) {
    }

    applyConversions(origFlatFiles: string[], conversions: FileConversion[]): FileItem[] {
        let fileMap: any = {}
        let newFlatFiles: string[] = []

        origFlatFiles.forEach(path => {
            let newPath = conversions[0].apply(path)
            newFlatFiles.push(newPath)
        })
        debugger
        newFlatFiles.forEach(path => {
            this.digSet(fileMap, path.split("/"), path)
        })

        let rootNode = new FileItem('', this.workspaceRoot, undefined, true)
        rootNode.children = this.fileMapToGraph(fileMap, rootNode)

        return rootNode.children
    }

    fileMapToGraph(fileMap: any, parent: FileItem): FileItem[] {
        let result: FileItem[] = []
        for (let key in fileMap) {
            if (typeof fileMap[key] === 'string') {
                let path = fileMap[key]
                result.push(new FileItem(path, '???', parent))
            } else {
                // TODO: key is not the full relative path
                let item = new FileItem(key, '???', parent, true)
                item.children = this.fileMapToGraph(fileMap[key], item)
                result.push(item)
            }
        }

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

        children = children.sort((a, b) => {
            if (a.isDir !== b.isDir) {
                return a.isDir ? -1 : 1
            } else {
                return (a.label || '') < (b.label || '') ? -1 : 1
            }
        })


        return Promise.resolve(children)
        
    }

}


class FileItem extends vscode.TreeItem {

    constructor(
        newPath: string,
        public origAbsolutePath: string,
        public parent?: FileItem,
        public isDir: boolean = false,
        public children: FileItem[] = []
    ) {
        let label = newPath.split("/").at(-1) || ""
        let collapsibleState = isDir ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
        super(label, collapsibleState)
    }
}