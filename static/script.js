// =========================================================
// ELEMENTS
// =========================================================

const messageInput =
    document.getElementById(
        "messageInput"
    );

const sendButton =
    document.getElementById(
        "sendButton"
    );

const messagesContainer =
    document.getElementById(
        "messages"
    );

const welcomeScreen =
    document.getElementById(
        "welcomeScreen"
    );

const conversationList =
    document.getElementById(
        "conversationList"
    );

const newChatButton =
    document.getElementById(
        "newChatButton"
    );

const topNewChat =
    document.getElementById(
        "topNewChat"
    );

const chatArea =
    document.getElementById(
        "chatArea"
    );


let currentConversationId = null;

let sending = false;


// =========================================================
// START
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await loadConversations();

        adjustTextarea();

        messageInput.focus();

    }
);


// =========================================================
// NEW CHAT
// =========================================================

function newChat() {

    currentConversationId = null;

    messagesContainer.innerHTML = "";

    welcomeScreen.style.display =
        "flex";

    messageInput.value = "";

    adjustTextarea();

    setActiveConversation();

    messageInput.focus();

    scrollToBottom();
}


newChatButton.addEventListener(
    "click",
    newChat
);


topNewChat.addEventListener(
    "click",
    newChat
);


// =========================================================
// LOAD CONVERSATIONS
// =========================================================

async function loadConversations() {

    try {

        const response =
            await fetch(
                "/api/conversations"
            );


        const data =
            await response.json();


        if (
            data.success
        ) {

            renderConversations(
                data.conversations
            );
        }

    }
    catch (error) {

        console.error(
            "Conversation loading error:",
            error
        );
    }
}


// =========================================================
// RENDER SIDEBAR
// =========================================================

function renderConversations(
    conversations
) {

    conversationList.innerHTML = "";


    if (
        !conversations ||
        conversations.length === 0
    ) {

        const empty =
            document.createElement(
                "div"
            );


        empty.style.color =
            "#4d667d";

        empty.style.fontSize =
            "10px";

        empty.style.padding =
            "10px 8px";


        empty.textContent =
            "No previous conversations.";


        conversationList.appendChild(
            empty
        );

        return;
    }


    conversations.forEach(
        conversation => {

            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "conversation-item";


            button.dataset.id =
                conversation.id;


            button.textContent =
                conversation.title ||
                "New Chat";


            button.addEventListener(
                "click",
                () => {

                    openConversation(
                        conversation.id
                    );

                }
            );


            conversationList.appendChild(
                button
            );

        }
    );


    setActiveConversation();
}


// =========================================================
// ACTIVE CHAT
// =========================================================

function setActiveConversation() {

    document
        .querySelectorAll(
            ".conversation-item"
        )
        .forEach(
            item => {

                item.classList.toggle(
                    "active",
                    item.dataset.id ===
                    currentConversationId
                );

            }
        );
}


// =========================================================
// OPEN CONVERSATION
// =========================================================

async function openConversation(
    conversationId
) {

    try {

        const response =
            await fetch(
                `/api/conversations/${conversationId}`
            );


        const data =
            await response.json();


        if (
            !data.success
        ) {

            return;
        }


        currentConversationId =
            conversationId;


        messagesContainer.innerHTML =
            "";


        const messages =
            data.conversation.messages || [];


        if (
            messages.length
        ) {

            welcomeScreen.style.display =
                "none";

        }
        else {

            welcomeScreen.style.display =
                "flex";
        }


        messages.forEach(
            message => {

                addMessage(
                    message.role,
                    message.content
                );

            }
        );


        setActiveConversation();

        scrollToBottom();

        messageInput.focus();

    }
    catch (error) {

        console.error(
            "Unable to open conversation:",
            error
        );

    }
}


// =========================================================
// SEND MESSAGE
// =========================================================

async function sendMessage() {

    if (sending) {

        return;
    }


    const message =
        messageInput.value.trim();


    if (!message) {

        return;
    }


    sending = true;

    sendButton.disabled =
        true;


    welcomeScreen.style.display =
        "none";


    // Show user message
    addMessage(
        "user",
        message
    );


    messageInput.value = "";

    adjustTextarea();

    scrollToBottom();


    // Temporary assistant message
    const assistantElement =
        addMessage(
            "assistant",
            "Thinking..."
        );


    try {

        const response =
            await fetch(
                "/api/chat",
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            message:
                                message,

                            conversation_id:
                                currentConversationId

                        })
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.error ||
                "Unable to generate response."
            );
        }


        currentConversationId =
            data.conversation_id;


        updateMessage(
            assistantElement,
            data.message
        );


        await loadConversations();

        setActiveConversation();

        scrollToBottom();

    }
    catch (error) {

        updateMessage(
            assistantElement,
            "Sorry, something went wrong.\n\n" +
            error.message
        );

    }
    finally {

        sending = false;

        sendButton.disabled =
            false;

        messageInput.focus();

    }
}


// =========================================================
// ADD MESSAGE
// =========================================================

function addMessage(
    role,
    content
) {

    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        `message ${role}`;


    const avatar =
        document.createElement(
            "div"
        );


    avatar.className =
        "message-avatar";


    avatar.textContent =
        role === "user"
            ? "YOU"
            : "AI";


    const body =
        document.createElement(
            "div"
        );


    body.className =
        "message-body";


    body.textContent =
        content;


    wrapper.appendChild(
        avatar
    );


    wrapper.appendChild(
        body
    );


    messagesContainer.appendChild(
        wrapper
    );


    return wrapper;
}


// =========================================================
// UPDATE MESSAGE
// =========================================================

function updateMessage(
    element,
    content
) {

    const body =
        element.querySelector(
            ".message-body"
        );


    if (body) {

        body.textContent =
            content;
    }
}


// =========================================================
// ENTER = SEND
// SHIFT + ENTER = NEW LINE
// =========================================================

messageInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter"
            &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();

        }

        // Shift + Enter:
        // browser creates a new line normally

    }
);


// =========================================================
// SEND BUTTON
// =========================================================

sendButton.addEventListener(
    "click",
    sendMessage
);


// =========================================================
// TEXTAREA AUTO RESIZE
// =========================================================

messageInput.addEventListener(
    "input",
    adjustTextarea
);


function adjustTextarea() {

    messageInput.style.height =
        "auto";


    messageInput.style.height =
        Math.min(
            messageInput.scrollHeight,
            180
        ) + "px";
}


// =========================================================
// SCROLL
// =========================================================

function scrollToBottom() {

    setTimeout(
        () => {

            chatArea.scrollTo({

                top:
                    chatArea.scrollHeight,

                behavior:
                    "smooth"

            });

        },
        40
    );
}