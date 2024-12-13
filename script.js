// 時間かけていられないから，MOSに特化する

let canGoNextPage = []; // bool
let musicJson = null;
let pageJson = null;
let answers = [];
let mosLabels = [
  ["自然さ", "音楽性", "創造性"],
  ["自然さ", "音楽性", "楽曲区間の境目", "楽曲区間内の統一感"],
];
let currentPageIndex = 0;

const spreadSheetUrl =
  "https://script.google.com/macros/s/AKfycbxIOcL-Kp7M0147V5vJIslZnNlT0Nx_qzl1udg5rBv12b4NJ0XOmArumNO4fouz9FCJPw/exec";

let isPlayRequired = ["mos1", "mos2"];
let pages = []; // html element
let nextButtons = []; // html element

function setup() {
  pageJson = getJson("underDeveloping.json"); // TODO: ここ実際のpages.jsonに変える
  //   pageJson = getJson("pages.json");
  musicJson = getJson("musics.json");

  canGoNextPage = Array(pageJson.length).fill(false);
  answers = Array(pageJson.length).fill(null);
  pages = Array(pageJson.length).fill(null);
  nextButtons = Array(pageJson.length - 1).fill(null);
  for (let i = 0; i < pageJson.length; i++) {
    if (pageJson[i].type == "introduction") {
      canGoNextPage[i] = true;
      answers[i] = "## INTRODUCTION ##";
      pages[i] = createInstruction(i, pageJson[i]);
    } else if (pageJson[i].type == "yes-no") {
      canGoNextPage[i] = true;
      pages[i] = createYesNo(i, pageJson[i]);
    } else if (pageJson[i].type == "mos1") {
      pages[i] = createMos(i, pageJson[i], mosLabels[0]);
    } else if (pageJson[i].type == "mos2") {
      pages[i] = createMos(i, pageJson[i], mosLabels[1]);
    }
    if (i < pageJson.length - 1) {
      nextButtons[i] = createNextPageButton(i);
      pages[i].appendChild(nextButtons[i]);
    } else {
      let btn = createButtonBase();
      btn.className = "mdc-button mdc-button--raised";
      btn.onclick = onFinishButtonClick;
      btn.innerText = "回答を送信";
      pages[i].appendChild(btn);
    }
  }

  for (let i = 0; i < pages.length; i++) {
    console.log(pages[i]);
    document.getElementById("exp-content").appendChild(pages[i]);
  }
}

async function sendData() {
  let timestamp = new Date();
  timestamp = formatDate(timestamp);
  let dataBody = {
    dataType: "saveData",
    dataBody: {
      answers: answers,
      expSetId: expSetId,
      sendDate: timestamp,
    },
  };

  let postParam = {
    method: "POST",
    mode: "no-cors",
    "Content-Type": "application/x-www-form-urlencoded",
    body: JSON.stringify(dataBody),
  };

  fetch(spreadSheetUrl, postParam);
}

function onFinishButtonClick() {
  sendData().then((res) => {
    clearExpContentDiv();
    let msg = "回答が送信されました．タブを閉じて終了してください．";
    alert(msg);

    document.getElementById("exp-content").innerText = msg;
  });
}

function clearExpContentDiv() {
  let expContentDiv = document.getElementById("exp-content");
  while (expContentDiv.firstChild) {
    expContentDiv.removeChild(expContentDiv.firstChild);
  }
}

function createButtonBase() {
  let span1 = document.createElement("span");
  span1.className = "mdc-button__ripple";
  let span2 = document.createElement("span");
  span2.className = "mdc-button__focus-ring";
  let btn = document.createElement("button");
  btn.appendChild(span1);
  btn.appendChild(span2);
  btn.style.marginRight = "8px";
  btn.style.marginBottom = "4px";
  btn.style.marginTop = "4px";
  return btn;
}

function onNextButtonClick() {
  // TODO: ここ変える
  // ページの内容が回答済か確認（pageJsonの中を見て，typeによって分岐），未回答だったらalert出す
  // answersへの格納（typeによって分岐）
  // pageの中身を更新（visibleの変更）
  // currentPageIndex更新
}

function createNextPageButton(pageIndex) {
  let btn = createButtonBase();
  btn.id = `next-button-${pageIndex}`;
  btn.className = "mdc-button mdc-button--raised";
  btn.onclick = onNextButtonClick;
  btn.innerText = "次へ";
  btn.disabled = !canGoNextPage[pageIndex];
  return btn;
}

function createPrevPageButton(pageIndex) {
  // ボタン作る
  // onclickに，ページ内容書き換える関数を実装する（visibleの変更）
  // currentPageIndex更新
}

function createYesNo(pageIndex, pageContent) {
  let contentDiv = document.createElement("div");

  let headerH1 = document.createElement("h1");
  headerH1.innerText = pageContent.header;
  contentDiv.appendChild(headerH1);

  let questionText = document.createElement("div");
  for (let i = 0; i < pageContent.text.length; i++) {
    let textLine = document.createElement("p");
    textLine.innerHTML = pageContent.text[i];
    questionText.appendChild(textLine);
  }
  contentDiv.appendChild(questionText);

  let labels = ["はい", "いいえ"];
  let formDiv = document.createElement("div");
  formDiv.style.margin = "12px";
  for (let i = 0; i < labels.length; i++) {
    let radioDiv = document.createElement("div");
    radioDiv.className = "mdc-form-field";
    radioDiv.innerHTML = `
      <div class="mdc-radio-group-vertical">
        <div class="mdc-radio">
            <input class="mdc-radio__native-control" type="radio" id="radio-${pageIndex}-${i}" name="page-${pageIndex}" value=${i}>
            <div class="mdc-radio__background">
                <div class="mdc-radio__outer-circle"></div>
                <div class="mdc-radio__inner-circle"></div>
            </div>
            <div class="mdc-radio__ripple"></div>
            <div class="mdc-radio__focus-ring"></div>
        </div>
        <label class="mdc-radio-label-vertical" for="radio-${pageIndex}-${i}">${labels[i]}</label>
      </div>`;
    formDiv.appendChild(radioDiv);
  }
  contentDiv.appendChild(formDiv);

  return contentDiv;
}
function createMos(pageIndex, pageContent, labels) {
  let contentDiv = document.createElement("div");

  let headerH1 = document.createElement("h1");
  headerH1.innerText = "楽曲品質の評価";
  contentDiv.appendChild(headerH1);

  let musicSrc = musicJson[pageContent.music_id];
  console.log(musicSrc);
  let btn = createPlayButton(musicSrc, "再生", pageIndex);
  contentDiv.appendChild(btn);

  for (let i = 0; i < labels.length; i++) {
    let formDiv = document.createElement("div");
    formDiv.style.margin = "12px";
    let labelElem = document.createElement("span");
    labelElem.innerText = labels[i];
    labelElem.style.marginRight = "18px";
    formDiv.appendChild(labelElem);
    for (let j = 0; j < 5; j++) {
      let radioDiv = document.createElement("div");
      radioDiv.className = "mdc-form-field";
      radioDiv.innerHTML = `
      <div class="mdc-radio-group-vertical">
        <div class="mdc-radio">
            <input class="mdc-radio__native-control" type="radio" id="radio-${pageIndex}-${i}" name="page-${pageIndex}-${i}" value=${j}>
            <div class="mdc-radio__background">
                <div class="mdc-radio__outer-circle"></div>
                <div class="mdc-radio__inner-circle"></div>
            </div>
            <div class="mdc-radio__ripple"></div>
            <div class="mdc-radio__focus-ring"></div>
        </div>
        <label class="mdc-radio-label-vertical" for="radio-${pageIndex}-${i}">${
        j + 1
      }</label>
      </div>`;

      formDiv.appendChild(radioDiv);
    }
    contentDiv.appendChild(formDiv);
  }

  return contentDiv;
}

function createInstruction(pageIndex, pageContent) {
  let contentDiv = document.createElement("div");

  let headerH1 = document.createElement("h1");
  headerH1.innerText = pageContent.header;
  contentDiv.appendChild(headerH1);

  let questionText = document.createElement("div");
  for (let i = 0; i < pageContent.text.length; i++) {
    let textLine = document.createElement("p");
    textLine.innerHTML = pageContent.text[i];
    questionText.appendChild(textLine);
  }

  contentDiv.appendChild(questionText);
  return contentDiv;
}

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getJson(filename) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", filename, false);
  xhr.send(null);
  // fetch(filename)
  //     .then(response => response.json())
  //     .then(response => load_json(response));
  // return xhr.responseText;
  json = JSON.parse(xhr.responseText);
  return json;
}

function play(audio) {
  audio.addEventListener(
    "ended",
    function () {
      onPlayEnded(audio.getAttribute("pageIndex"));
    },
    false
  );
  audio.play();
}

function createPlayButton(src, text, pageIndex) {
  let wrapperDiv = document.createElement("div");
  let btn = document.createElement("button");
  btn.className = "mdc-button mdc-button--outlined mdc-button--icon-leading";
  btn.innerHTML = `
      <span class="mdc-button__ripple"></span>
      <i class="material-icons mdc-button__icon" aria-hidden="true">play_circle_outline</i>
      <span class="mdc-button__label">${text}</span>
      `;
  let audio = document.createElement("audio");
  audio.setAttribute("pageIndex", pageIndex);
  let uuid = generateUUID();
  audioElemId = `audio-${uuid}`;
  audio.id = audioElemId;
  btn.setAttribute(
    "onclick",
    `play(document.getElementById(\"${audioElemId}\"))`
  );
  audio.innerHTML = `
      <source src="${src}" type="audio/wav">
      `;
  wrapperDiv.appendChild(audio);
  wrapperDiv.appendChild(btn);
  wrapperDiv.className = "margin_vertical";
  return wrapperDiv;
}

function onPlayEnded(pageIndex) {
  console.log(pageIndex);
  canGoNextPage[pageIndex] = true;
  nextButtons[pageIndex].disabled = false;
}

function main() {
  setup();
}

// invalid enter key
window.document.onkeydown = function (evt) {
  const keyCode = evt.code;
  if (keyCode == "Enter") {
    return false;
  }
};

document.addEventListener("DOMContentLoaded", (event) => {
  main();
});
