import React, { useState } from 'react';

import { Dialog, TextArea } from 'wdk-client/Components';

import { cx } from 'ebrc-client/components/StudyAccess/StudyAccess';

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

  return (
    <div className={cx('--AddProvidersContent')}>
      <div className={cx('--AddProvidersEmailField')}>
        Please input the emails of the providers you wish to add:
        <TextArea
          value={providerEmailField}
          onChange={setProviderEmailField}
          rows={6}
          cols={100}
        />
      </div>
      <div className={cx('--AddProvidersSubmit')}>
        <button
          type="button"
          className="btn"
          onClick={() => {
            onSubmit([ providerEmailField ]);
          }}
        >
          Submit
        </button>
      </div>
    </div>
  );
}
