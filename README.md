# novel-style-revision README

This is the README for extension "novel-style-revision".

## Features

novel-style-revision is a VSCode plugin designed to enhance your writing style in real time. With its unique dual-cursor feature, you can write seamlessly: the end cursor follows your input while the starting cursor remains fixed. Once you stop typing, the plugin automatically sends the selected text to an intelligent language model (LLM), which refines the style and language, and displays the revised text. Effortlessly improve your writing quality, making your expression smoother and more precise. Writing has never been more efficient and enjoyable!

## Feature demonstration tutorial

 In the followingThink(default) mode, the input text requiring a style change will be automatically highlighted. After 3 seconds of no input, the LLM will provide synonymous text in the target style, as configured in your settings, in the left sidebar. You can apply the suggested changes using the Tab shortcut key or by clicking the "Apply Changes" button in the sidebar.
![base function demonstration](.assert/baseFunc.gif)
If you prefer the LLM not to continuously provide suggestions and only generate alternative styles when needed, you can disable the "Enable Auto-Think" option in the settings and click the "Apply Settings" button. In this mode, you can manually trigger a suggestion by using the **Ctrl + Tab** shortcut.
![cancel followThinking mode](.assert/cancelFollowingThinkingFunc.gif)
If you're not satisfied with the selected area, you can use the **Ctrl + '** shortcut to enter Selection Edit Mode. In this mode, you can adjust the boundaries of the selection using the **← → ↑ ↓** arrow keys. By default, the right boundary is controlled, but you can switch the boundary you want to adjust by pressing the **Space** key. To exit Selection Edit Mode, simply press the **Ctrl + '** shortcut again.
![change into select mode](.assert/checkIntoSelectMode.gif)
If you want to quickly clear the current selection, you can use the **ESC** shortcut. This will reposition both the left and right boundaries of the selection to your cursor's current location.
![remove select](.assert/removeSelect.gif)
Additionally, you can customize the selection color in the settings, as well as adjust the activation interval for LLM thinking in FollowThinking mode.

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
* "novel-style-revision.followingThink": Open the following think. if true, LLM will auto think after several seconds you stop typing. Default: true.
* "novel-style-revision.followingThinkInterval": Only valid when followingThink is True. And it means the milliseconds of the interval of auto thinking. Default: 3000.
* "novel-style-revision.baseURL": Set the base URL of your LLM API. Default: "https://open.bigmodel.cn/api/paas/v4/chat/completions".
* "novel-style-revision.apiKey": Set the API key of your LLM API.

## Release Notes

### 1.0.0
* Initial release of novel-style-revision

### 1.0.1
* Optimize the GUI of the plugin.
* Support multi-document autocomplete state caching.

### 1.0.2
* Fix the bug that the extension will be crashed when you active extension before you open text file.
* Optimized the Tab key shortcut logic to ensure compatibility with Copilot's suggestion functionality.
* Added a tutorial video for feature demonstration in the README file.
