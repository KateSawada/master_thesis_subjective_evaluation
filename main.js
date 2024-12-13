/**
 * TODO: 品質評価
 */

let canGoNextPage = true;
let pageCount = 0;
let currentPageIndex = -1;
let pages = [];
let musicJson = null;
let pageJson = null;
let expSetId = -1;
let expTitleDiv = null;
let expContentDiv = null;
let answers = [];

let isMusicPlayed = [];

const spreadSheetUrl =
  "https://script.google.com/macros/s/AKfycbxIOcL-Kp7M0147V5vJIslZnNlT0Nx_qzl1udg5rBv12b4NJ0XOmArumNO4fouz9FCJPw/exec";

// pages.json properties
let hasText = ["text", "yes-no", "introduction"];
let hasQuestion = ["text", "yes-no"];
let isRadio = ["yes-no", "similarity"];
let isPlayRequired = ["similarity", "mos1", "mos2"];
let is5Radios = ["mos1", "mos2"];

function showElement(elem) {
  elem.style.display = "block";
}

function hideElement(elem) {
  elem.style.display = "none";
}

function replaceAt(str, index, replacement) {
  if (index < 0 || index >= str.length) {
    throw new Error("Index out of bounds");
  }
  return str.slice(0, index) + replacement + str.slice(index + 1);
}

function getElementsByNameStartsWith(prefix) {
  let elements = document.querySelectorAll("[name]");
  let filtered = Array.from(elements).filter((el) =>
    el.name.startsWith(prefix)
  );
  return filtered;
}

function evaluation() {
  inputs = getElementsByNameStartsWith("answer-input");
  if (inputs.length > 0) {
    if (isRadio.indexOf(pageJson[currentPageIndex].type) != -1) {
      for (let i = 0; i < inputs.length; i++) {
        if (inputs[i].checked) {
          answers[currentPageIndex] = inputs[i].value;
        }
      }
    } else if (is5Radios.indexOf(pageJson[currentPageIndex].type) != -1) {
      // MOSの場合は，項目ごと順番に文字列で評価値を格納．3項目がそれぞれ3, 5, 2の場合は "352"になる
      answers[currentPageIndex] = " ".repeat(
        Math.floor(document.getElementsByClassName("mdc-form-field").length) / 5
      );
      for (
        let i = 0;
        i < document.getElementsByClassName("mdc-form-field").length / 5;
        i++
      ) {
        inputs = document.getElementsByName(`answer-input-${i}`);
        for (var j = 0; j < inputs.length; j++) {
          if (inputs[j].checked) {
            console.log("Checking");
            answers[currentPageIndex] = replaceAt(
              answers[currentPageIndex],
              i,
              (j + 1).toString() // indexであるjは0始まりだが，評価値は1始まりのため補正
            );
          }
        }
      }
    } else if (pageJson[currentPageIndex].type == "text") {
      answers[currentPageIndex] = inputs[0].value;
    }
  } else if (pageJson[currentPageIndex].type == "introduction") {
    answers[currentPageIndex] = "## INTRODUCTION ##";
  }
  console.log(answers);

  return checkAnswered();
}

function fillExistAnswer() {
  if (answers[currentPageIndex] == null) {
    return;
  }
  inputs = document.getElementsByName("answer-input");
  if (inputs.length > 0) {
    if (isRadio.indexOf(pageJson[currentPageIndex].type) != -1) {
      inputs[Number(answers[currentPageIndex])].checked = true;
    } else if (pageJson[currentPageIndex].type == "text") {
      inputs[0].value = answers[currentPageIndex];
    }
  } else if (pageJson[currentPageIndex].type == "introduction") {
    // nothing to do
  }
}

function checkAnswered() {
  return [null, ""].indexOf(answers[currentPageIndex]) == -1 ? true : false;
}

function onStartButtonClick() {
  document.getElementById("start-page").style.display = "none";
  document.getElementById("exp-page").style.display = "block";
  onNextButtonClick();
}

function onFinishButtonClick() {
  sendData().then((res) => {
    clearExpContentDiv();
    let msg = "回答が送信されました．タブを閉じて終了してください．";
    alert(msg);
    expContentDiv.innerText = msg;
  });
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

// function getPlayButton(filepath, text) {
//     let audioSource = document.createElement("source");
//     audioSource.src = filepath;
//     audioSource.type = "audio/wav";

//     let audioElement = document.createElement("audio");
//     audioElement.appendChild(audioSource);

//     let btn = document.createElement("button");
//     btn.type = "button";
//     btn.innerText = text;
//     btn.onclick = play;

//     let wrapDiv = document.createElement("div");
//     wrapDiv.appendChild(btn);
//     wrapDiv.appendChild(audioElement);

//     return wrapDiv;
// }

function onNextButtonClick() {
  console.log("currentPageIndex(before): " + currentPageIndex);
  if (!evaluation()) {
    alert("回答されていません");
    return false;
  }
  currentPageIndex += 1;
  contentRefresh();
}

function onPrevButtonClick() {
  evaluation();
  currentPageIndex -= 1;
  contentRefresh();
}

function clearExpContentDiv() {
  while (expContentDiv.firstChild) {
    expContentDiv.removeChild(expContentDiv.firstChild);
  }
}

function contentRefresh() {
  clearExpContentDiv();
  isMusicPlayed = [];
  // ヘッダー更新
  expTitleDiv.innerText = pageJson[currentPageIndex].header;

  if (hasText.indexOf(pageJson[currentPageIndex].type) != -1) {
    let questionText = document.createElement("div");
    for (let i = 0; i < pageJson[currentPageIndex].text.length; i++) {
      let textLine = document.createElement("p");
      textLine.innerHTML = pageJson[currentPageIndex].text[i];
      questionText.appendChild(textLine);
    }
    expContentDiv.appendChild(questionText);
  }

  if (pageJson[currentPageIndex].type == "yes-no") {
    let displayText = ["はい", "いいえ"];
    for (let i = 0; i < displayText.length; i++) {
      expContentDiv.appendChild(
        createRadio(i, "answer-input", displayText[i], i)
      );
    }
  } else if (pageJson[currentPageIndex].type == "text") {
    // テキストで回答
    expContentDiv.appendChild(createTextFiled("answer-input"));
  } else if (pageJson[currentPageIndex].type == "similarity") {
    // 類似楽曲回答

    // 再生ボタン設置
    let musics = musicJson.similarity[pageJson[currentPageIndex].question_id];
    let playButtonText = ["楽曲Xを再生", "楽曲Aを再生", "楽曲Bを再生"];
    for (let i = 0; i < playButtonText.length; i++) {
      let btn = createPlayButton(musics[i], playButtonText[i], i);
      expContentDiv.appendChild(btn);

      // 再生完了かのフラグ
      isMusicPlayed[i] = false;
    }

    let text = document.createElement("p");
    text.innerText = "どちらが楽曲Xに似ていると感じましたか?";
    expContentDiv.appendChild(text);
    // 回答欄
    let displayText = ["楽曲Aのほうが似ている", "楽曲Bのほうが似ている"];
    for (let i = 0; i < displayText.length; i++) {
      expContentDiv.appendChild(
        createRadio(i, "answer-input", displayText[i], i)
      );
    }
  } else if (pageJson[currentPageIndex].type == "mos1") {
    // 短い曲・3項目
    let music = musicJson[pageJson[currentPageIndex].question_id];
    let btn = createPlayButton([music], "再生", 0);
    expContentDiv.appendChild(btn);

    expContentDiv.appendChild(
      create5valueInput(
        currentPageIndex,
        ["音楽性", "自然さ", "創造性"],
        "answer-input"
      )
    );

    // 再生完了かのフラグ
    isMusicPlayed[0] = false;
  } else if (pageJson[currentPageIndex].type == "mos2") {
    // 長い曲・4項目
  }

  fillExistAnswer();

  if (currentPageIndex > 0) {
    // 最初のページ以外では「前へ」ボタン
    expContentDiv.appendChild(getPrevButton());
  }
  if (currentPageIndex < pageJson.length - 1) {
    // 最後のページ以外では「次へ」ボタン
    let nextBtn = getNextButton();
    // 楽曲再生のページは初期状態でdisabled
    if (isPlayRequired.indexOf(pageJson[currentPageIndex].type) != -1) {
      nextBtn.disabled = true;
    }
    expContentDiv.appendChild(nextBtn);
  } else if (currentPageIndex == pageJson.length - 1) {
    let btn = createButtonBase();
    btn.className = "mdc-button mdc-button--raised";
    btn.onclick = onFinishButtonClick;
    btn.innerText = "回答を送信";
    expContentDiv.appendChild(btn);
  }
}

function createRadio(id, name, text, value) {
  let wrapperDiv = document.createElement("div");
  let formDiv = document.createElement("div");
  formDiv.className = "mdc-form-field";
  formDiv.innerHTML = `
    <div>
        <div class="mdc-form-field">
            <div class="mdc-radio">
                <input class="mdc-radio__native-control" type="radio" id="radio${id}" name="${name}" value=${value}>
                <div class="mdc-radio__background">
                <div class="mdc-radio__outer-circle"></div>
                <div class="mdc-radio__inner-circle"></div>
            </div>
            <div class="mdc-radio__ripple"></div>
            <div class="mdc-radio__focus-ring"></div>
        </div>
        <label for="radio${id}">${text}</label>
    </div>`;
  wrapperDiv.appendChild(formDiv);
  wrapperDiv.style.marginTop = "4px;";
  wrapperDiv.style.marginBottom = "4px;";
  return wrapperDiv;
}

function create5valueInput(id, labels, name) {
  // 5段階MOSの入力欄を作成
  // id: int, 設問id
  // labels: list[string], 項目の文字列
  // name: string, name属性
  let wrapperDiv = document.createElement("div");

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
            <input class="mdc-radio__native-control" type="radio" id="radio${id}-${i}-${j}" name="${name}-${i}" value=${j}>
            <div class="mdc-radio__background">
                <div class="mdc-radio__outer-circle"></div>
                <div class="mdc-radio__inner-circle"></div>
            </div>
            <div class="mdc-radio__ripple"></div>
            <div class="mdc-radio__focus-ring"></div>
        </div>
        <label class="mdc-radio-label-vertical" for="radio${id}-${i}-${j}">${
        j + 1
      }</label>
      </div>`;

      formDiv.appendChild(radioDiv);
    }
    wrapperDiv.appendChild(formDiv);
  }

  wrapperDiv.style.marginTop = "4px;";
  wrapperDiv.style.marginBottom = "4px;";
  return wrapperDiv;
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

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function createPlayButton(src, text, order) {
  let wrapperDiv = document.createElement("div");
  let btn = document.createElement("button");
  btn.className = "mdc-button mdc-button--outlined mdc-button--icon-leading";
  btn.innerHTML = `
    <span class="mdc-button__ripple"></span>
    <i class="material-icons mdc-button__icon" aria-hidden="true">play_circle_outline</i>
    <span class="mdc-button__label">${text}</span>
    `;
  let audio = document.createElement("audio");
  audio.setAttribute("order", order);
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

function createTextFiled(name) {
  let wrapperDiv = document.createElement("div");
  wrapperDiv.innerHTML = `
    <label class="mdc-text-field mdc-text-field--outlined mdc-text-field--no-label">
    <span class="mdc-notched-outline">
        <span class="mdc-notched-outline__leading"></span>
        <span class="mdc-notched-outline__trailing"></span>
    </span>
    <input class="mdc-text-field__input" type="text" name="${name}" aria-label="Label">
    </label>
    `;
  return wrapperDiv;
}

function getNextButton() {
  let btn = createButtonBase();
  btn.id = "next-button";
  btn.className = "mdc-button mdc-button--raised";
  btn.onclick = onNextButtonClick;
  btn.innerText = "次へ";
  return btn;
}

function getPrevButton() {
  let btn = createButtonBase();
  btn.id = "prev-button";
  btn.className = "mdc-button mdc-button--outlined";
  btn.onclick = onPrevButtonClick;
  btn.innerText = "前へ";
  return btn;
}

function setup() {
  expSetId = Math.trunc(Math.random() * 2);
  musicJson = getJson("musics.json")[expSetId];
  pageJson = getJson("underDeveloping.json");
  for (let i = 0; i < pageJson.length; i++) {
    answers.push(null);
  }
  window.addEventListener("DOMContentLoaded", (event) => {
    expTitleDiv = document.getElementById("exp-page-title");
    expContentDiv = document.getElementById("exp-content");
    pages = document.getElementsByClassName("page");
    pageCount = pages.length;
    for (let i = 0; i < pages.length; i++) {
      pages[i].style = "display: none;";
      pages[i].appendChild(getNextButton());
    }
    currentPageIndex = 0;
    contentRefresh();
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
      onPlayEnded(audio.getAttribute("order"));
    },
    false
  );
  audio.play();
}

function onPlayEnded(order) {
  console.log(`end ${order}`);
  isMusicPlayed[order] = true;
  let canPressNext = true;
  for (let i = 0; i < isMusicPlayed.length; i++) {
    canPressNext = canPressNext && isMusicPlayed[i];
  }
  if (canPressNext) {
    document.getElementById("next-button").disabled = false;
  }
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

main();
