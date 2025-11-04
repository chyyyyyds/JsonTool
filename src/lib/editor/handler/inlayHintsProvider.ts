import type { EditorWrapper } from "@/lib/editor/editor";
import type { languages, Range, editorApi, MonacoApi } from "@/lib/editor/types";
import { getChildCount } from "@/lib/parser";

// 简单的 Disposable 接口
interface IDisposable {
  dispose(): void;
}

// 全局 provider 管理器，确保只注册一次
class GlobalInlayHintsProviderManager {
  private static providerDisposable?: IDisposable;
  private static editors: Set<EditorWrapper> = new Set();
  private static monaco?: MonacoApi["Raw"];

  static register(editorWrapper: EditorWrapper) {
    this.editors.add(editorWrapper);
    
    // 如果还没有注册全局 provider，则注册
    if (!this.providerDisposable) {
      // 确保 monaco 已经初始化
      if (!window.monacoApi?.Raw) {
        // 如果 monaco 还没初始化，延迟注册（但 editor 已添加，不会重复）
        setTimeout(() => {
          // 再次检查，可能在延迟期间已经被注册了
          if (!this.providerDisposable && window.monacoApi?.Raw) {
            this.monaco = window.monacoApi.Raw;
            this.doRegister();
          }
        }, 0);
        return;
      }
      
      this.monaco = window.monacoApi.Raw;
      this.doRegister();
    }
  }

  private static doRegister() {
    if (!this.monaco || this.providerDisposable) {
      return;
    }
      
      const provider = {
        provideInlayHints: (model: editorApi.ITextModel, range: Range) => {
          // 找到当前 model 对应的 editor
          const editor = Array.from(this.editors).find((ew) => ew.model() === model);
          if (!editor || !this.monaco) {
            return { hints: [], dispose: () => {} };
          }

          const monaco = this.monaco; // 保存到局部变量，避免类型检查问题
          const tree = editor.tree;
          const hints: languages.InlayHint[] = [];
          const positionMap = new Map<string, boolean>();

          Object.values(tree.nodeMap).forEach((node) => {
            const count = getChildCount(node);
            if (!(count > 0 && node.type === "array")) {
              return;
            }

            const { lineNumber, column } = editor.getPositionAt(node.offset);
            const positionKey = `${lineNumber}:${column + 1}`;
            
            // 避免同一位置重复添加 hint
            if (positionMap.has(positionKey)) {
              return;
            }
            positionMap.set(positionKey, true);

            hints.push({
              label: `[${count}]`,
              position: { lineNumber, column: column + 1 },
              kind: monaco.languages.InlayHintKind.Type,
              paddingLeft: true,
            });
          });

          // Filter hints based on the visible range to avoid duplicates when folding.
          const { startLineNumber, endLineNumber } = range;
          const filteredHints = hints.filter(
            (hint) =>
              hint.position.lineNumber >= startLineNumber &&
              hint.position.lineNumber <= endLineNumber
          );

          return { hints: filteredHints, dispose: () => {} };
        },
      };

      this.providerDisposable = this.monaco.languages.registerInlayHintsProvider("json", provider);
  }

  static unregister(editorWrapper: EditorWrapper) {
    this.editors.delete(editorWrapper);
    
    // 如果没有任何编辑器了，清理全局 provider
    if (this.editors.size === 0 && this.providerDisposable) {
      this.providerDisposable.dispose();
      this.providerDisposable = undefined;
    }
  }
}

export class InlayHintsProvider {
  private editorWrapper: EditorWrapper;

  constructor(editorWrapper: EditorWrapper) {
    this.editorWrapper = editorWrapper;
    GlobalInlayHintsProviderManager.register(editorWrapper);
  }

  dispose() {
    GlobalInlayHintsProviderManager.unregister(this.editorWrapper);
  }
}
