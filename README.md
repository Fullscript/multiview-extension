# MultiView

This VS Code extension allows you to remap the files in your codebase, and show an alternative view without having to physically move the files. This can be useful to componentize your layered code or flatten your components to see all similar files in one place.

## Features

MultiView is configured with regular expression and replacement string pairs. You can configure multiple views, and each view can apply multiple replacements.

<!-- TODO: add examples here -->


## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `multiview.conversions`: Named views with regular expression replacements to convert one file system "schema" to another. (See examples below)


```js
// Expected format
"multiview.conversions": {
  "<categoryName>": [["<regex1>", "<replacement1>"], ["<regex2>", "<replacement2>"], ...],
  "<otherCategoryName>": [...]
}
// Example
"multiview.conversions": {
  // Moves specs from the spec folder to the app folder
  "adjacentSpecs": [["spec/(.*)", "app/$1"]],
  // Creates a folder for each html page with the matching css and js files
  "componentize": [
    ["src/views/(.*)\\.html", "src/components/$1/$1.html"],
    ["src/styles/(.*)\\.css", "src/components/$1/$1.css"],
    ["src/js/(.*)\\.js", "src/components/$1/$1.js"]
  ]
}
```


## Known Issues

Selecting a category is done using a QuickPick until we can create a dynamic menu

## Release Notes

### 0.2.0

- Multiple conversion categories are now supported!
- MultiView can now be refreshed
- The category can be selected using quickPick

### 0.1.0

Initial release of MultiView. Only a single conversion is supported.


# Development

## How to build

Run `vsce package`

<!-- TODO: Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension. (https://code.visualstudio.com/api/references/extension-guidelines) -->
