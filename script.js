const messageForm = document.querySelector(".prompt_form");
const chatHistoryContainer = document.querySelector(".chats");
const suggestionItems = document.querySelectorAll(".suggests_item");

const themeToggleButton = document.getElementById("themeToggler");
const clearChatButton = document.getElementById("deleteButton");

//State Variables
let currentUserMessage = null;
let isGeneratingResponse = false;
