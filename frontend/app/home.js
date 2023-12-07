let globalReplies = {};
let postIDs = [];

function fetchPosts() {
    fetch("/posts/recent")
        .then((res) => res.json())
        .then((posts) => {
            createPosts(posts);
            for (let i = 0; i < posts.length; i++) {
                postIDs.push(posts[i]._id);
            }
        });
}


function fetchUserDetails() {
    fetch("/users/" + localStorage.user)
        .then((res) => res.json())
        .then((user) => {
            console.log(user);
            document.getElementById("userPic").src = "../" + user.profilePicture;
        });
}

/**
 * Toggles the like or dislike status of a post.
 *
 * @param {string} contentId - The ID of the post content.
 * @param {boolean} like - Indicates whether the post should be liked or disliked.
 * @param {number} index - The index of the post in the list.
 */
function likeOrDislikePost(contentId, like) {
    var data = {
        typeOfContent: "Post",
        contentId: contentId,
        like: like,
    };

    fetch("/likes/toggle", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
    })
        .then((res) => res.json())
        .then((post) => {
            changeLikeContent(contentId, like);
            // fetchPosts();
        });
}

/**
 * Checks if a user has liked a post.
 * @param {string} postID - The ID of the post.
 * @param {string} username - The username of the user.
 * @returns {Promise<string>} A promise that resolves with the response indicating if the user has liked the post.
 */
function checkIfLike(postID, username) {
    return new Promise((resolve, reject) => {
        fetch("/likes/check/" + postID + "/" + username)
            .then((response) => {
                return response.text();
            })
            .then((resp) => {
                resolve(resp);
            })
            .catch((error) => {
                console.error("Error checking likes:", error);
                reject(error);
            });
    });
}

/**
 * Changes the like content of a post based on the provided parameters.
 * @param {string} postID - The ID of the post.
 * @param {boolean} like - Indicates whether the like button was clicked (true) or the dislike button was clicked (false).
 */
function changeLikeContent(postID, like) {
    let likeHTML = (document.getElementById('post-'+postID).getElementsByClassName('article')[0].getElementsByClassName('like')[0]);
    if (like) {
        console.log('ye');
        likeIMG = likeHTML.getElementsByClassName("likeButton")[0].src;
        if (likeIMG == "http://localhost/app/images/like_nofill.png") {
            likeHTML.getElementsByClassName("likeButton")[0].src = "http://localhost/app/images/like_fill.png"
            let newNum = (parseInt(likeHTML.getElementsByTagName("div")[0].innerText)+1);
            likeHTML.getElementsByTagName("div")[0].innerText = newNum;
        } else {
            likeHTML.getElementsByClassName("likeButton")[0].src = "http://localhost/app/images/like_nofill.png"
            let newNum = (parseInt(likeHTML.getElementsByTagName("div")[0].innerText)-1);
            likeHTML.getElementsByTagName("div")[0].innerText = newNum;
        }
        if (likeHTML.getElementsByClassName("likeButton")[1].src == "http://localhost/app/images/dislike_fill.png") {
            likeHTML.getElementsByClassName("likeButton")[1].src = "http://localhost/app/images/dislike_nofill.png"
            let newNum = (parseInt(likeHTML.getElementsByTagName("div")[1].innerText)-1);
            likeHTML.getElementsByTagName("div")[1].innerText = newNum;
        }
        
    } else {
        dislikeIMG = likeHTML.getElementsByClassName("likeButton")[1].src;
        if (dislikeIMG == "http://localhost/app/images/dislike_nofill.png") {
            likeHTML.getElementsByClassName("likeButton")[1].src = "http://localhost/app/images/dislike_fill.png"
            let newNum = (parseInt(likeHTML.getElementsByTagName("div")[1].innerText)+1);
            likeHTML.getElementsByTagName("div")[1].innerText = newNum;
        } else {
            likeHTML.getElementsByClassName("likeButton")[1].src = "http://localhost/app/images/dislike_nofill.png"
            let newNum = (parseInt(likeHTML.getElementsByTagName("div")[1].innerText)-1);
            likeHTML.getElementsByTagName("div")[1].innerText = newNum;
        }
        if (likeHTML.getElementsByClassName("likeButton")[0].src == "http://localhost/app/images/like_fill.png") {
            likeHTML.getElementsByClassName("likeButton")[0].src = "http://localhost/app/images/like_nofill.png"
            let newNum = (parseInt(likeHTML.getElementsByTagName("div")[0].innerText)-1);
            likeHTML.getElementsByTagName("div")[0].innerText = newNum;
        }
    }
}   

/**
 * Registers event handlers for topic buttons.
 */
function registerTopicButtonHandlers() {
    let topicButtons = document.getElementsByClassName("topic-button");
    for (let i = 0; i < topicButtons.length; i++) {
        console.log(topicButtons[i]);
        topicButtons[i].onclick = function () {
            let topic = topicButtons[i].textContent.trim().toLocaleLowerCase();
            fetch("/posts/topic/"+topic, {
                method:'POST',
                headers: {'Content-Type' : 'application/json',},
                body: JSON.stringify({postIDs}),
            })
                .then((response) => {
                    console.log(response);
                    return response.json();
                })
                .then((posts) => {
                    postIDs = [];
                    for (let i = 0; i < posts.length; i++) {
                        console.log(posts[i]);
                        postIDs.push(posts[i]._id);
                    }
                    createPosts(posts);
                });
        };
    }
}

/**
 * Registers event handlers for the search box, search button, and user settings button.
 * Also registers handlers for topic buttons.
 */
function registerHandlers() {
    document
        .getElementById("search-box")
        .addEventListener("keypress", function (e) {
            if (e.key === "Enter") search();
        });
    document.getElementById("search-button").onclick = search;
    document.getElementById("userSettings").onclick = showUserSettings;
    registerTopicButtonHandlers();
}

/**
 * Toggles the display of the reply input for a comment.
 * @param {string} commentID - The ID of the comment.
 */
function toggleReplyInput(commentID) {
    let reply = document.getElementById("reply-" + commentID);
    let replyButton = document.getElementById("addReply-" + commentID);
    if (reply.style.display === "none") {
        reply.style.display = "block";
        replyButton.style.color = "grey";
    } else {
        reply.style.display = "none";
        replyButton.style.color = "#ddd";
    }
}

/**
 * Displays comments for a given post ID.
 * If comments are already displayed, removes them before displaying again.
 * Updates the comment label to show "Hide Comments" option.
 * Allows users to post new comments.
 * Retrieves comments from the server and displays them.
 * Updates the profile picture of each comment's author.
 * 
 * @param {string} postID - The ID of the post.
 * @returns {Promise<void>} - A promise that resolves when the comments are displayed.
 */
async function showComments(postID) {
    if (document.getElementById('comments-' + postID) != undefined) {
        document.getElementById('comments-' + postID).remove();
    }
    document.getElementById('commentLabel-' + postID).innerHTML =
        `<span class="toggleComments" onclick="hideComment('${postID}');"><i class='bx bxs-down-arrow' ></i>&nbsp;Hide Comments</span>`;

    content = `<div id="comments-${postID}"><input class="inputComment" id="commentBox-${postID}" type="text" placeholder=" Post a comment...">
                    <button class="inputCommentButton" onclick="addComment('${postID}');">Post!</button>`;

    const response = await fetch('/comments/get/' + postID);
    const comments = await response.json();

    content += await commentCreator(comments, postID)
    
    document.getElementById("post-" + postID).innerHTML += content;
    for (let i = 0; i < comments.length; i++) {
        fetch('/users/' + comments[i].username)
        .then(res => res.json())
        .then(user => {
            document.getElementById(comments[i]._id + "-pfp").src = "../" + user.profilePicture;
        });
    }
}

/**
 * Adds a comment to a post.
 * 
 * @param {string} post_id - The ID of the post to add the comment to.
 * @returns {void}
 */
function addComment(post_id) {
    var comment = document.getElementById("commentBox-" + post_id).value;
    var url = "/comments/add/" + post_id;
    var data = {
        parentId: post_id,
        content: comment,
    };
    fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        redirect: "follow",
    })
        .then((response) => {
            showComments(post_id);
        })
        .catch((error) => console.log("Error adding comment", error));
}

/**
 * Adds a reply to a comment.
 * @param {string} commentID - The ID of the comment to reply to.
 * @returns {Promise<void>} - A promise that resolves when the reply is added successfully.
 */
async function addReply(commentID) {
    const replyText = document.getElementById("reply-" + commentID).getElementsByTagName('input')[0].value;
    var url = '/comments/reply/' + commentID;
    var data = {
        'parentId': commentID,
        'content': replyText
    };
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        redirect: 'follow'
    })
        .then(result => {
            toggleRepliesAfterPost(commentID);
        })
        .catch(error => console.log('Error adding reply', error));
}

/**
 * Toggles the display of replies after a post.
 * 
 * @param {string} commentID - The ID of the comment.
 * @returns {Promise<void>} - A promise that resolves when the replies are checked and displayed.
 */
async function toggleRepliesAfterPost(commentID) {
    const replies = await checkReplies(commentID);
    console.log(replies);
    globalReplies[commentID] = replies;
    content = `<p class="replyText" onclick="showReplies('${commentID}');">Show Replies</p>`;
    document.getElementById("reply-" + commentID).parentNode.innerHTML += content;
    showReplies(commentID);
}

/**
 * Fetches replies for a given comment ID.
 * @param {string} commentID - The ID of the comment to fetch replies for.
 * @returns {Promise} - A promise that resolves to the JSON response containing the replies.
 */
function checkReplies(commentID) {
    return fetch('/comments/get/replies/' + commentID)
        .then((response) => {
            return response.json();
        })
        .catch((err) => {
            console.log(err);
        });
}

/**
 * Creates the HTML content for displaying comments.
 * @param {Array} comments - The array of comments.
 * @param {string} postID - The ID of the post.
 * @returns {string} - The HTML content for displaying comments.
 */
async function commentCreator(comments, postID) {
    let content = ``
    if (comments.length == 0) {
        content += `<div>Be the first to comment!</div>`;
    } else {
        content += '<div>';
        for (let i = 0; i < comments.length; i++) {
            if (document.getElementById("commentBox-"+comments[i]._id) !== null) {
                continue;
            }
            const replies = await checkReplies(comments[i]._id);

            content += `<div class="commentBox" id="commentBox-${comments[i]._id}">
                <div class="commentHead">
                    <img id="${comments[i]._id}-pfp" class="commentUserPic">
                    <p class="commentUsername">@${comments[i].username}</p>
                    <p class="commentDate">${getTime(comments[i].createdAt)}
                </div>
                <div class="commentContent">
                    ${comments[i].content}
                    <div class="actionButtons">
                        <p id="addReply-${comments[i]._id}" class="replyText" onclick="toggleReplyInput('${comments[i]._id}');">Reply</p>`;

            if (replies.length > 0) {
                globalReplies[comments[i]._id] = replies;
                content += `<p class="replyText" onclick="showReplies('${comments[i]._id}');">Show Replies</p>`;
            }

            if (comments[i].username == localStorage.user) {
                content += `<p class="deleteText" onclick="deleteComment('${comments[i]._id}','${postID}');">Delete</p>`;
            }

            content += `
                    </div>
                    <div class="reply" id="reply-${comments[i]._id}" style="display: none;">
                        <input class="reply" type="text" placeholder="Reply..." style="color: black">
                        <button class="addReply" onclick="addReply('${comments[i]._id}');">Post</button>
                    </div>
                    </div>
                    </div>`;
        }
        content += '</div>';
        return content
    }
    return content;
}

/**
 * Displays replies for a given post ID.
 * @param {string} postID - The ID of the post.
 * @returns {Promise<void>} - A promise that resolves when the replies are displayed.
 */
async function showReplies(postID) {
    let comments = globalReplies[postID];
    let content = await commentCreator(comments, postID)
    document.getElementById("reply-" + postID).innerHTML += content;
    for (let i = 0; i < comments.length; i++) {
        fetch('/users/' + comments[i].username)
        .then(res => res.json())
        .then(user => {
            document.getElementById(comments[i]._id + "-pfp").src = "../" + user.profilePicture;
        });
    }
    toggleReplyInput(postID);
}

/**
 * Deletes a comment with the specified commentID.
 * @param {string} commentID - The ID of the comment to be deleted.
 * @param {string} postID - The ID of the post associated with the comment.
 */
function deleteComment(commentID, postID) {
    var url = "/comments/delete/" + commentID;
    fetch(url, {
        method: "POST",
        redirect: "follow",
    })
        .then((result) => {
            showComments(postID);
        })
        .catch((error) => console.log("Error deleting comment", error));
}

/**
 * Calculates the time elapsed between the given date and the current time.
 * @param {string} date - The date to calculate the time elapsed from.
 * @returns {string} - The formatted time elapsed string.
 */
function getTime(date) {
    let currentTime = Date.now();
    dateObj = new Date(date);
    let dif = currentTime - dateObj.getTime();
    let seconds = dif / 1000;

    const days = Math.floor(seconds / 86400);
    seconds %= 86400;
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    seconds %= 60;
    if (days >= 1) {
        return days + (days > 1 ? " days ago" : " day ago");
    } else if (hours >= 1) {
        return hours + (hours > 1 ? " hrs ago" : " hr ago");
    } else if (minutes >= 1) {
        return minutes + (minutes > 1 ? " mins ago" : " min ago");
    } else {
        return "Just now";
    }
}

/**
 * Hides the comment section for a given post.
 * 
 * @param {string} postID - The ID of the post.
 */
function hideComment(postID) {
    document.getElementById(
        "commentLabel-" + postID
    ).innerHTML = `<span class="toggleComments" onclick="showComments('${postID}');"><i class='bx bxs-right-arrow' ></i>&nbsp;Show Comments</span>`;
    if (document.getElementById("comments-" + postID) != undefined) {
        document.getElementById("comments-" + postID).remove();
    }
}

/**
 * Performs a search based on the value entered in the search box.
 */
function search() {
    const query = document.getElementById("search-box").value;
    fetch("/posts/search/" + query)
        .then((response) => {
            console.log(response);
            return response.json();
        })
        .then((result) => {
            createPosts(result);
        });
}

/**
 * Displays the user settings on the page.
 */
function showUserSettings() {
    let userPic = document.getElementById("userPic").src;
    let userName = localStorage.getItem("user");
    document.getElementById(
        "searchEngine"
    ).innerHTML = `<input type="text" id="search-box" placeholder="Search...">
                                                            <button id="search-button" class="searchBtn">
                                                                <img src="./images/search.png" alt="searchLogo"> 
                                                            </button>
                                                            <button id="userSettings" onclick="hideUserSettings();">
                                                            <img src="" id="userPic">
                                                        </button>`;
    let content = `<div id="userSettingsBox">
                        <div>
                        <button onclick="logout();" id="logoutBtn"><i class='bx bx-log-out'></i></button>
                        <button id="close" onclick="hideUserSettings();"><i class='bx bx-x'></i></button>
                        </div>
                        <div style="display: flex;
                                    gap: 4%;">
                        <img src=${userPic} id="userPicSettings">   
                        <h2>@${userName}</h2>
                        </div><br>
                        <div>
                        <label for="fName">First Name</label>
                        <input id="fname" class="userN" type="text" name="fName" value=${getFirstName(
        userName
    )}>
                        </div><br>
                        <div>
                        <label for="lName">Last Name</label>
                        <input id="lname" class="userN" type="text" name="lName" value=${getLastName(
        userName
    )}>
                        <button onclick="editName('${userName}')" class="addBtn"> Save </button>
                        </div><br>
                        <div>
                            <form action="/uploads/profilePicture" method="post" enctype="multipart/form-data">
                                <input type="file" name="profilePicture" id="uploadFile">
                                <button id="uploadBtn" type="submit">Upload</button>
                            </form>
                        </div>

                    </div>`;

    document.body.innerHTML += content;

    fetchUserDetails();
    registerHandlers();
}

/**
 * Hides the user settings box and updates the search engine UI.
 * @function hideUserSettings
 */
function hideUserSettings() {
    console.log("here");
    document.getElementById("userSettingsBox").remove();
    document.getElementById(
        "searchEngine"
    ).innerHTML = `<input type="text" id="search-box" placeholder="Search...">
                                                        <button id="search-button" class="searchBtn">
                                                            <img src="./images/search.png" alt="searchLogo"> 
                                                        </button>
                                                        <button id="userSettings" onclick="showUserSettings();">
                                                        <img src="" id="userPic">
                                                        </button>`;

    fetchUserDetails();
}

/**
 * Creates and displays posts on the webpage.
 * 
 * @param {Array} posts - An array of post objects.
 */
function createPosts(posts) {
    let articles = "";
    document.getElementById("post-pannel").innerHTML = articles;
    for (let i = 0; i < posts.length; i++) {
        let topicsArr = posts[i].topics[0].split(',');
        topicsArr = topicsArr.map(topic => {
            const words = topic.trim().split(' ');
            const capitalizedWords = words.map(word => word.charAt(0).toUpperCase() + word.slice(1));
            return capitalizedWords.join(' ');
        });
        let topics = topicsArr.join(', ');
        let likePNG = "";
        let dislikePNG = "";

        checkIfLike(posts[i]._id, localStorage.user)
            .then((hasUsed) => {
                if (hasUsed.startsWith("NO")) {
                    likePNG = "./images/like_nofill.png";
                    dislikePNG = "./images/dislike_nofill.png";
                } else if (hasUsed.startsWith("FALSE")) {
                    likePNG = "./images/like_nofill.png";
                    dislikePNG = "./images/dislike_fill.png";
                } else {
                    likePNG = "./images/like_fill.png";
                    dislikePNG = "./images/dislike_nofill.png";
                }
                let content = posts[i].content;
                let dateObj = new Date(posts[i].date)
                let article = `<div class="post-boxes" id="post-${posts[i]._id}">
                        <div class="article">
                        <h1>${posts[i].title}</h1>
                        <i>${dateObj.toLocaleDateString()}</i><br>
                        <i>Topics: ${topics}</i>
                        <hr>
                        <h2>Background</h2>
                        <p>${content.background}</p>
                        <h2>Summary</h2>
                        <p>${content.summary}</p>
                        <h2>Bias</h2>
                        <p>${content.bias}</p>
                        <div class="like"><img onclick="likeOrDislikePost('${posts[i]._id}', true)"
                                        src=${likePNG} id="like-${i}" class="likeButton"><div>${posts[i].likes.length}</div>
                                <img onclick="likeOrDislikePost('${posts[i]._id}', false)"
                                        src=${dislikePNG} id="dislike-${i}" class="likeButton"><div>${posts[i].dislikes.length}</div>
                        </div>
                        
                        <div class="comments" id="commentLabel-${posts[i]._id}">
                            <span class="toggleComments" onclick="showComments('${posts[i]._id}');"><i class='bx bxs-right-arrow' ></i>&nbsp;Show Comments</span>
                        </div>
                        </div>
                        </div>`;
                articles += article;

                document.getElementById("post-pannel").innerHTML = articles;
                document.getElementById("post-pannel").innerHTML += `<button id="loadMore" onclick="loadMoreContent();">Load More</button>`
            })
            .catch((error) => {
                console.error("Error checking likes:", error);
            });
    }
}

/**
 * Loads more content by making a POST request to "/posts/loadnew" and appending the received posts to the existing ones.
 */
function loadMoreContent() {
    fetch("/posts/loadnew", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postIDs }),
    })
    .then((res) => res.json())
    .then((posts) => {
        for (let i = 0; i < posts.length; i++) {
            postIDs.push(posts[i]._id);
        }
        createPosts(posts);
    });
}

/**
 * Retrieves the first name of a user from the server and updates the value of an HTML element.
 * @param {string} user - The username of the user.
 * @returns {Promise<string>} The first name of the user.
 * @throws {Error} If there is an error during the fetch request.
 */
async function getFirstName(user) {
    try {
        const result = await fetch("/users/fname/" + user);
        const name = await result.text();
        document.getElementById("fname").value = name;
        return name;
    } catch (error) {
        console.error("Error:", error);
        throw error;
    }
}

/**
 * Retrieves the last name of a user from the server and updates the "lname" input field with the retrieved value.
 * @param {string} user - The username of the user.
 * @returns {Promise<string>} - A promise that resolves with the retrieved last name.
 * @throws {Error} - If an error occurs during the retrieval process.
 */
async function getLastName(user) {
    try {
        const result = await fetch("/users/lname/" + user);
        const name = await result.text();
        document.getElementById("lname").value = name;
        return name; 
    } catch (error) {
        console.error("Error:", error);
        throw error;
    }
}

/**
 * Updates the first name of a user.
 * @param {string} user - The username of the user.
 * @param {string} newFName - The new first name to be set.
 * @throws {Error} If there is an error during the update process.
 */
async function editFName(user, newFName) {
    try {
        const data = { username: user, name: newFName };
        const response = await fetch("/users/edit/fname", {
            method: "POST",
            body: JSON.stringify(data),
            headers: { "Content-Type": "application/json" },
        });
        if (response.ok) {
            console.log("First name updated successfully");
        }
    } catch (error) {
        console.error("Error:", error);
        throw error;
    }
}

/**
 * Updates the last name of a user.
 * @param {string} user - The username of the user.
 * @param {string} newLName - The new last name to be set.
 * @throws {Error} If there is an error during the update process.
 */
async function editLName(user, newLName) {
    try {
        const data = { username: user, name: newLName };
        const response = await fetch("/users/edit/lname", {
            method: "POST",
            body: JSON.stringify(data),
            headers: { "Content-Type": "application/json" },
        });
        if (response.ok) {
            console.log("Last name updated successfully");
        }
    } catch (error) {
        console.error("Error:", error);
        throw error;
    }
}

/**
 * Edits the name of a user.
 * @param {string} user - The user's identifier.
 * @returns {Promise<void>} - A promise that resolves when the name is successfully edited.
 */
async function editName(user) {
    let newLName = document.getElementById("lname").value;
    let newFName = document.getElementById("fname").value;
    try {
        const [firstNameResult, lastNameResult] = await Promise.all([
            getFirstName(user),
            getLastName(user)
        ]);

        if (newFName === firstNameResult && newLName === lastNameResult) {
            console.log("No changes made");
        } else {
            console.log(newFName, firstNameResult, newLName, lastNameResult);
            await editFName(user, newFName);
            await editLName(user, newLName);
            getFirstName(user),
            getLastName(user)
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

/**
 * Logs out the user by sending a POST request to the '/login/logout' endpoint
 * and redirects the user to the response URL.
 */
function logout() {
    let p = fetch('/login/logout', {
        method: 'POST'
    });
    p.then((response) => {
        console.log(response);
        window.location.href = response.url;
    }).catch((error) => {
        console.log(error);
    });
}

registerHandlers();
fetchUserDetails();
fetchPosts();
