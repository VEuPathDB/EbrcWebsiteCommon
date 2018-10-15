import React from 'react';

import './HomePage.scss';
import { Showcase } from 'Client/App/Showcase';
import { News } from 'Client/App/NewsSidebar';

const HomePage = ({ newsSidebar, webAppUrl, projectId, siteData, attemptAction, homeContent }) =>
  <div className="HomePage">
    <div className="Showcase-Section">
      {homeContent(siteData).map((section, idx) => (
        <Showcase
          studies={siteData.studies}
          content={section}
          prefix={webAppUrl}
          projectId={projectId}
          attemptAction={attemptAction}
          key={idx}
        />
      ))}
    </div>
    <div className="News-Section">
      <News webAppUrl={webAppUrl} {...newsSidebar} />
    </div>
  </div>

export default HomePage;
