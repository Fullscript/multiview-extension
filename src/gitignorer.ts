import * as vscode from 'vscode'
import * as fs from 'fs'
import ignore from 'ignore'

export function getGitignorer(absolutePath: string): any { // Can't figure out the type for this
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

