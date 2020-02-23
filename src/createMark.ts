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

export { createMark };
