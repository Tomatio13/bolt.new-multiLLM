import { atom } from "nanostores";
import { createScopedLogger } from "~/utils/logger";
import * as path from "path-browserify";
import { useNavigate } from "@remix-run/react";

const logger = createScopedLogger("FileSystem");

export const selectedDirectoryHandle = atom<FileSystemDirectoryHandle | null>(null);
export const fileChanges = atom<Map<string, string>>(new Map());

interface FileContent {
  filePath: string;
  content: string;
}

export async function createProjectFiles(
  chatItem: ChatHistoryItem
): Promise<void> {
  const directoryHandle = await getDirectoryHandle();

  if (!directoryHandle) {
    logger.warn("No directory selected, project files not created");
    return;
  }

  const fileContents: FileContent[] = [];

  // Parse messages to extract file contents
  for (const message of chatItem.messages) {
    if (message.role === "assistant") {
      const matches = message.content.matchAll(
        /<boltAction type="file" filePath="([^"]+)">([\s\S]*?)<\/boltAction>/g
      );

      for (const match of matches) {
        fileContents.push({
          filePath: match[1],
          content: match[2].trim(),
        });
      }
    }
  }

  // Create files
  for (const file of fileContents) {
    try {
      await writeFile(file.filePath, file.content);
      logger.info(`Created file: ${file.filePath}`);
    } catch (error) {
      logger.error(`Error creating file ${file.filePath}:`, error);
    }
  }
}

export async function selectDirectory(): Promise<string | null> {
  try {
    const directoryHandle = await window.showDirectoryPicker();
    selectedDirectoryHandle.set(directoryHandle);
    localStorage.setItem("selectedDirectoryPath", directoryHandle.name);
    logger.info(`Directory selected: ${directoryHandle.name}`);

    // Check for existing .boltnew file
    try {
      const boltNewContent = await readFile(".boltnew");
      const { chatId } = JSON.parse(boltNewContent);
      
      // Check for corresponding .boltnew.json file
      try {
        await readBoltNewJson(chatId);
        return chatId; // Return the chatId if both files exist
      } catch (error) {
        logger.warn(`No ${chatId}.boltnew.json file found`);
      }
    } catch (error) {
      logger.info("No existing .boltnew file found");
    }

    return null; // Return null if no existing chat was found
  } catch (error) {
    logger.error("Error selecting directory:", error);
    return null;
  }
}

export async function getDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  const currentHandle = selectedDirectoryHandle.get();

if (currentHandle) {
  return currentHandle;
}

const savedPath = localStorage.getItem("selectedDirectoryPath");

if (savedPath) {
  try {
    const handle = await window.showDirectoryPicker({ startIn: savedPath });
    selectedDirectoryHandle.set(handle);

    return handle;
  } catch (error) {
    console.error("Error retrieving saved directory:", error);
  }
}

return null;
}

export async function writeFile(
  filePath: string,
  content: string
): Promise<void> {
  const directoryHandle = await getDirectoryHandle();

  if (directoryHandle) {
    try {
      // Normalize the path and remove leading slash if present
      const normalizedPath = path.normalize(filePath).replace(/^\//, "");
      const parts = normalizedPath.split(path.sep);

      // Navigate through subdirectories
      let currentHandle: FileSystemDirectoryHandle = directoryHandle;

      for (let i = 0; i < parts.length - 1; i++) {
        currentHandle = await currentHandle.getDirectoryHandle(parts[i], {
          create: true,
        });
      }

      // Get the file in the final directory
      const fileName = parts[parts.length - 1];
      const fileHandle = await currentHandle.getFileHandle(fileName, {
        create: true,
      });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      logger.info(`File ${filePath} written successfully`);
    } catch (error) {
      logger.error(`Error writing file ${filePath}:`, error);
      throw error;
    }
  } else {
    logger.warn("No directory selected, file not written");
    throw new Error("No directory selected");
  }
}

export async function updateFile(
  filePath: string,
  content: string
): Promise<void> {
  try {
    await writeFile(filePath, content);
    logger.info(`File ${filePath} updated successfully in local folder`);
  } catch (error) {
    logger.error(`Error updating file ${filePath} in local folder:`, error);
    throw error;
  }
}

export async function readFile(name: string): Promise<string> {
  const directoryHandle = await getDirectoryHandle();

  if (directoryHandle) {
    try {
      const fileHandle = await directoryHandle.getFileHandle(name);
      const file = await fileHandle.getFile();

      return await file.text();
    } catch (error) {
      console.error("Error reading file:", error);
      throw error;
    }
  } else {
    throw new Error("No directory selected");
  }
}

export async function checkForFileChanges(): Promise<void> {
  const directoryHandle = await getDirectoryHandle();

  if (!directoryHandle) {
    return;
  }

  try {
    const changes = new Map<string, string>();

    async function traverseDirectory(
      dirHandle: FileSystemDirectoryHandle,
      currentPath: string = ""
    ) {
      for await (const entry of dirHandle.values()) {
        const entryPath = currentPath
          ? `${currentPath}/${entry.name}`
          : entry.name;

        if (entry.kind === "file") {
          const file = await entry.getFile();
          const content = await file.text();
          changes.set(entryPath, content);
        } else if (entry.kind === "directory") {
          await traverseDirectory(entry, entryPath);
        }
      }
    }

    await traverseDirectory(directoryHandle);
    fileChanges.set(changes);
  } catch (error) {
    if (error instanceof DOMException && error.name === "NotAllowedError") {
      logger.warn("Permission to read directory was revoked");
      selectedDirectoryHandle.set(null);
    } else {
      logger.error("Error checking for file changes:", error);
    }
  }
}

export async function createBoltNewFile(chatId: string): Promise<void> {
  const content = JSON.stringify({ chatId });
  await writeFile(".boltnew", content);
}

export async function readBoltNewFile(): Promise<string | null> {
  try {
    const content = await readFile(".boltnew");
    const { chatId } = JSON.parse(content);

    return chatId;
  } catch (error) {
    logger.warn("No .boltnew file found or unable to read it");
    return null;
  }
}

export async function writeBoltNewJson(
  chatId: string,
  chatItem: ChatHistoryItem
): Promise<void> {
  const fileName = `${chatId}.boltnew.json`;
  const content = JSON.stringify(chatItem, null, 2);
  await writeFile(fileName, content);
}

export async function readBoltNewJson(
  chatId: string
): Promise<ChatHistoryItem | null> {
  try {
    const fileName = `${chatId}.boltnew.json`;
    const content = await readFile(fileName);

    return JSON.parse(content) as ChatHistoryItem;
  } catch (error) {
    logger.warn(`No ${chatId}.boltnew.json file found or unable to read it`);
    return null;
  }
}
