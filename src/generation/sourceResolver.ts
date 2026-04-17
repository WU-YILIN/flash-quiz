import { TFile, TFolder, Vault, normalizePath } from "obsidian";
import type { SourceBinding } from "../settings/types";
import { hashString } from "../lib/hash";

export interface ResolvedSourceDocument {
  sourcePath: string;
  sourceHash: string;
  content: string;
}

export async function resolveBoundMarkdownSources(
  vault: Vault,
  bindings: SourceBinding[]
): Promise<ResolvedSourceDocument[]> {
  const enabledBindings = bindings.filter((binding) => binding.enabled);
  const documents: ResolvedSourceDocument[] = [];
  const seen = new Set<string>();

  for (const binding of enabledBindings) {
    const normalizedPath = normalizePath(binding.path);
    const abstractFile = vault.getAbstractFileByPath(normalizedPath);
    if (!abstractFile) {
      continue;
    }

    if (abstractFile instanceof TFile) {
      if (abstractFile.extension !== "md" || seen.has(abstractFile.path)) {
        continue;
      }

      documents.push(await buildResolvedSource(vault, abstractFile));
      seen.add(abstractFile.path);
      continue;
    }

    if (abstractFile instanceof TFolder) {
      const files = collectMarkdownChildren(abstractFile);
      for (const file of files) {
        if (seen.has(file.path)) {
          continue;
        }

        documents.push(await buildResolvedSource(vault, file));
        seen.add(file.path);
      }
    }
  }

  return documents;
}

export async function resolvePendingMarkdownSources(
  vault: Vault,
  bindings: SourceBinding[],
  sourceSnapshots: Array<{ sourcePath: string; sourceHash: string }>
): Promise<ResolvedSourceDocument[]> {
  const all = await resolveBoundMarkdownSources(vault, bindings);
  return all.filter((source) => {
    const snapshot = sourceSnapshots.find(
      (item) => item.sourcePath === source.sourcePath
    );
    return snapshot?.sourceHash !== source.sourceHash;
  });
}

async function buildResolvedSource(
  vault: Vault,
  file: TFile
): Promise<ResolvedSourceDocument> {
  const content = await vault.cachedRead(file);
  return {
    sourcePath: file.path,
    sourceHash: hashString(content),
    content
  };
}

function collectMarkdownChildren(folder: TFolder): TFile[] {
  const files: TFile[] = [];

  for (const child of folder.children) {
    if (child instanceof TFile && child.extension === "md") {
      files.push(child);
      continue;
    }

    if (child instanceof TFolder) {
      files.push(...collectMarkdownChildren(child));
    }
  }

  return files;
}
