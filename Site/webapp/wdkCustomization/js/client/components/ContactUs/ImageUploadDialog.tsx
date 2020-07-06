import React, { useCallback, useEffect, useState } from 'react';
import ReactCrop from 'react-image-crop';

import { Dialog } from 'wdk-client/Components';
import { makeClassNameHelper } from 'wdk-client/Utils/ComponentUtils';

import 'react-image-crop/lib/ReactCrop.scss';

import './ImageUploadDialog.scss';

const cx = makeClassNameHelper('ImageUploadDialog');

interface Props {
  onSubmit: (file: File) => void;
  onClose: () => void;
}

export function ImageUploadDialog({ onSubmit, onClose }: Props) {
  const { imageFile, imageUrl } = useImageFromClipboard();

  const initialCrop = { unit: '%', x: 25, y: 25, height: 50, width: 50, aspect: undefined } as const;
  const [ crop, setCrop ] = useState<ReactCrop.Crop | undefined>(initialCrop);

  const resetCrop = useCallback(() => {
    setCrop(initialCrop);
  }, []);

  useEffect(() => {
    resetCrop();
  }, [ imageFile, resetCrop ]);

  useEffect(() => {
    window.addEventListener('resize', resetCrop);

    return () => {
      window.removeEventListener('resize', resetCrop);
    };
  }, [ resetCrop ]);

  const onClickOk = useCallback(() => {
    onSubmit(imageFile as File);
  }, [ onSubmit, imageFile ]);

  return (
    <Dialog open modal className={cx()} onClose={onClose}>
      <div className={cx('--PasteZone')}>
        {
          imageUrl &&
          <ReactCrop
            src={imageUrl}
            crop={crop}
            onChange={setCrop}
          />
        }
      </div>
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
