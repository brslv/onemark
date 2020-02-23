import * as vscode from "vscode";
function storage(context: vscode.ExtensionContext) {
  function get(key: string, fallbackValue: never[]) {
    return context.workspaceState.get(key, fallbackValue);
  }

  function update(key: string, value: any) {
    return context.workspaceState.update(key, value);
  }

  return { get, update };
}

export { storage };
