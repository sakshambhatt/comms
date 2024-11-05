const host = window.location.host;
const hostTokens = host.split(".");

const titleElem = document.querySelector("#title");
titleElem.textContent = hostTokens[0].replace(/\-/g, " ");
