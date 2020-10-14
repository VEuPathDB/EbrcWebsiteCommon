# EbrcWebsiteCommon
Frontend pages (js, css, images, html) common to all VEuPathDB sites. 

Our frontend code stored in this repo has evolved in the last few years from a Struts based framework (jsx pages) to a modern REST-based architecture with a javascript/typescript React client as frontend. We plan to rename eventually this project as EbrcClientCommon.

Frontend pages specialization for specific websites at: 
<a target="_blank" href="https://github.com/VEuPathDB/ApiCommonWebsite">ApiCommonWebsite</a>,
<a target="_blank" href="https://github.com/VEuPathDB/OrthoMCLClient">OrthoMCLClient</a>.

## Description

`EbrcWebsiteCommon` contains an extension of the [WDKClient](https://github.com/VEuPathDB/WDKClient) for our VEuPathDB sites.
As with the `WDKClient`, `EbrcWebsiteCommon` React-based clieent code is mostly written in [TypeScript](https://www.typescriptlang.org/) and SCSS
([Sass](https://sass-lang.com/)).


## Installation and Usage

Presently, `EbrcWebsiteCommon` should be installed following the [Strategies WDK
Documentation](https://docs.google.com/document/u/1/d/1nZayjR-0Hj3YeukjfwoWZ3TzokuuuWvSwnhw_q41oeE/pub).

Dependencies are managed with [yarn](https://yarnpkg.com/).

Tests are written for the [jest](https://jestjs.io/) testing framework.
