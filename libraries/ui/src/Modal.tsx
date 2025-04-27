import React, { ReactNode } from 'react';
import {
  Dialog,
  Modal as AriaModal,
  ModalOverlay,
  Button as AriaButton,
  Heading,
} from 'react-aria-components';

export interface ModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  title: string;
  children: ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  setIsOpen,
  title,
  children,
}) => {
  return (
    <ModalOverlay
      isDismissable
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      className="fixed inset-0 z-10 overflow-y-auto bg-black/25 flex min-h-full items-center justify-center p-4 backdrop-blur-xs"
    >
      <AriaModal>
        <Dialog className="bg-white rounded-lg shadow-xl w-full p-10 outline-none">
          <div className="flex justify-between items-center mb-4">
            <Heading slot="title" className="text-size-lg font-semibold">{title}</Heading>
            <AriaButton onPress={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
              <span className="text-2xl">&times;</span>
            </AriaButton>
          </div>

          {children}
        </Dialog>
      </AriaModal>
    </ModalOverlay>
  );
};
