import * as vscode from "vscode";

type Mark = {
  id: string;
  file: {
    name: string | undefined;
    uri: vscode.Uri | undefined;
  };
  line: Number;
};

function getFileName(editor?: vscode.TextEditor) {
  return editor?.document.fileName;
}

function getFileUri(editor?: vscode.TextEditor) {
  return editor?.document.uri;
}

function buildFileId(line: Number, editor?: vscode.TextEditor) {
  const uri = getFileUri(editor);
  return `${uri?.path}___line___${line}`;
}

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

        const marksFromState: Number[] = context.workspaceState.get(
          "marks",
          []
        );
        const newMark: Mark = {
          id: buildFileId(line, editor),
          file: {
            name: getFileName(editor),
            uri: getFileUri(editor)
          },
          line
        };
        await context.workspaceState.update("marks", [
          ...marksFromState,
          newMark
        ]);
      } else {
        vscode.window.showInformationMessage(`Couldn't create a mark.`);
      }

      const savedMarks = await context.workspaceState.get("marks");
      console.log(savedMarks);
    }
  );

  let clearMarks = vscode.commands.registerCommand(
    "extension.clearMarks",
    async () => {
      await context.workspaceState.update("marks", []);
      vscode.window.showInformationMessage("All marks cleared successfully.");
    }
  );

  let listMarks = vscode.commands.registerCommand("extension.listMarks", () => {
    const marks = context.workspaceState.get("marks", []);
    const marksToBeListed = marks.map((mark: Mark) => {
      return `${mark.file.name} [${mark.line}]`;
    });
    vscode.window.showQuickPick(marksToBeListed);
  });

  context.subscriptions.push(setMark, clearMarks);
}
