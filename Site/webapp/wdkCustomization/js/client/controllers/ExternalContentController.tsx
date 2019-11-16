import React, { useEffect } from 'react';
import { usePromise } from 'wdk-client/Hooks/PromiseHook';
import { safeHtml } from 'wdk-client/Utils/ComponentUtils';
import {Loading} from 'wdk-client/Components';

interface Props {
  url: string;
}

export default function ExternalContentController(props: Props) {
  const { url } = props;

  const content = usePromise(async () => {
    try {
      const response = await fetch(url, { mode: 'cors' });
      if (response.ok) return response.text();
      return `<h1>${response.statusText}</h1>`;
    }
    catch (error) {
      console.error(error);
      return `<h1>Oops... something went wrong.</h1>`;
    }
  }, [ url ]);

  useEffect(() => {
    if (content == null) return;

    try {
      const parsedUrl = new URL(url, String(window.location));
      // scroll to element identified by hash
      if (parsedUrl.hash) location.hash = parsedUrl.hash;
    }
    catch(error) {
      console.error(error);
    }
  }, [ url, content ]);

  if (content == null) return <Loading/>;

  return safeHtml(content);
}
