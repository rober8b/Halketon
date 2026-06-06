'use client';

import { useEffect, useState, useRef } from 'react';
import { ConversationList, type ConversationListRef } from '@/components/conversation-list';
import { MessageView } from '@/components/message-view';

/**
 * Fuerza el modo light en el documento mientras estamos en el inbox.
 * Cubre la navegación SPA (cuando el script inicial del root layout ya corrió
 * con otra ruta). Al desmontarse restaura el modo previo para que el resto
 * de la app no quede afectada.
 */
function useForceLightMode() {
  useEffect(() => {
    const html = document.documentElement;
    const prevMode = html.dataset.mode ?? 'dark';
    const prevHadDark = html.classList.contains('dark');

    html.dataset.mode = 'light';
    html.style.colorScheme = 'light';
    html.style.backgroundColor = 'hsl(0 0% 100%)';
    html.classList.remove('dark');

    return () => {
      html.dataset.mode = prevMode;
      html.style.colorScheme = prevMode === 'dark' ? 'dark' : 'light';
      html.style.backgroundColor =
        prevMode === 'dark' ? 'hsl(20 14.3% 4.1%)' : 'hsl(0 0% 100%)';
      if (prevHadDark) html.classList.add('dark');
    };
  }, []);
}

type Conversation = {
  id: string;
  phoneNumber: string;
  contactName?: string;
  lastActiveAt?: string;
};

export default function Home() {
  useForceLightMode();
  const [selectedConversation, setSelectedConversation] = useState<Conversation>();
  const conversationListRef = useRef<ConversationListRef>(null);

  const handleTemplateSent = async (phoneNumber: string) => {
    // Refresh the conversation list and get the updated conversations
    const conversations = await conversationListRef.current?.refresh();

    // Find and select the conversation for the phone number
    if (conversations) {
      const conversation = conversations.find(conv => conv.phoneNumber === phoneNumber);
      if (conversation) {
        setSelectedConversation(conversation);
      }
    }
  };

  const handleBackToList = () => {
    setSelectedConversation(undefined);
  };

  return (
    <div className="light-surface flex h-dvh min-h-dvh w-full overflow-hidden bg-background text-foreground">
      <ConversationList
        ref={conversationListRef}
        onSelectConversation={setSelectedConversation}
        selectedConversationId={selectedConversation?.id}
        isHidden={!!selectedConversation}
      />
      <MessageView
        conversationId={selectedConversation?.id}
        phoneNumber={selectedConversation?.phoneNumber}
        contactName={selectedConversation?.contactName}
        lastActiveAt={selectedConversation?.lastActiveAt}
        onTemplateSent={handleTemplateSent}
        onBack={handleBackToList}
        isVisible={!!selectedConversation}
      />
    </div>
  );
}
