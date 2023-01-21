/**
 * TODO: 送信前にemptyの回答がないかチェック
 * TODO: 品質評価
 * TODO: 類似度評価
 */

let canGoNextPage = true;
let pageCount = 0;
let currentPageIndex = -1;
let pages = [];
let musicJson = null;
let pageJson = null;
let expSetId = -1;
let expContentDiv = null;
let answers = [];

function showElement(elem) {
    elem.style.display = "block";
}

function hideElement(elem) {
    elem.style.display = "none";
}

function evaluation() {
    inputs = document.getElementsByName("answer-input");
    if (inputs.length > 0) {
        if (pageJson[currentPageIndex - 1].type == "yes-no") {
            for (let i = 0; i < inputs.length; i++) {
                if (inputs[i].checked) {
                    answers[currentPageIndex - 1] = inputs[i].value;  // - 1: start-page の分
                }
            }
        } else if (pageJson[currentPageIndex - 1].type == "text") {
            answers[currentPageIndex - 1] = inputs[0].value;
        }
    }
    console.log(answers);
}

function onStartButtonClick() {
    document.getElementById('start-page').style.display ="none";
    document.getElementById("exp-page").style.display = "block";
    onNextButtonClick();
}

function onPrevButtonClick() {

}

function onNextButtonClick() {
    console.log("currentPageIndex(before): " + currentPageIndex);
    if (canGoNextPage) {
        // if (pageCount == currentPageIndex + 1) {
        if (false) {  // TODO: 最後のページへ
            // final-page へ飛ばす
            // hideElement(pages[currentPageIndex]);
            // showElement(document.getElementById("final-page"));
        } else {
            evaluation();
            currentPageIndex += 1;
            contentRefresh();
            // hideElement(pages[currentPageIndex]);
            // showElement(pages[currentPageIndex]);
        }
    }
    console.log("currentPageIndex(after): " + currentPageIndex);
}

function contentRefresh() {
    if (currentPageIndex > 0 && currentPageIndex <= pageJson.length){
        // pre-question
        while( expContentDiv.firstChild ){
            expContentDiv.removeChild( expContentDiv.firstChild );
        }
        let header = document.createElement("h1");
        header.innerText = pageJson[currentPageIndex - 1].header;
        expContentDiv.appendChild(header);

        let questionText = document.createElement("h2");
        questionText.innerText = pageJson[currentPageIndex - 1].text;
        expContentDiv.appendChild(questionText);

        if (pageJson[currentPageIndex - 1].type == "yes-no") {
            let displayText = ["はい", "いいえ"];
            let answerInput = [];
            for (let i = 0; i < displayText.length; i++) {
                answerInput.push(document.createElement("input"));
                answerInput[i].type = "radio";
                answerInput[i].name = "answer-input";
                answerInput[i].value = i;
                // answerInput[i].onclick = evaluation;  // 動かん
                let labelElement = document.createElement("label");
                labelElement.appendChild(answerInput[i]);
                labelElement.innerHTML += displayText[i];
                expContentDiv.appendChild(labelElement);
                expContentDiv.appendChild(document.createElement("br"));
            }
        } else if (pageJson[currentPageIndex - 1].type == "text") {
            let textInput = document.createElement("input");
            textInput.type = "text";
            textInput.name = "answer-input";
            expContentDiv.appendChild(textInput);
            expContentDiv.appendChild(document.createElement("br"));
        }
    } else if (false) { // TODO: 楽曲品質テスト

    } else if (false) { // TODO: 類似度テスト

    }

    if (currentPageIndex > 1) {
        // 最初のページ以外では「前へ」ボタン
        expContentDiv.appendChild(getPrevButton());
    }
    if (currentPageIndex < pageJson.length + musicJson.naturalness.length + musicJson.similarity.length) {
        // 最後のページ以外では「次へ」ボタン
        expContentDiv.appendChild(getNextButton());
    }
}

function getNextButton() {
    let btn = document.createElement('button');
    btn.onclick = onNextButtonClick;
    btn.innerText = "次へ";
    return btn;
}

function getPrevButton() {
    let btn = document.createElement('button');
    btn.onclick = onPrevButtonClick;
    btn.innerText = "前へ";
    return btn;
}

function setup(){
    expSetId = Math.trunc(Math.random() * 2);
    musicJson = getJson("musics.json")[expSetId];
    pageJson = getJson("pages.json");
    window.addEventListener('DOMContentLoaded', (event) => {
        expContentDiv = document.getElementById("exp-content");
        pages = document.getElementsByClassName("page");
        pageCount = pages.length;
        for (let i = 0; i < pages.length; i++) {
            pages[i].style = "display: none;";
            pages[i].appendChild(getNextButton());
        }
        currentPageIndex = 0;
        showElement(pages[currentPageIndex]);

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

function play(btn) {
    console.log(btn);
    let audio = document.getElementById("bgm1");
    audio.play();
}

function main() {
    setup();
}

// invalid enter key
window.document.onkeydown = function (evt) {
    const keyCode = evt.code;
    if (keyCode == "Enter"){
        return false;
    }
}


main();
