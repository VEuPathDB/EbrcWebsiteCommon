import React, { useCallback, useEffect, useState } from 'react';

import { Dialog } from 'wdk-client/Components';
import { makeClassNameHelper } from 'wdk-client/Utils/ComponentUtils';

const cx = makeClassNameHelper('ImageUploadDialog');

interface Props {
  onSubmit: (file: File) => void;
  onClose: () => void;
}

export function ImageUploadDialog({ onSubmit, onClose }: Props) {
  const { imageFile, imageUrl } = useImageFromClipboard();

  const onClickOk = useCallback(() => {
    onSubmit(imageFile as File);
  }, [ onSubmit, imageFile ]);

  return (
    <Dialog open modal className={cx()} onClose={onClose}>
      <img className={cx('--Image')} src={imageUrl} />
      <div className={cx('--Footer')}>
        <button disabled={imageFile == null} onClick={onClickOk} type="button">OK</button>
        <button onClick={onClose} type="button">Cancel</button>
      </div>
    </Dialog>
  );
}

function useImageFromClipboard() {
  const [ pastedImage, setPastedImage ] = useState<File | undefined>(undefined);
  const [ pastedImageUrl, setPastedImageUrl ] = useState<string | undefined>(undefined);

  useEffect(() => {
    window.addEventListener('paste', handlePaste, false);

    return () => {
      window.removeEventListener('paste', handlePaste, false);
    };

    function handlePaste(event: Event) {
      if (
        event instanceof ClipboardEvent &&
        event.clipboardData?.items != null
      ) {
        const pastedItems = [...event.clipboardData.items];
        const pastedImageItem = pastedItems.find(({ type }) => type.startsWith('image'));

        if (pastedImageItem != null) {
          const pastedImageFile = pastedImageItem.getAsFile();

          if (pastedImageFile != null) {
            setPastedImage(pastedImageFile);
            setPastedImageUrl(URL.createObjectURL(pastedImageFile));
          }
        }
      }
    }
  }, []);

  useEffect(() => () => {
    if (pastedImageUrl != null) {
      URL.revokeObjectURL(pastedImageUrl);
    }
  }, [ pastedImageUrl ]);

  return {
    imageFile: pastedImage,
    imageUrl: pastedImageUrl
  };
}
