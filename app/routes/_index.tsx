import { json, type MetaFunction } from '@remix-run/cloudflare';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { Chat } from '~/components/chat/Chat.client';
import { Header } from '~/components/header/Header';
import { useEffect } from 'react';
import { selectDirectory, selectedDirectoryHandle } from '~/lib/persistence/fileSystem';
import { useStore } from '@nanostores/react';
import { useNavigate } from '@remix-run/react';

export const meta: MetaFunction = () => {
  return [{ title: 'Bolt' }, { name: 'description', content: 'Talk with Bolt, an AI assistant from StackBlitz' }];
};

export const loader = () => json({});

export default function Index() {
  const directoryHandle = useStore(selectedDirectoryHandle);
  const navigate = useNavigate();

  useEffect(() => {
    if (!directoryHandle) {
      selectDirectory().then((existingChatId) => {
        if (existingChatId) {
          navigate(`/chat/${existingChatId}`);
        }
      }).catch(console.error);
    }
  }, [directoryHandle, navigate]);

  return (
    <div className="flex flex-col h-full w-full">
      <Header />
      {directoryHandle ? (
        <ClientOnly fallback={<BaseChat />}>{() => <Chat />}</ClientOnly>
      ) : (
        <div className="flex items-center justify-center h-full">
          <button
            onClick={() => selectDirectory().then((existingChatId) => {
              if (existingChatId) {
                navigate(`/chat/${existingChatId}`);
              }
            })}
            className="px-4 py-2 bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text rounded-md hover:bg-bolt-elements-button-primary-backgroundHover"
          >
            Select Directory to Start
          </button>
        </div>
      )}
    </div>
  );
}
