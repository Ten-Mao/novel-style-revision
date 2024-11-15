const vscode = require('vscode');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

let typingTimer;
let left_selector = new vscode.Position(0, 0);
let right_selector = new vscode.Position(0, 0);

let modifiedText = ''; // 存储修改后的文本
let viewProviderInstance = null; // 存储 NovelStyleRevisionViewProvider 实例
let activeContext = null;
let activeEditor = null;
let inThinking = false;
let switchToChangeSeletorMode = false;
let selectorMode = 0;

let config = null;
let writingStyle = "莎士比亚";
let language = "简体中文"
let baseURL = "";
let apiKey = "";
let selectColor = "rgba(255, 0, 0, 0.3)";
let followingThink = true;
let followingThinkInterval = 3000;

let decorationType = vscode.window.createTextEditorDecorationType({
  backgroundColor: 'rgba(255, 0, 0, 0.3)'  // 红色背景，透明度 30%
});

function activate(context) {
  activeEditor = vscode.window.activeTextEditor;
  activeContext = context;
  const document = activeEditor.document;

  config = vscode.workspace.getConfiguration('novel-style-revision')
  writingStyle = config.get('style');
  language = config.get('language');
  baseURL = config.get('baseURL');
  apiKey = config.get('apiKey');
  selectColor = config.get('selectColor');
  followingThink = config.get('followingThink');
  followingThinkInterval = config.get('followingThinkInterval');
  if (selectColor !== "")
  {
    decorationType = vscode.window.createTextEditorDecorationType({
      backgroundColor: selectColor
    });
  }
  else
  {
    decorationType = vscode.window.createTextEditorDecorationType({
      backgroundColor: 'rgba(255, 0, 0, 0.3)'  // 红色背景，透明度 30%
    });
  }


  const lastLine = document.lineCount - 1;  // 最后一行的索引
  const lastLineLength = document.lineAt(lastLine).text.length;  // 最后一行的长度
  left_selector = new vscode.Position(lastLine, lastLineLength);
  right_selector = new vscode.Position(lastLine, lastLineLength);
  activeEditor.setDecorations(decorationType, [new vscode.Range(left_selector, right_selector)]);

  vscode.workspace.onDidChangeTextDocument(event => {
    if (inThinking) {
      return;
    }
    if (activeEditor && event.document === activeEditor.document) {
      const changes = event.contentChanges;
      if (changes.length > 0) {
        const change = changes[0];
        const changedPosion = change.range.start;
        if(changedPosion.isBefore(left_selector)){
          const document = activeEditor.document;
          const lastLine = document.lineCount - 1;
          const lastLineLength = document.lineAt(lastLine).text.length;
          left_selector = new vscode.Position(lastLine, lastLineLength);
          right_selector = new vscode.Position(lastLine, lastLineLength);
          activeEditor.setDecorations(decorationType, [new vscode.Range(left_selector, right_selector)]);
          console.log('Reset prePosition due to text deletion');
        }
        else{
          const document = activeEditor.document;
          const lastLine = document.lineCount - 1;
          const lastLineLength = document.lineAt(lastLine).text.length;
          right_selector = new vscode.Position(lastLine, lastLineLength);
          activeEditor.setDecorations(decorationType, [new vscode.Range(left_selector, right_selector)]);
        }
        if (followingThink)
        {
          if (left_selector.isEqual(right_selector)) 
            {
              clearTimeout(typingTimer);
              viewProviderInstance.hideThinking();
              return;
            }
            const selectedText = getSelectedText();
            if (String(selectedText) === "\r\n" || String(selectedText) === "\n")
            {
              left_selector = new vscode.Position(right_selector.line, right_selector.character);
              activeEditor.setDecorations(decorationType, [new vscode.Range(left_selector, right_selector)]);
              clearTimeout(typingTimer);
              return;
            }
            clearTimeout(typingTimer);
            typingTimer = setTimeout(() => {
              triggerTextModification(selectedText);
            }, followingThinkInterval);
            viewProviderInstance.showThinking();
        }
        
      }
    }
  }, null, context.subscriptions);

  // 注册命令
  context.subscriptions.push(vscode.commands.registerCommand('novel-style-revision.handleTab', () => {

    if (activeEditor && modifiedText === "") {
      // 如果没有修改文本，执行插入 Tab 的命令
      vscode.commands.executeCommand('tab');
    } else {
      applyModifiedText();
    }
  }));
  context.subscriptions.push(vscode.commands.registerCommand('novel-style-revision.handleSpace', () => {
    if(switchToChangeSeletorMode) selectorMode = 1 - selectorMode;
    else{
      vscode.commands.executeCommand('type', {text: ' '});
    }
  }));
  context.subscriptions.push(vscode.commands.registerCommand('novel-style-revision.handleCtrlAndQuotation', () => {
    switchToChangeSeletorMode = !switchToChangeSeletorMode;
    if(switchToChangeSeletorMode) selectorMode = 0;
  }));
  context.subscriptions.push(vscode.commands.registerCommand('novel-style-revision.handleCtrlAndTab', () => {
    let selectedText = getSelectedText();
    if (activeEditor && selectedText !== "") {
      // 如果没有修改文本，执行插入 Tab 的命令
      triggerTextModification(selectedText);
      viewProviderInstance.showThinking();
    } 
  }));
  context.subscriptions.push(vscode.commands.registerCommand('novel-style-revision.handleEsc', () => {
    cancelModifiedText();
  }));
  context.subscriptions.push(vscode.commands.registerCommand('novel-style-revision.handleLeft', () => {
    if(switchToChangeSeletorMode) {
      let rightLine = right_selector.line;
      let rightCharacter = right_selector.character;
      let leftLine = left_selector.line;
      let leftCharacter = left_selector.character;
      if(selectorMode === 0 && right_selector.isAfter(left_selector)){
        let document = activeEditor.document;
        if(rightLine > 0 && rightCharacter > 0){
          right_selector = new vscode.Position(rightLine, rightCharacter - 1);
          activeEditor.setDecorations(decorationType, [new vscode.Range(left_selector, right_selector)]);
        }
        else if(rightLine > 0 && rightCharacter === 0){
          rightLine = rightLine - 1;
          rightCharacter = document.lineAt(rightLine).text.length;
          right_selector = new vscode.Position(rightLine, rightCharacter);
          activeEditor.setDecorations(decorationType, [new vscode.Range(left_selector, right_selector)]);
        }
        else if(rightLine === 0 && rightCharacter > 0){
          right_selector = new vscode.Position(rightLine, rightCharacter - 1);
          activeEditor.setDecorations(decorationType, [new vscode.Range(left_selector, right_selector)]);
        }
        else return;
      }
      else if(selectorMode === 1)
      {
        if(leftLine > 0 && leftCharacter > 0){
          left_selector = new vscode.Position(leftLine, leftCharacter - 1);
          activeEditor.setDecorations(decorationType, [new vscode.Range(left_selector, right_selector)]);
        }
        else if(leftLine > 0 && leftCharacter === 0){
          leftLine = leftLine - 1;
          leftCharacter = document.lineAt(leftLine).text.length;
          left_selector = new vscode.Position(leftLine, leftCharacter);
          activeEditor.setDecorations(decorationType, [new vscode.Range(left_selector, right_selector)]);
        }
        else if(leftLine === 0 && leftCharacter > 0){
          left_selector = new vscode.Position(leftLine, leftCharacter - 1);
          activeEditor.setDecorations(decorationType, [new vscode.Range(left_selector, right_selector)]);
        }
        else return;
      }
      else return;
    }
    else{
      vscode.commands.executeCommand('cursorLeft');
    }
  }));
  context.subscriptions.push(vscode.commands.registerCommand('novel-style-revision.handleRight', () => {
    if(switchToChangeSeletorMode) {
      let rightLine = right_selector.line;
      let rightCharacter = right_selector.character;
      let leftLine = left_selector.line;
      let leftCharacter = left_selector.character;
      let document = activeEditor.document;
      let lastLine = activeEditor.document.lineCount - 1;
      let lastLineLength = activeEditor.document.lineAt(lastLine).text.length;
      if(selectorMode === 0){
        if(rightLine < lastLine && rightCharacter < document.lineAt(rightLine).text.length){
          right_selector = new vscode.Position(rightLine, rightCharacter + 1);
          activeEditor.setDecorations(decorationType, [new vscode.Range(left_selector, right_selector)]);
        }
        else if(rightLine < lastLine && rightCharacter === document.lineAt(rightLine).text.length){
          rightLine = rightLine + 1;
          rightCharacter = 0;
          right_selector = new vscode.Position(rightLine, rightCharacter);
          activeEditor.setDecorations(decorationType, [new vscode.Range(left_selector, right_selector)]);
        }
        else if(rightLine === lastLine && rightCharacter < lastLineLength){
          right_selector = new vscode.Position(rightLine, rightCharacter + 1);
          activeEditor.setDecorations(decorationType, [new vscode.Range(left_selector, right_selector)]);
        }
        else return;
      }
      else if(selectorMode === 1 && right_selector.isAfter(left_selector))
      {
        if(leftLine < lastLine && leftCharacter < document.lineAt(leftLine).text.length){
          left_selector = new vscode.Position(leftLine, leftCharacter + 1);
          activeEditor.setDecorations(decorationType, [new vscode.Range(left_selector, right_selector)]);
        }
        else if(leftLine < lastLine && leftCharacter === document.lineAt(leftLine).text.length){
          leftLine = leftLine + 1;
          leftCharacter = 0;
          left_selector = new vscode.Position(leftLine, leftCharacter);
          activeEditor.setDecorations(decorationType, [new vscode.Range(left_selector, right_selector)]);
        }
        else if(leftLine === lastLine && leftCharacter < lastLineLength){
          left_selector = new vscode.Position(leftLine, leftCharacter + 1);
          activeEditor.setDecorations(decorationType, [new vscode.Range(left_selector, right_selector)]);
        }
        else return;
      }
    }
    else{
      vscode.commands.executeCommand('cursorRight');
    }
  }));
  context.subscriptions.push(vscode.commands.registerCommand('novel-style-revision.handleUp', () => {
    if(switchToChangeSeletorMode) {
      let rightLine = right_selector.line;
      let rightCharacter = right_selector.character;
      let leftLine = left_selector.line;
      let leftCharacter = left_selector.character;
      if(selectorMode === 0 && rightLine > leftLine){
        rightLine = rightLine - 1;
        rightCharacter = Math.min(rightCharacter, activeEditor.document.lineAt(rightLine).text.length);
        if(rightLine === leftLine && rightCharacter < leftCharacter) return;
        right_selector = new vscode.Position(rightLine, rightCharacter);
        activeEditor.setDecorations(decorationType, [new vscode.Range(left_selector, right_selector)]);
      }
      else if(selectorMode === 1 && leftLine > 0){
        leftLine = leftLine - 1;
        leftCharacter = Math.min(leftCharacter, activeEditor.document.lineAt(leftLine).text.length);
        left_selector = new vscode.Position(leftLine, leftCharacter);
        activeEditor.setDecorations(decorationType, [new vscode.Range(left_selector, right_selector)]);
      }
    }
    else{
      vscode.commands.executeCommand('cursorUp');
    }
  }));
  context.subscriptions.push(vscode.commands.registerCommand('novel-style-revision.handleDown', () => {
    if(switchToChangeSeletorMode) {
      let rightLine = right_selector.line;
      let rightCharacter = right_selector.character;
      let leftLine = left_selector.line;
      let leftCharacter = left_selector.character;
      let lastLine = activeEditor.document.lineCount - 1;
      if(selectorMode === 0 && rightLine < lastLine){
        rightLine = rightLine + 1;
        rightCharacter = Math.min(rightCharacter, activeEditor.document.lineAt(rightLine).text.length);
        right_selector = new vscode.Position(rightLine, rightCharacter);
        activeEditor.setDecorations(decorationType, [new vscode.Range(left_selector, right_selector)]);
      }
      else if(selectorMode === 1 && leftLine < rightLine){
        leftLine = leftLine + 1;
        leftCharacter = Math.min(leftCharacter, activeEditor.document.lineAt(leftLine).text.length);
        if(leftLine === rightLine && leftCharacter > rightCharacter) return;
        left_selector = new vscode.Position(leftLine, leftCharacter);
        activeEditor.setDecorations(decorationType, [new vscode.Range(left_selector, right_selector)]);
      }
    }
    else{
      vscode.commands.executeCommand('cursorDown');
    }
  }));

  // 注册 Webview 视图提供程序
  viewProviderInstance = new NovelStyleRevisionViewProvider(activeContext);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('novel-style-revision.view', viewProviderInstance)
  );
}

async function triggerTextModification(selectedText) {

  console.log('Selected text:', JSON.stringify(selectedText));

  try {
    if (getSelectedText() === "\r\n" || String(getSelectedText()) === "\n" || String(getSelectedText()) === "") return;
    // 通过某种方式将选中的文本发送到 LLM（如 GPT）进行风格修改
    modifiedText = await getChatCompletion(selectedText);  // 模拟调用 LLM
    console.log('Modified text:', JSON.stringify(modifiedText));

    if (getSelectedText() === "\r\n" || String(getSelectedText()) === "\n" || String(getSelectedText()) === "") return;
    // 更新 Webview 侧边栏，展示修改后的文本
    viewProviderInstance.update(modifiedText);
  } catch (error) {
    vscode.window.showErrorMessage(`Error modifying text: ${error.message}`);
    console.error('Error modifying text:', error);
  }
}

class NovelStyleRevisionViewProvider {
  static currentPanel = null;

  constructor(context) {
    this._context = context;
    
  }

  resolveWebviewView(webviewView) {
    console.log('Webview view resolved');
    NovelStyleRevisionViewProvider.currentPanel = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.file(path.join(this._context.extensionPath, 'resources'))]
    };
    const imagePath = webviewView.webview.asWebviewUri(vscode.Uri.file(path.join(__dirname, 'resources', 'title.png')));
    webviewView.webview.html = this.getWebviewContent(imagePath);

    webviewView.webview.onDidReceiveMessage(message => {
      if (message.command === 'apply') {
        applyModifiedText();
      }
    });
  }

  update(modifiedText) {
    if (NovelStyleRevisionViewProvider.currentPanel) {
      if (getSelectedText() === "\r\n" || String(getSelectedText()) === "\n" || String(getSelectedText()) === "") return;
      NovelStyleRevisionViewProvider.currentPanel.webview.postMessage({ modifiedText });

    }
  }
  showThinking() {
    if (NovelStyleRevisionViewProvider.currentPanel) {
      NovelStyleRevisionViewProvider.currentPanel.webview.postMessage({ showThinking: "true" });
    }
  }
  hideThinking() {
    if (NovelStyleRevisionViewProvider.currentPanel) {
      NovelStyleRevisionViewProvider.currentPanel.webview.postMessage({ hideThinking: "true" });
    }
  }
  getWebviewContent(imagePath) {
    const htmlPath = path.join(__dirname, 'index.html');
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');

    // 替换 HTML 内容中的占位符
    htmlContent = htmlContent.replace(/{{IMAGE_PATH}}/g, imagePath);

    return htmlContent;
  }
}

async function applyModifiedText() {
  inThinking = true;


  // 替换选中的文本
  activeEditor.edit(async editBuilder => {
    await editBuilder.replace(new vscode.Range(left_selector, right_selector), modifiedText);
  }).then(success => {
    if (!success) {
      vscode.window.showErrorMessage('Failed to apply text modifications');
      inThinking = false;
    } else {
      const document = activeEditor.document;
      const lastLine = document.lineCount - 1;  // 最后一行的索引
      const lastLineLength = document.lineAt(lastLine).text.length;  // 最后一行的长度
      left_selector = new vscode.Position(lastLine, lastLineLength);
      right_selector = new vscode.Position(lastLine, lastLineLength);
      activeEditor.setDecorations(decorationType, [new vscode.Range(left_selector, right_selector)]);
      modifiedText = "";
      viewProviderInstance.update(modifiedText);
      console.log('Text modifications applied successfully');
      inThinking = false;
      viewProviderInstance.hideThinking();
    }
  });
}

async function cancelModifiedText(){
  inThinking = true;
  clearTimeout(typingTimer);
  modifiedText = "";
  await viewProviderInstance.update(modifiedText);
  inThinking = false;
  await viewProviderInstance.hideThinking();
  left_selector = new vscode.Position(right_selector.line, right_selector.character);
  activeEditor.setDecorations(decorationType, [new vscode.Range(left_selector, right_selector)]);
}

async function getChatCompletion(promptText) {
  const apiUrl = baseURL;
  const document = await vscode.workspace.openTextDocument(vscode.Uri.file(path.join(activeContext.extensionPath, 'prompt.json')));
  let task_prompt = JSON.parse(document.getText()).task;
  let prompt = String(task_prompt).replace(/{style}/g, writingStyle).replace(/{language}/g, language) + ":\n"+String(promptText);
  console.log('Prompt:', JSON.stringify(prompt));
  try {
    const requestBody = {
      model: 'glm-4-flash',
      messages: [{ role: 'user', content: prompt }]
    };
    const headers = {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json'
    };
    const response = await axios.post(apiUrl, requestBody, { headers });

    return response.data.choices[0].message.content;
  } catch (error) {
    vscode.window.showErrorMessage("Failed to get completion. Please check your baseURL and apiKey" );
    viewProviderInstance.hideThinking();
    console.error('Failed to get completion:', error);
    return "";
  }
}

function getSelectedText() {
  const selectedText = activeEditor.document.getText(new vscode.Range(left_selector, right_selector));
  return selectedText;
}


function deactivate() {}

module.exports = {
  activate,
  deactivate
}