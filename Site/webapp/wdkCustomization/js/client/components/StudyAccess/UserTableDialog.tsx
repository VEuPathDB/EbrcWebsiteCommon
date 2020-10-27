import React, { useEffect, useRef, useState } from 'react';

import { partition } from 'lodash';

import { Dialog, TextArea } from 'wdk-client/Components';

import { cx } from 'ebrc-client/components/StudyAccess/StudyAccess';
import { EMAIL_REGEX } from 'ebrc-client/util/email';

export interface Props {
  title: React.ReactNode;
  content: React.ReactNode;
  onClose: () => void;
}

export function UserTableDialog({
  title,
  content,
  onClose
}: Props) {
  return (
    <Dialog
      className={cx('--UserTableDialog')}
      title={title}
      open
      onClose={onClose}
      modal
    >
      {content}
    </Dialog>
  );
}

export type ContentProps =
  | { type: 'access-denial' } & AccessDenialContentProps
  | { type: 'add-providers' } & AddProvidersContentProps;

interface AccessDenialContentProps {
  userName: string;
  onSubmit: (denialReason: string) => void;
}

export function AccessDenialContent({ onSubmit, userName }: AccessDenialContentProps) {
  const [ denialReason, setDenialReason ] = useState('');

  return (
    <div className={cx('--AccessDenialContent')}>
      <div className={cx('--AccessDenialReason')}>
        You are denying {userName} access to this study. Please provide a reason:
        <TextArea
          value={denialReason}
          onChange={setDenialReason}
          rows={6}
          cols={100}
        />
      </div>
      <div className={cx('--AccessDenialSubmit')}>
        <button
          type="button"
          className="btn"
          onClick={() => {
            onSubmit(denialReason);
          }}
        >
          Submit
        </button>
      </div>
    </div>
  );
}

interface AddProvidersContentProps {
  onSubmit: (providerEmails: string[]) => void;
}

export function AddProvidersContentDialog({ onSubmit }: AddProvidersContentProps) {
  const [ providerEmailField, setProviderEmailField ] = useState('');
  const [ providerEmails, setProviderEmails ] = useState()

  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const draftEmails = providerEmailField.split(/[,;\s]+/g).filter(x => x.length > 0);

    const [ validEmails, invalidEmails ] = partition(draftEmails, email => EMAIL_REGEX.test(email));

    setProviderEmails(validEmails);

    if (ref.current != null) {
      if (invalidEmails.length > 0) {
        ref.current.setCustomValidity(`Please correct the following emails: ${invalidEmails.join(', ')}.`);
      } else {
        ref.current.setCustomValidity('');
      }
    }
  }, [ providerEmailField ]);

  return (
    <form
      className={cx('--AddProvidersContent')}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(providerEmails);
      }}
    >
      <div className={cx('--AddProvidersEmailField')}>
        Please input the emails of the providers you wish to add:
        <textarea
          required
          ref={ref}
          value={providerEmailField}
          onChange={(e) => {
            setProviderEmailField(e.target.value)
          }}
          rows={6}
          cols={100}
        />
      </div>
      <div className={cx('--AddProvidersSubmit')}>
        <button
          type="submit"
          className="btn"
        >
          Submit
        </button>
      </div>
    </form>
  );
}
