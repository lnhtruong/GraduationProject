declare module "@ckeditor/ckeditor5-react" {
  import * as React from "react";

  export interface CKEditorProps {
    editor: unknown;
    data?: string;
    config?: Record<string, unknown>;
    disabled?: boolean;
    onReady?: (editor: { getData: () => string }) => void;
    onChange?: (event: unknown, editor: { getData: () => string }) => void;
    onBlur?: (event: unknown, editor: { getData: () => string }) => void;
    onFocus?: (event: unknown, editor: { getData: () => string }) => void;
    onError?: (error: unknown) => void;
  }

  export const CKEditor: React.ComponentType<CKEditorProps>;
}

declare module "@ckeditor/ckeditor5-build-classic" {
  const ClassicEditorBuild: unknown;
  export default ClassicEditorBuild;
}
