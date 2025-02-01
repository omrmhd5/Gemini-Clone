const messageForm = document.querySelector(".prompt_form");
const chatHistoryContainer = document.querySelector(".chats");
const suggestionItems = document.querySelectorAll(".suggests_item");

const themeToggleButton = document.getElementById("themeToggler");
const clearChatButton = document.getElementById("deleteButton");

//State Variables
let currentUserMessage = null;
let isGeneratingResponse = false;

const GOOGLE_API_KEY = "AIzaSyCs_1-zN1OiNe2V774pbROTee_eQYY6Pcc";
const API_REQUEST_URL = `"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`;

// Load Saved Data From Local Storage
const loadSavedChatHistory = () => {
  const savedConversations =
    JSON.parse(localStorage.getItem("saved-api-chats")) || [];
  const isLightTheme = localStorage.getItem("theme-color") === "light-mode";

  document.body.classList.toggle("light-mode", isLightTheme);

  themeToggleButton.innerHTML = isLightTheme
    ? "<i class='bx bx-moon></i>"
    : "<i class='bx bx-sun></i>";

  chatHistoryContainer = "";

  // Iterate Through Saved Chat History And Display Messages
  savedConversations.forEach((conversation) => {
    //Display The User's Messages
    const userMessageHTML = `
    
    <div class = "message_content">
    <img class = "message_avatar" src = assets/profile.png" alt ="User Avatar">
    <p class = "message_text">${conversation.userMessage}</p>
    </div>
    
    `;

    const outgoingMessageElement = createChatMessageElement(
      userMessageHTML,
      "message_outgoing"
    );
    chatHistoryContainer.appendChild(outgoingMessageElement);

    //Display The API Response
    const responseText =
      conversation.apiResponse?.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsedAPIResponse = marked.parse(responseText); // Convert to HTML
    const rawAPIResponse = responseText; //Plain Text Version

    const responseHTML = `
    <div class="message_content">
        <img class="message_avatar" src="assets/gemini.svg" alt="Gemini Avatar">
        <p class="message_text"></p>
        <div class="message_loading-indicator hide">
            <div class="message_loading-bar"></div>
            <div class="message_loading-bar"></div>
            <div class="message_loading-bar"></div>
        </div>
    </div>
    <span onClick="copyMessageToClipboard(this)" class="message_icon hide"></i class='bx bx-copy-alt'></i></span>
    `;

    const incomingMessageElement = createChatMessageElement(
      responseHTML,
      "message_incoming"
    );
    chatHistoryContainer.appendChild(incomingMessageElement);

    const messageTextElement =
      incomingMessageElement.querySelector(".message_text");

    //Display Saved Chat Without Typing Effect

    showTypingEffect(
      rawAPIResponse,
      parsedAPIResponse,
      messageTextElement,
      incomingMessageElement,
      true
    ); //'true' skips typing
  });

  document.body.classList.toggle("hide-header", savedConversations.length > 0);
};

//Create A New Chat Message Element
const createChatMessageElement = (htmlContent, ...cssClasses) => {
  const messageElement = document.createElement("div");
  messageElement.classList.add("message", ...cssClasses);
  messageElement.innerHTML = htmlContent;
  return messageElement;
};

//Show Typing Effect
const showTypingEffect = (
  rawText,
  htmlText,
  messageElement,
  incomingMessageElement,
  skipEffect = false
) => {
  const copyIconElement = incomingMessageElement.querySelector(".message_icon");
  copyIconElement.classList.add("hide"); // Initially Hide Copy Button

  if (skipEffect) {
    //Display Content Directly Without Typing
    messageElement.innerHTML = htmlText;
    hljs.highlightAll();
    addCopyButtonToCodeBlocks();
    copyIconElement.classList.remove("hide"); //Show Copy Button
    isGeneratingResponse = false;
    return;
  }

  const wordsArray = rawText.split(" ");
  let wordIndex = 0;

  const typingInterval = setInterval(() => {
    messageElement.innerText +=
      (wordIndex === 0 ? "" : " ") + wordsArray[wordIndex++];
    if (wordIndex === wordsArray.length) {
      clearInterval(typingInterval);
      isGeneratingResponse = false;
      messageElement.innerHTML = htmlText;
      hljs.highlightAll();
      addCopyButtonToCodeBlocks();
      copyIconElement.classList.remove("hide");
    }
  }, 50);
};
