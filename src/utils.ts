import * as vscode from "vscode";
import { Mark } from "./types";

function createMark(
  name: string,
  line: number,
  editor: vscode.TextEditor
): Mark {
  return {
    name,
    file: {
      name: editor?.document.fileName,
      uri: editor?.document.uri
    },
    line
  };
}

function openDocInEditor(path: string): Thenable<vscode.TextEditor> {
  return new Promise(resolve => {
    vscode.workspace.openTextDocument(path).then(doc => {
      vscode.window.showTextDocument(doc).then(resolve);
    });
  });
}

function goToLine(line: number, editor: vscode.TextEditor) {
  // go to the mark's line
  editor.selection = new vscode.Selection(
    editor.selection.active.with(line),
    editor.selection.active.with(line)
  );
}

function storage(context: vscode.ExtensionContext) {
  function get(key: string, fallbackValue: never[]) {
    return context.workspaceState.get(key, fallbackValue);
  }

  function update(key: string, value: any) {
    return context.workspaceState.update(key, value);
  }

  return { get, update };
}

export { createMark, storage, openDocInEditor, goToLine };
