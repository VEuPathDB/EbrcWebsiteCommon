import StudyCard from './StudyCard';
import StudyMenuItem from './StudyMenuItem';
import StudyMenuSearch from './StudyMenuSearch';
import * as StudyUtils from './StudyUtils';
export { StudyCard, StudyMenuItem, StudyMenuSearch, StudyUtils };
import UIThemeProvider from '@veupathdb/core-components/dist/components/theming/UIThemeProvider';
import { colors } from '@veupathdb/core-components';

<UIThemeProvider
theme={{
  palette: {
    primary: { hue: colors.mutedGreen, level: 500 },
    secondary: { hue: colors.mutedMagenta, level: 500 },
  },
}}
>
</UIThemeProvider> 
