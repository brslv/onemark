import * as vscode from "vscode";

type Mark = {
  name: string;
  file: {
    name: string | undefined;
    uri: vscode.Uri | undefined;
  };
  line: number;
};

export { Mark };
