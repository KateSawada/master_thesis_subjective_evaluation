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
  "https://script.google.com/macros/s/AKfycbwKHN3n7D6u3NvFrMsj2dT0N5DTprHxh7GyPVwL436F8AN0o3hQil1krV0pgeYom0ZzUw/exec";

let isPlayRequired = ["mos1", "mos2"];
let pages = []; // html element
let nextButtons = []; // html element
let prevButtons = []; // html element
let expSetId = -1;

function device() {
  const ua = navigator.userAgent;
  if (
    ua.indexOf("iPhone") > 0 ||
    ua.indexOf("iPod") > 0 ||
    (ua.indexOf("Android") > 0 && ua.indexOf("Mobile") > 0)
  ) {
    return "mobile";
  } else if (ua.indexOf("iPad") > 0 || ua.indexOf("Android") > 0) {
    return "tablet";
  } else {
    return "desktop";
  }
}

function setup() {
  expSetId = Math.trunc(Math.random() * 2);
  // pageJson = getJson("underDeveloping.json"); // TODO: ここ実際のpages.jsonに変える
  pageJson = getJson("pages.json");
  musicJson = getJson("musics.json")[expSetId];

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
    let buttonContainer = document.createElement("div");
    buttonContainer.className = "buttons-container";
    if (i > 0) {
      prevButtons[i] = createPrevPageButton(i);
      buttonContainer.appendChild(prevButtons[i]);
    }
    if (i < pageJson.length - 1) {
      nextButtons[i] = createNextPageButton(i);
      buttonContainer.appendChild(nextButtons[i]);
    } else {
      let btn = createButtonBase();
      btn.className = "mdc-button mdc-button--raised";
      btn.onclick = onFinishButtonClick;
      btn.innerText = "回答を送信";
      buttonContainer.appendChild(btn);
    }
    pages[i].appendChild(buttonContainer);
  }

  for (let i = 0; i < pages.length; i++) {
    pages[i].style.display = "none";
    document.getElementById("exp-content").appendChild(pages[i]);
  }
  pages[0].style.display = "block";
}

function getElementsByNameStartsWith(prefix) {
  let elements = document.querySelectorAll("[name]");
  let filtered = Array.from(elements).filter((el) =>
    el.name.startsWith(prefix)
  );
  return filtered;
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
  // ページの内容が回答済か確認（pageJsonの中を見て，typeによって分岐），未回答だったらalert出す
  // answersへの格納（typeによって分岐）
  if (pageJson[currentPageIndex].type == "yes-no") {
    let radios = document.getElementsByName(`page-${currentPageIndex}`);
    let checked = false;
    for (let i = 0; i < radios.length; i++) {
      if (radios[i].checked) {
        checked = true;
        answers[currentPageIndex] = radios[i].value;
        break;
      }
    }
    if (!checked) {
      alert("未回答です．");
      return;
    }
  } else if (
    pageJson[currentPageIndex].type === "mos1" ||
    pageJson[currentPageIndex].type === "mos2"
  ) {
    // MOSの場合は，項目ごと順番に文字列で評価値を格納．3項目がそれぞれ3, 5, 2の場合は "352"になる
    let forms = getElementsByNameStartsWith(`page-${currentPageIndex}`);
    answers[currentPageIndex] = " ".repeat(forms.length / 5);
    let notAllChecked = true;
    for (let i = 0; i < forms.length / 5; i++) {
      let radios = document.getElementsByName(`page-${currentPageIndex}-${i}`);
      let checked = false;
      for (let j = 0; j < radios.length; j++) {
        if (radios[j].checked) {
          checked = true;
          answers[currentPageIndex] =
            answers[currentPageIndex].substring(0, i) +
            (j + 1).toString() + // indexであるjは0始まりだが，評価値は1始まりのため補正
            answers[currentPageIndex].substring(i + 1);
          break;
        }
      }
      if (!checked) {
        notAllChecked = false;
      }
    }
    if (!notAllChecked) {
      alert("未回答です．");
      return;
    }
  }
  // pageの中身を更新（visibleの変更）
  // currentPageIndex更新
  pages[currentPageIndex].style.display = "none";
  pages[currentPageIndex + 1].style.display = "block";
  currentPageIndex += 1;
}

function createNextPageButton(pageIndex) {
  let btn = createButtonBase();
  btn.id = `next-button-${pageIndex}`;
  btn.className = "mdc-button mdc-button--raised right-button";
  btn.onclick = onNextButtonClick;
  btn.innerText = "次へ";
  btn.disabled = !canGoNextPage[pageIndex];
  return btn;
}

function createPrevPageButton(pageIndex) {
  // ボタン作る
  let btn = createButtonBase();
  btn.id = `prev-button-${pageIndex}`;
  btn.className = "mdc-button mdc-button--raised left-button";
  btn.onclick = onPrevButtonClick;
  btn.innerText = "前へ";
  btn.disabled = !canGoNextPage[pageIndex];
  return btn;
}

const formatDate = (current_datetime) => {
  let formatted_date =
    current_datetime.getFullYear() +
    "-" +
    (current_datetime.getMonth() + 1) +
    "-" +
    current_datetime.getDate() +
    " " +
    current_datetime.getHours() +
    ":" +
    current_datetime.getMinutes() +
    ":" +
    current_datetime.getSeconds();
  return formatted_date;
};

function onPrevButtonClick() {
  // currentPageIndex更新
  pages[currentPageIndex].style.display = "none";
  pages[currentPageIndex - 1].style.display = "block";
  currentPageIndex -= 1;
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
            <input class="mdc-radio__native-control" type="radio" id="radio-${pageIndex}-${i}-${j}" name="page-${pageIndex}-${i}" value=${j}>
            <div class="mdc-radio__background">
                <div class="mdc-radio__outer-circle"></div>
                <div class="mdc-radio__inner-circle"></div>
            </div>
            <div class="mdc-radio__ripple"></div>
            <div class="mdc-radio__focus-ring"></div>
        </div>
        <label class="mdc-radio-label-vertical" for="radio-${pageIndex}-${i}-${j}">${
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
  nextButtons[audio.getAttribute("pageIndex")].disabled = true;
  prevButtons[audio.getAttribute("pageIndex")].disabled = true;
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
  canGoNextPage[pageIndex] = true;
  nextButtons[pageIndex].disabled = false;
  prevButtons[pageIndex].disabled = false;
}

function main() {
  if (device().indexOf("desktop") < 0) {
    alert(
      "この実験はスマートフォン・タブレットには対応していません．PCでご参加ください．"
    );
    return;
  } else {
    setup();
  }
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
