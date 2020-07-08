import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactCrop, { Crop } from 'react-image-crop';

import { Dialog } from 'wdk-client/Components';
import { makeClassNameHelper } from 'wdk-client/Utils/ComponentUtils';

import {
  MAX_ATTACHMENT_SIZE,
  MAX_ATTACHMENT_SIZE_DESCRIPTION
} from 'ebrc-client/selectors/ContactUsSelectors';

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
    submitCroppedImg(previewImageRef.current, crop, onSubmit, imageFile);
  }, [ previewImageRef.current, crop, onSubmit, imageFile ]);

  return (
    <Dialog open modal className={cx()} title="Add A Screenshot From Your Clipboard" onClose={onClose}>
      <div className={cx('--PasteZone')}>
        {
          imageUrl == null
            ? <p className={cx('--Instructions')}>Paste a screenshot into this window using Ctrl/Command + V</p>
            : <ReactCrop
                onImageLoaded={onPreviewImageLoaded}
                src={imageUrl}
                crop={crop}
                onChange={setCrop}
              />
        }
      </div>
      <div className={cx('--Footer')}>
        <button className="btn" disabled={imageFile == null} onClick={onClickOk} type="button">OK</button>
        <button className="btn" onClick={onClose} type="button">Cancel</button>
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

      if (pastedImageItem == null) {
        alert("No image was found in your clipboard. You can add a screenshot to your clipboard using your computer's 'Print Screen' functionality.");
        return;
      }

      const pastedImageFile = pastedImageItem.getAsFile();

      if (pastedImageFile != null) {
        setPastedImage(pastedImageFile);
        setPastedImageUrl(URL.createObjectURL(pastedImageFile));
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
  previewImage: HTMLImageElement | undefined,
  crop: Crop | undefined,
  onSubmit: (file: File) => void,
  uncroppedFile: File | undefined
) {
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
    if (uncroppedFile.size > MAX_ATTACHMENT_SIZE) {
      alert(`Please submit a screenshot which is under ${MAX_ATTACHMENT_SIZE_DESCRIPTION}`);
      return;
    }

    onSubmit(uncroppedFile);
    return;
  }

  const devicePixelRatio = window.devicePixelRatio || 1;

  const canvas = document.createElement('canvas');
  const scaleX = previewImage.naturalWidth / previewImage.width;
  const scaleY = previewImage.naturalHeight / previewImage.height;
  canvas.width = crop.width * scaleX / devicePixelRatio;
  canvas.height = crop.height * scaleY / devicePixelRatio;
  const ctx = canvas.getContext('2d');

  if (ctx == null) {
    throw new Error('Could not initialize canvas for cropped screenshot.');
  }

  ctx.drawImage(
    previewImage,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width * scaleX / devicePixelRatio,
    crop.height * scaleY / devicePixelRatio
  );

  canvas.toBlob(blob => {
    if (blob == null) {
      throw new Error('Could not write the cropped screenshot canvas to a file');
    }

    if (blob.size > MAX_ATTACHMENT_SIZE) {
      alert(`Please submit a cropping which is under ${MAX_ATTACHMENT_SIZE_DESCRIPTION}`);
      return;
    }

    const croppedFile = new File([ blob ], uncroppedFile.name);

    onSubmit(croppedFile);
  }, uncroppedFile.type, 1);
}
