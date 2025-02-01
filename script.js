const messageForm = document.querySelector(".prompt_form");
const chatHistoryContainer = document.querySelector(".chats");
const suggestionItems = document.querySelectorAll(".suggests_item");

const themeToggleButton = document.getElementById("themeToggler");
const clearChatButton = document.getElementById("deleteButton");

//State Variables
let currentUserMessage = null;
let isGeneratingResponse = false;

const GOOGLE_API_KEY = "AIzaSyCs_1-zN1OiNe2V774pbROTee_eQYY6Pcc";
const API_REQUEST_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`;

// Load Saved Data From Local Storage
const loadSavedChatHistory = () => {
  const savedConversations =
    JSON.parse(localStorage.getItem("saved-api-chats")) || [];
  const isLightTheme = localStorage.getItem("themeColor") === "light_mode";

  document.body.classList.toggle("light_mode", isLightTheme);

  themeToggleButton.innerHTML = isLightTheme
    ? "<i class='bx bx-moon'></i>"
    : "<i class='bx bx-sun'></i>";

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

//Fetch API Response Based On User Input
const requestAPIResponse = async (incomingMessageElement) => {
  const messageTextElement =
    incomingMessageElement.querySelector(".message_text");
  try {
    const response = await fetch(API_REQUEST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: currentUserMessage }] }],
      }),
    });

    const responseData = await response.json();
    if (!response.ok) throw new Error(responseData.error.message);
    const responseText =
      responseData?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!response.ok) throw new Error("Invalid API Response");

    const parsedAPIResponse = marked.parse(responseText);
    const rawAPIResponse = responseText;

    showTypingEffect(
      rawAPIResponse,
      parsedAPIResponse,
      messageTextElement,
      incomingMessageElement
    );

    //Save Conversation In Local Storage
    let savedConversations =
      JSON.parse(localStorage.getItem("saved-api-chats")) || [];
    savedConversations.push({
      userMessage: currentUserMessage,
      apiResponse: responseData,
    });
    localStorage.setItem("saved-api-chats", JSON.stringify(savedConversations));
  } catch (error) {
    isGeneratingResponse = false;
    messageTextElement.innerText = error.message;
    messageTextElement.closest(".message").classList.add("message_error");
  } finally {
    incomingMessageElement.classList.remove("message_loading");
  }
};

//Add Copy Button To Code Block
const addCopyButtonToCodeBlocks = () => {
  const codeBlocks = document.querySelectorAll("pre");
  codeBlocks.forEach((block) => {
    const codeElement = block.querySelector("code");
    let language =
      [...codeElement.classList]
        .find((cls) => cls.startsWith("language-"))
        ?.replace("language-", "") || "Text";

    const languageLabel = document.createElement("div");
    languageLabel.innerText =
      language.charAt(0).toUpperCase() + language.slice(1);
    languageLabel.classList.add("code_language-label");
    block.appendChild(languageLabel);

    const copyButton = document.createElement("button");
    copyButton.innerHTML = `<i class='bx bx-copy'></i>`;
    copyButton.classList.add("code_copy-btn");
    block.appendChild(copyButton);

    copyButton.addEventListener("click", () => {
      navigator.clipboard
        .writeText(codeElement.innerText)
        .then(() => {
          copyButton.innerHTML = `<i class='bx bx-check'></i>`;
          setTimeout(
            () => ((copyButton.innerHTML = `<i class='bx bx-copy'></i>`), 2000)
          );
        })
        .catch((err) => {
          console.error("Copy Failed: ", err);
          alert("Unable To Copy Text!");
        });
    });
  });
};

//Show Loading Animation During API Request
const displayLoadingAnimation = () => {
  const loadingHTML = `
    <div class="message_content">
        <img class="message_avatar" src="assets/gemini.svg" alt="Gemini Avatar">
        <p class="message_text"></p>
        <div class="message_loading-indicator">
            <div class="message_loading-bar"></div>
            <div class="message_loading-bar"></div>
            <div class="message_loading-bar"></div>
        </div>
    </div>
    <span onClick="copyMessageToClipboard(this)" class="message_icon hide"></i class='bx bx-copy-alt'></i></span>
    `;

  const loadingMessageElement = createChatMessageElement(
    loadingHTML,
    "message_incoming",
    "message_loading"
  );
  chatHistoryContainer.appendChild(loadingMessageElement);

  requestAPIResponse(loadingMessageElement);
};

//Copy Message To Clipboard
const copyMessageToClipboard = (copyButton) => {
  const messageContent =
    copyButton.parentElement.querySelector(".message_text").innerText;

  navigator.clipboard.writeText(messageContent);
  copyButton.innerHTML = `<i class='bx bx-check'></i>`; //Confirmation Icon
  setTimeout(
    () => (copyButton.innerHTML = `</i class='bx bx-copy-alt'></i>`),
    1000
  ); //Revert Icon After 1 Second
};

//Handle Sending Chat Messages

const handleOutgoingMessage = () => {
  currentUserMessage =
    messageForm.querySelector(".prompt_form-input").value.trim() ||
    currentUserMessage;
  if (!currentUserMessage || isGeneratingResponse) return; //Exit If No Message Or Already Generating Response

  isGeneratingResponse = true;

  const outgoingMessageHTML = `
    <div class="message_content">
      <img class="message_avatar" src="assets/profile.png" alt="User Avatar">
      <p class="message_text"></p>
    </div>
  `;

  const outgoingMessageElement = createChatMessageElement(
    outgoingMessageHTML,
    "message_outgoing"
  );

  outgoingMessageElement.querySelector(".message_text").innerText =
    currentUserMessage;
  chatHistoryContainer.appendChild(outgoingMessageElement);

  messageForm.reset(); //Clear Input Field
  document.body.classList.add("hide-header");
  setTimeout(displayLoadingAnimation, 500); //Show Loading Animation After Delay
};

//Toggle Between Light And Dark Themes
themeToggleButton.addEventListener("click", () => {
  const isLightTheme = document.body.classList.toggle("light_mode");
  localStorage.setItem("themeColor", isLightTheme ? "light_mode" : "dark_mode");

  //Update Icon Based On Theme
  const newIconClass = isLightTheme ? "bx bx-moon" : "bx bx-sun";
  themeToggleButton.querySelector("i").className = newIconClass;
});

//Clear All Chat History
clearChatButton.addEventListener("click", () => {
  if (confirm("Are You Sure You Want To Delete All Chat History?")) {
    localStorage.removeItem("saved-api-chats");

    //Reload Chat History To Reflect Changes
    loadSavedChatHistory();

    currentUserMessage = null;
    isGeneratingResponse = false;
  }
});

//Handle Click On Suggestion Items
suggestionItems.forEach((suggestion) => {
  suggestion.addEventListener("click", () => {
    currentUserMessage = suggestion.querySelector(
      ".suggests_item-text"
    ).innerText;
    handleOutgoingMessage();
  });
});

//Prevent Default From Submission And Handle Outgoing Message
messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  handleOutgoingMessage();
});

//Load Saved Chat History On Page Load
loadSavedChatHistory();
