import * as vscode from "vscode";
import { storage, createMark, goToLine, openDocInEditor } from "./utils";
import { Mark } from "./types";

const CONTANTS = {
  MARKS: "marks"
};

export function activate(context: vscode.ExtensionContext) {
  const store = storage(context);

  function listMarksAndChoose(marks: Mark[]) {
    const marksToBeListed = marks.map((mark: Mark) => {
      return `${mark.name} (${mark.file.name} [${mark.line}])`;
    });
    return vscode.window.showQuickPick(marksToBeListed);
  }

  function extractMarkInfoFromChoiceString(choice: string) {
    const filePattern = /(\/.+?(\s(?=\[)))/gim; // a string starting with / up until a [ is met
    const linePattern = /(?<=\[)(\d+)(?=\])/gim; // a number between []
    const fileMatch = choice.match(filePattern);
    const lineMatch = choice.match(linePattern);

    return {
      file: fileMatch && fileMatch.length ? fileMatch[0].trim() : null,
      line: lineMatch && lineMatch.length ? Number(lineMatch[0].trim()) : null
    };
  }

  let setMark = vscode.commands.registerCommand(
    "extension.setMark",
    async () => {
      const editor = vscode.window.activeTextEditor;

      if (editor?.selection.isEmpty) {
        const name = await vscode.window.showInputBox({
          placeHolder: "e.g. Fix later"
        });

        if (!name?.trim()) {
          return;
        }

        await store.update(CONTANTS.MARKS, [
          ...store.get(CONTANTS.MARKS, []),
          createMark(name, editor.selection.active.line, editor)
        ]);
      } else {
        vscode.window.showErrorMessage(`Couldn't create a mark.`);
      }
    }
  );

  let removeMark = vscode.commands.registerCommand(
    "extension.removeMark",
    async () => {
      const marks: Mark[] = store.get(CONTANTS.MARKS, []);
      const choice = await listMarksAndChoose(marks);
      if (choice) {
        const { file, line } = extractMarkInfoFromChoiceString(choice);

        await store.update(
          CONTANTS.MARKS,
          marks.filter(
            mark => !(mark.file?.name === file && Number(mark.line) === line)
          )
        );

        vscode.window.setStatusBarMessage("Mark removed sucessfully.");
      }
    }
  );

  let clearMarks = vscode.commands.registerCommand(
    "extension.clearMarks",
    async () => {
      await store.update(CONTANTS.MARKS, []);
      vscode.window.showInformationMessage("All marks cleared successfully.");
    }
  );

  let listMarks = vscode.commands.registerCommand(
    "extension.listMarks",
    async () => {
      const marks: Mark[] = store.get(CONTANTS.MARKS, []);
      const choice = await listMarksAndChoose(marks);

      if (choice) {
        const { file, line } = extractMarkInfoFromChoiceString(choice);

        if (file && line) {
          const mark = marks.find(mark => {
            const markFileMatchesSelected = mark.file.name?.trim() === file;
            const markLineMatchesSelected = Number(mark.line) === line;

            return markFileMatchesSelected && markLineMatchesSelected;
          });

          if (mark && mark.file.uri !== undefined) {
            const editor = await openDocInEditor(mark.file.uri.fsPath);
            goToLine(mark?.line || 0, editor);
          }
        } else {
          vscode.window.showErrorMessage("Unable to open the bookmark.");
        }
      }
    }
  );

  context.subscriptions.push(setMark, removeMark, clearMarks, listMarks);
}
