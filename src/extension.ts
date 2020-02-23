import * as vscode from "vscode";
import { storage } from "./storage";

type Mark = {
  name: string;
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
    file: {
      name: editor?.document.fileName,
      uri: editor?.document.uri
    },
    line
  };
}

export function activate(context: vscode.ExtensionContext) {
  const store = storage(context);
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

        await store.update("marks", [
          ...store.get("marks", []),
          createMark(name, editor.selection.active.line, editor)
        ]);
      } else {
        vscode.window.showErrorMessage(`Couldn't create a mark.`);
      }
    }
  );

  let clearMarks = vscode.commands.registerCommand(
    "extension.clearMarks",
    async () => {
      await store.update("marks", []);
      vscode.window.showInformationMessage("All marks cleared successfully.");
    }
  );

  let listMarks = vscode.commands.registerCommand(
    "extension.listMarks",
    async () => {
      const marks: Mark[] = store.get("marks", []);
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
