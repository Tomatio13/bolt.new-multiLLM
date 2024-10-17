import { useLoaderData, useNavigate } from '@remix-run/react';
import { useState, useEffect } from 'react';
import { atom } from 'nanostores';
import type { Message } from 'ai';
import { toast } from 'react-toastify';
import { workbenchStore } from '~/lib/stores/workbench';
import { getMessages, getNextId, getUrlId, openDatabase, setMessages } from './db';
import * as FileSystem from './fileSystem';

export interface ChatHistoryItem {
  id: string;
  urlId?: string;
  description?: string;
  messages: Message[];
  timestamp: string;
}

const persistenceEnabled = !import.meta.env.VITE_DISABLE_PERSISTENCE;

export const db = persistenceEnabled ? await openDatabase() : undefined;

export const chatId = atom<string | undefined>(undefined);
export const description = atom<string | undefined>(undefined);

export function useChatHistory() {
  const navigate = useNavigate();
  const { id: mixedId } = useLoaderData<{ id?: string }>();

  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [ready, setReady] = useState<boolean>(false);
  const [urlId, setUrlId] = useState<string | undefined>();
  const [ignoreFolderId, setIgnoreFolderId] = useState<boolean>(false);

  useEffect(() => {
    if (!db) {
      setReady(true);

      if (persistenceEnabled) {
        toast.error(`Chat persistence is unavailable`);
      }

      return;
    }

    async function initializeChat() {
      let chatIdToUse = mixedId;

      if (!ignoreFolderId) {
        const boltNewChatId = await FileSystem.readBoltNewFile();
        if (boltNewChatId) {
          chatIdToUse = boltNewChatId;
        }
      }

      if (chatIdToUse) {
        try {
          // First, try to get the chat history from the local folder
          const localChatItem = await FileSystem.readBoltNewJson(chatIdToUse);

          if (localChatItem && localChatItem.messages.length > 0) {
            setInitialMessages(localChatItem.messages);
            setUrlId(localChatItem.urlId);
            description.set(localChatItem.description);
            chatId.set(localChatItem.id);

            // Update the files in the workbench with the latest content from the local folder
            await FileSystem.createProjectFiles(localChatItem);
          } else {
            // If not found in the local folder, fallback to IndexedDB
            const storedMessages = await getMessages(db, chatIdToUse);
            if (storedMessages && storedMessages.messages.length > 0) {
              setInitialMessages(storedMessages.messages);
              setUrlId(storedMessages.urlId);
              description.set(storedMessages.description);
              chatId.set(storedMessages.id);

              // Update the local folder with the content from IndexedDB
              await FileSystem.createProjectFiles(storedMessages);
            } else {
              navigate(`/`, { replace: true });
            }
          }
        } catch (error) {
          toast.error((error as Error).message);
        }
      }

      setReady(true);
    }

    initializeChat();
  }, [mixedId, ignoreFolderId]);

  return {
    ready: !mixedId || ready,
    initialMessages,
    ignoreFolderId,
    setIgnoreFolderId,
    storeMessageHistory: async (messages: Message[]) => {
      if (!db || messages.length === 0) {
        return;
      }

      const { firstArtifact } = workbenchStore;

      if (!urlId && firstArtifact?.id) {
        const urlId = await getUrlId(db, firstArtifact.id);

        navigateChat(urlId);
        setUrlId(urlId);
      }

      if (!description.get() && firstArtifact?.title) {
        description.set(firstArtifact?.title);
      }

      if (initialMessages.length === 0 && !chatId.get()) {
        const nextId = await getNextId(db);

        chatId.set(nextId);

        if (!urlId) {
          navigateChat(nextId);
        }
      }

      const chatItem: ChatHistoryItem = {
        id: chatId.get() as string,
        urlId,
        description: description.get(),
        messages,
        timestamp: new Date().toISOString(),
      };

      await setMessages(db, chatItem.id, messages, urlId, description.get());

      // Update the local folder with the latest chat history
      await FileSystem.writeBoltNewJson(chatItem.id, chatItem);
      await FileSystem.createProjectFiles(chatItem);
    },
  };
}

function navigateChat(nextId: string) {
  const url = new URL(window.location.href);
  url.pathname = `/chat/${nextId}`;

  window.history.replaceState({}, '', url);
}
