import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  let setMark = vscode.commands.registerCommand(
    "extension.setMark",
    async () => {
      // current editor
      const editor = vscode.window.activeTextEditor;

      // check if there is no selection
      if (editor?.selection.isEmpty) {
        const position = editor.selection.active;
        const line = position.line;

        vscode.window.showInformationMessage(`Line: ${line}`);

        const linesFromState: Number[] = context.workspaceState.get(
          "lines",
          []
        );
        await context.workspaceState.update("lines", [
          ...new Set([...linesFromState, line])
        ]);
      } else {
        vscode.window.showInformationMessage(`Couldn't create a mark.`);
      }

      const savedLines = await context.workspaceState.get("lines");
      console.log(savedLines);
    }
  );

  let clearMarks = vscode.commands.registerCommand(
    "extension.clearMarks",
    async () => {
      await context.workspaceState.update("lines", []);
      vscode.window.showInformationMessage("All marks cleared successfully.");
    }
  );

  context.subscriptions.push(setMark, clearMarks);
}
