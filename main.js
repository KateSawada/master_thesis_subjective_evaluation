/**
 * [x]「次へ」　を押すと現在の .page を非表示にして，次の .page を表示
 * * 最初に全ての .page を配列で取得 -> 現在のindexを保持 -> 一個ずつずらしていく
 *
 * [x] 最後は .page ではなく， #final-page に飛ばす
 *
 * [x] 全ての .page の表示時に 「次へ」を表示
 *
 * [ ] canGoNextPage の処理
 */

let canGoNextPage = true;
let pageCount = 0;
let currentPageIndex = -1;
let pages = [];
let music_json = null;
let expSetId = -1;

function showElement(elem) {
    elem.style.display = "block";
}

function hideElement(elem) {
    elem.style.display = "none";
}

function onNextButtonClick() {
    console.log("currentPageIndex(before): " + currentPageIndex);
    if (canGoNextPage) {
        if (pageCount == currentPageIndex + 1) {
            // final-page へ飛ばす
            hideElement(pages[currentPageIndex]);
            showElement(document.getElementById("final-page"));
        } else {
            // page
            hideElement(pages[currentPageIndex]);
            currentPageIndex += 1;
            showElement(pages[currentPageIndex]);
        }
    }
    console.log("currentPageIndex(after): " + currentPageIndex);
}

function getNextButton() {
    let btn = document.createElement('button');
    btn.onclick = onNextButtonClick;
    btn.innerText = "次へ";
    return btn;
}

function setup(){
    getJson("musics.json");
    window.addEventListener('DOMContentLoaded', (event) => {
        pages = document.getElementsByClassName("page");
        pageCount = pages.length;
        for (let i = 0; i < pages.length; i++) {
            pages[i].style = "display: none;";
            pages[i].appendChild(getNextButton());
        }
        currentPageIndex = 3;
        showElement(pages[currentPageIndex]);

    });
}

function getJson(filename) {
    fetch(filename)
        .then(response => response.json())
        .then(response => load_json(response));
}

async function load_json(data) {
    expSetId = Math.trunc(Math.random() * 2);
    music_json = data[expSetId];
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
