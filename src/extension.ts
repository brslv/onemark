import * as vscode from "vscode";

type Mark = {
  name: string;
  id: string;
  file: {
    name: string | undefined;
    uri: vscode.Uri | undefined;
  };
  line: number;
};

function createMark(
  name: string,
  line: number,
  editor: vscode.TextEditor
): Mark {
  return {
    name,
    id: buildFileId(line, editor),
    file: {
      name: getFileName(editor),
      uri: getFileUri(editor)
    },
    line
  };
}

function getFileName(editor?: vscode.TextEditor) {
  return editor?.document.fileName;
}

function getFileUri(editor?: vscode.TextEditor) {
  return editor?.document.uri;
}

function buildFileId(line: number, editor?: vscode.TextEditor) {
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
        const name = await vscode.window.showInputBox({
          placeHolder: "e.g. Fix later"
        });

        if (!name?.trim()) {
          return;
        }

        const line = editor.selection.active.line;
        const marksFromState: number[] = context.workspaceState.get(
          "marks",
          []
        );
        const newMark: Mark = createMark(name, line, editor);
        await context.workspaceState.update("marks", [
          ...marksFromState,
          newMark
        ]);
      } else {
        vscode.window.showErrorMessage(`Couldn't create a mark.`);
      }
    }
  );

  let clearMarks = vscode.commands.registerCommand(
    "extension.clearMarks",
    async () => {
      await context.workspaceState.update("marks", []);
      vscode.window.showInformationMessage("All marks cleared successfully.");
    }
  );

  let listMarks = vscode.commands.registerCommand(
    "extension.listMarks",
    async () => {
      const marks: Mark[] = context.workspaceState.get("marks", []);
      const marksToBeListed = marks.map((mark: Mark) => {
        return `${mark.name} (${mark.file.name} [${mark.line}])`;
      });
      const choice = await vscode.window.showQuickPick(marksToBeListed);
      if (choice) {
        const pattern = /(\/.+?(\s(?=\[)))/gim; // a string starting with / up until a [ is met
        const linePattern = /(?<=\[)(\d+)(?=\])/gim; // a number between []
        const fileMatch = choice.match(pattern);
        const lineMatch = choice.match(linePattern);
        if (fileMatch && fileMatch.length && lineMatch && lineMatch.length) {
          const mark: Mark | undefined = marks.find((mark: Mark) => {
            const markFileMatchesSelected =
              mark.file.name?.trim() === fileMatch[0].trim();
            const markLineMatchesSelected =
              Number(mark.line) === Number(lineMatch[0].trim());

            return markFileMatchesSelected && markLineMatchesSelected;
          });
          if (mark) {
            const fileUri = mark.file.uri;

            if (fileUri !== undefined) {
              vscode.workspace.openTextDocument(fileUri.fsPath).then(doc => {
                vscode.window.showTextDocument(doc).then(editor => {
                  // go to the mark's line
                  editor.selection = new vscode.Selection(
                    editor.selection.active.with(mark?.line || 0),
                    editor.selection.active.with(mark?.line || 0)
                  );
                });
              });
            }
          }
        } else {
          vscode.window.showErrorMessage("Unable to open the bookmark.");
        }
      }
    }
  );

  context.subscriptions.push(setMark, clearMarks, listMarks);
}
