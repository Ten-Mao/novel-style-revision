# novel-style-revision README

This is the README for extension "novel-style-revision".

## Features

novel-style-revision is a VSCode plugin designed to enhance your writing style in real time. With its unique dual-cursor feature, you can write seamlessly: the end cursor follows your input while the starting cursor remains fixed. Once you stop typing, the plugin automatically sends the selected text to an intelligent language model (LLM), which refines the style and language, and displays the revised text. Effortlessly improve your writing quality, making your expression smoother and more precise. Writing has never been more efficient and enjoyable!


## Requirements & Installation

This extension uses the following dependencies:
* **axios**
    * A promise-based HTTP client for making requests to an API.
    * Recommend Version 1.7.7

## Installation

To install this extension, ensure you have all necessary dependencies listed in the `package.json` file. You can install the required dependencies by running:

```bash
npm install
```

## Extension Settings

This extension contributes the following settings:

* "novel-style-revision.style": Set your target writing style. Default : "村上春树".
* "novel-style-revision.language": Set your writing language. Default: "简体中文".
* "novel-style-revision.selectColor": Set the color of the background of the selected text. Default: "rgba(255, 0, 0, 0.3)".
* "novel-style-revision.followingThink": Open the following think. if True, LLM will auto think after several seconds you stop typing. Default: true.
* "novel-style-revision.followingThinkInterval": Only valid when followingThink is True. And it means the milliseconds of the interval of auto thinking. Default: 3000.
* "novel-style-revision.baseURL": Set the base URL of your LLM API. Default: "https://open.bigmodel.cn/api/paas/v4/chat/completions".
* "novel-style-revision.apiKey": Set the API key of your LLM API.

## Release Notes

### 1.0.0

Initial release of novel-style-revision

