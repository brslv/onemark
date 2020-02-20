import * as vscode from "vscode";

type Mark = {
  name: string;
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
        const name = await vscode.window.showInputBox({
          placeHolder: "e.g. Fix later"
        });

        if (!name?.trim()) {
          return;
        }

        const position = editor.selection.active;
        const line = position.line;

        const marksFromState: Number[] = context.workspaceState.get(
          "marks",
          []
        );
        const newMark: Mark = {
          name,
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
        vscode.window.showErrorMessage(`Couldn't create a mark.`);
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

  let listMarks = vscode.commands.registerCommand(
    "extension.listMarks",
    async () => {
      const marks = context.workspaceState.get("marks", []);
      const marksToBeListed = marks.map((mark: Mark) => {
        return `${mark.name} (${mark.file.name} [${mark.line}])`;
      });
      const choice = await vscode.window.showQuickPick(marksToBeListed);
      if (choice) {
        const pattern = /(\/.+?(\s(?=\[)))/gim;
        const match = choice.match(pattern);
        if (match && match.length) {
          const mark: Mark | undefined = marks.find((mark: Mark) => {
            return mark.file.name?.trim() === match[0].trim();
          });
          if (mark) {
            const fileUri = mark!.file.uri;

            if (fileUri !== undefined) {
              vscode.workspace.openTextDocument(fileUri.fsPath).then(doc => {
                vscode.window.showTextDocument(doc);
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
