import {
  Auth, CTALinkOrButton,
  ProgressDots,
} from '@bluedot/ui';
import axios from 'axios';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { PresignedPostResponse } from '../pages/api/presigned-upload';

const MarkdownEditor = dynamic(() => import('./MarkdownEditor'), { ssr: false, loading: () => <ProgressDots /> });

export type BodyEditorProps = {
  auth: Auth;
  children?: string;
  onSave: (body: string) => Promise<void>;
};

export const BodyEditor: React.FC<BodyEditorProps> = ({ auth, children, onSave }) => {
  const [body, setBody] = useState<null | string>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (body === null && children) {
      setBody(children);
    }
  }, [children]);

  // Add beforeunload event listener to warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const [isSaving, setIsSaving] = useState(false);
  const save = async () => {
    setIsSaving(true);
    try {
      if (body) {
        await onSave(body);
        setHasUnsavedChanges(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const uploadFile = async (fileData: ArrayBuffer, fileType: string) => {
    const blob = new Blob([fileData], { type: fileType });

    const presignedResponse = await axios<PresignedPostResponse>({
      method: 'POST',
      url: '/api/presigned-upload',
      data: {
        contentType: fileType,
      },
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    });

    const formData = new FormData();
    Object.entries(presignedResponse.data.fields).forEach(([key, value]) => {
      formData.append(key, String(value));
    });
    formData.append('file', blob);
    await axios.post(presignedResponse.data.uploadUrl, formData);

    return { url: presignedResponse.data.fileUrl };
  };

  return (
    <div className="max-w-3xl flex flex-col gap-4">
      <MarkdownEditor
        uploadFile={uploadFile}
        onChange={(newBody) => {
          setHasUnsavedChanges(true);
          setBody(newBody);
        }}
      >
        {children}
      </MarkdownEditor>
      {body && (
        <div className="flex flex-col gap-4">
          {hasUnsavedChanges && (
            <div className="text-amber-600 text-size-sm">
              You have unsaved changes
            </div>
          )}
          <CTALinkOrButton onClick={save}>
            {isSaving ? 'Saving...' : 'Save'}
          </CTALinkOrButton>
        </div>
      )}
    </div>
  );
};
