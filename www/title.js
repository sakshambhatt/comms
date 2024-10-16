const host = window.location.host;
const hostTokens = url.split(".");

const titleElem = document.querySelector("#title");
titleElem.textContent = hostTokens[0].replace(/\-/g, " ");
