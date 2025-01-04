import csv
import re
from collections import defaultdict

import matplotlib.pyplot as plt
import numpy as np
from matplotlib import font_manager, rcParams

FILENAME = "results.csv"
IGNORE_ROWS = [2, 3, 4, 5, 6]  # テスト時のデータが2-6行目に入っているため除外

SYSTEM_NAMES = {
    "ba": "baseline",
    "pr": "proposed",
    "po": "polyffusion",
    "hu": "GT",
}

QUESTION_NAMES = {
    "mos1": ["Naturalness", "Musicality", " Creativity"],
    "mos2": ["Naturalness", "Musicality", "Boundary Clarity", "Phase Similarity"],
}


def graph(grouped_values, filename, type_="mos1"):
    # 項目ごとにデータを集める
    num_items = grouped_values[list(grouped_values.keys())[0]].shape[2]  # 項目数
    num_keys = len(grouped_values)

    # 項目ごとの平均と標準偏差を計算
    means = np.zeros((num_items, num_keys))
    stds = np.zeros((num_items, num_keys))

    for i in range(num_items):
        for j, key in enumerate(grouped_values):
            # 各keyのデータから、項目iに対応するデータを取り出し、平均と標準偏差を計算
            means[i, j] = np.mean(grouped_values[key][:, :, i])  # 項目iの平均
            stds[i, j] = np.std(grouped_values[key][:, :, i])  # 項目iの標準偏差

    # グラフの描画
    x = np.arange(num_keys)  # X軸位置: keysの数だけ
    fig, ax = plt.subplots(figsize=(10, 6))

    # 項目ごとに棒グラフを描画
    width = 0.2  # バーの幅
    for i in range(num_items):
        ax.bar(
            x + i * width,
            means[i, :],
            width,
            yerr=stds[i, :],
            capsize=5,
            label=QUESTION_NAMES[type_][i],
        )

    # ラベルとタイトルを設定
    ax.set_xticks(x + width * (num_items - 1) / 2)
    ax.set_xticklabels(
        SYSTEM_NAMES[key] for key in grouped_values.keys()
    )  # keys（AB, CD, EFなど）
    ax.legend()

    # グラフの表示
    plt.savefig(filename)


if __name__ == "__main__":
    header = []
    rows = []
    with open(FILENAME) as f:
        reader = csv.reader(f)
        for i, row in enumerate(reader):
            if (i + 1) in IGNORE_ROWS:
                continue
            elif i == 0:
                header = row
            else:
                rows.append(row)
    mos1_pattern = r"^([A-Za-z]{2})_[0-9]$"
    index_questions_mos1 = [
        i for i, s in enumerate(header) if re.match(mos1_pattern, s)
    ]
    mos2_pattern = r"^32([A-Za-z]{2})_[0-9]$"
    index_questions_mos2 = [
        i for i, s in enumerate(header) if re.match(mos2_pattern, s)
    ]

    # 前半と後半をそれぞれnumpy配列にする
    # ["自然さ", "音楽性", "創造性"],
    # ["自然さ", "音楽性", "楽曲区間の境目", "楽曲区間内の統一感"],
    mos1 = np.zeros((len(rows), len(index_questions_mos1), 3))  # 回答数, 質問数, 項目数
    mos2 = np.zeros((len(rows), len(index_questions_mos2), 4))  # 回答数, 質問数, 項目数

    for i, row in enumerate(rows):
        for j, index in enumerate(index_questions_mos1):
            for k in range(3):
                mos1[i, j, k] = int(row[index][k])

        for j, index in enumerate(index_questions_mos2):
            for k in range(4):
                mos2[i, j, k] = int(row[index][k])

    grouped_indices1 = defaultdict(list)
    for i, s in enumerate(header):
        match = re.match(mos1_pattern, s)
        if match:
            key = match.group(1)  # アルファベット2文字
            grouped_indices1[key].append(i)
    grouped_indices2 = defaultdict(list)
    for i, s in enumerate(header):
        match = re.match(mos2_pattern, s)
        if match:
            key = match.group(1)  # アルファベット2文字
            grouped_indices2[key].append(i)

    grouped_values1 = {
        key: mos1[:, np.array(indices) - min(index_questions_mos1), :]
        for key, indices in grouped_indices1.items()
    }
    grouped_values2 = {
        key: mos2[:, np.array(indices) - min(index_questions_mos2), :]
        for key, indices in grouped_indices2.items()
    }
    # grouped_values1[key]: (回答数, 質問数, 項目)  今回は質問数は全部4

    graph(grouped_values1, "mos1.png", "mos1")
    graph(grouped_values2, "mos2.png", "mos2")
