import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactCrop, { Crop } from 'react-image-crop';

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
  const [ crop, setCrop ] = useState<Crop | undefined>(initialCrop);
  const fullImageRef = useRef<HTMLImageElement>(null);
  const previewImageRef = useRef<HTMLImageElement>();

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

  const onPreviewImageLoaded = useCallback((previewImage: HTMLImageElement) => {
    previewImageRef.current = previewImage;
  }, [ previewImageRef.current ]);

  const onClickOk = useCallback(() => {
    submitCroppedImg(fullImageRef.current, previewImageRef.current, crop, onSubmit, imageFile);
  }, [ fullImageRef.current, previewImageRef.current, crop, onSubmit, imageFile ]);

  return (
    <Dialog open modal className={cx()} onClose={onClose}>
      <div className={cx('--PasteZone')}>
        {
          imageUrl &&
          <ReactCrop
            onImageLoaded={onPreviewImageLoaded}
            src={imageUrl}
            crop={crop}
            onChange={setCrop}
          />
        }
        <img ref={fullImageRef} src={imageUrl} style={{ display: 'none' }} />
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

  const handlePaste = useCallback((event: Event) => {
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
  }, []);

  useEffect(() => {
    window.addEventListener('paste', handlePaste, false);

    return () => {
      window.removeEventListener('paste', handlePaste, false);
    };
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

// Adaptation of https://github.com/DominicTobias/react-image-crop#what-about-showing-the-crop-on-the-client
function submitCroppedImg(
  fullImage: HTMLImageElement | null,
  previewImage: HTMLImageElement | undefined,
  crop: Crop | undefined,
  onSubmit: (file: File) => void,
  uncroppedFile: File | undefined
) {
  if (fullImage == null) {
    throw new Error('Could not obtain the image containing the pasted screenshot.');
  }

  if (previewImage == null) {
    throw new Error('Could not obtain preview image for the pasted screenshot.');
  }

  if (uncroppedFile == null) {
    throw new Error('Could not retrieve the file with the pasted screenshot.');
  }

  if (
    crop == null ||
    crop.x == null ||
    crop.y == null ||
    crop.height == null ||
    crop.width == null
  ) {
    onSubmit(uncroppedFile);
    return;
  }

  const canvas = document.createElement('canvas');
  const scaleX = fullImage.naturalWidth / previewImage.width;
  const scaleY = fullImage.naturalHeight / previewImage.height;
  canvas.width = crop.width * scaleX / window.devicePixelRatio;
  canvas.height = crop.height * scaleY / window.devicePixelRatio;
  const ctx = canvas.getContext('2d');

  if (ctx == null) {
    throw new Error('Could not initialize canvas for cropped screenshot.');
  }

  ctx.drawImage(
    fullImage,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width * scaleX / window.devicePixelRatio,
    crop.height * scaleY / window.devicePixelRatio
  );

  canvas.toBlob(blob => {
    if (blob == null) {
      throw new Error('Could not write the cropped screenshot canvas to a file');
    }

    const croppedFile = new File([ blob ], uncroppedFile.name);

    onSubmit(croppedFile);
  }, uncroppedFile.type, 1);
}
