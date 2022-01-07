import Home from './Home';
export default Home;
import React from 'react';
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

