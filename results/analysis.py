import csv
import re
from collections import defaultdict

import matplotlib.pyplot as plt
import numpy as np
from matplotlib import font_manager, rcParams
from scipy import stats

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
FONT_SIZE = 16


def graph(grouped_values, filename, type_="mos1"):
    # 項目ごとにデータを集める
    num_items = grouped_values[list(grouped_values.keys())[0]].shape[2]  # 項目数
    num_keys = len(grouped_values)

    # 項目ごとの平均と標準偏差を計算
    means = np.zeros((num_items, num_keys))
    stds = np.zeros((num_items, num_keys))

    confidence = 0.95  # 95%信頼区間
    confidence_intervals_upper = np.zeros((num_items, num_keys))
    confidence_intervals_lower = np.zeros((num_items, num_keys))

    for i in range(num_items):
        for j, key in enumerate(grouped_values):
            # 各keyのデータから、項目iに対応するデータを取り出し、平均と標準偏差を計算
            means[i, j] = np.mean(grouped_values[key][:, :, i])  # 項目iの平均
            stds[i, j] = np.std(grouped_values[key][:, :, i])  # 項目iの標準偏差
            sem = stats.sem(grouped_values[key][:, :, i].reshape(-1))  # 標準誤差
            confidence_intervals_lower[i, j], confidence_intervals_upper[i, j] = (
                stats.t.interval(
                    confidence,
                    len(grouped_values[key][:, :, i].reshape(-1)) - 1,
                    loc=means[i, j],
                    scale=sem,
                )
            )
            # print(
            #     f"  {confidence_intervals_upper[i, j]}, {confidence_intervals_lower[i, j]}"
            # )
            # print(f"  {means[i, j]}")
            # print(
            #     f"  {(confidence_intervals_lower[i, j] + confidence_intervals_upper[i, j]) / 2}"
            # )
            # print(sem)

    # 回答の標準偏差の確認
    tmp = dict()
    for k in grouped_values.keys():
        tmp[k] = np.std(grouped_values[k], axis=0)
    tmp_max = []
    tmp_min = []
    fig, axes = plt.subplots(2, 2, figsize=(10, 6))
    for i, (key, std) in enumerate(tmp.items()):
        ax = axes[i // 2, i % 2]
        for j in range(std.shape[-1]):
            ax.scatter(
                std[:, j],
                np.ones_like(std[:, j]) * j,
                label=QUESTION_NAMES[type_][j],
            )
        ax.set_title(SYSTEM_NAMES[key], fontsize=FONT_SIZE)
        tmp_max.append(np.max(std[:, j]))
        tmp_min.append(np.min(std[:, j]))
        ax.legend(fontsize=FONT_SIZE)
    for ax in axes.flatten():
        ax.set_xlim(min(tmp_min) * 0.95, max(tmp_max) * 1.05)
    fig.suptitle(f"{type_} std min={min(tmp_min):.3f}, max={max(tmp_max):.3f}")
    plt.savefig(f"{filename}_std.png")
    plt.close("all")

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
            yerr=confidence_intervals_upper[i, :] - means[i, :],  # 95%信頼区間
            capsize=5,
            label=QUESTION_NAMES[type_][i],
        )

    # ラベルとタイトルを設定
    ax.tick_params(labelsize=FONT_SIZE)
    ax.set_yticks([i for i in range(0, 6)])
    ax.set_xticks(x + width * (num_items - 1) / 2)
    ax.set_xticklabels(
        [SYSTEM_NAMES[key] for key in grouped_values.keys()], fontsize=FONT_SIZE
    )  # keys（AB, CD, EFなど）
    ax.legend(fontsize=FONT_SIZE)

    # グラフの表示
    plt.savefig(filename)
    plt.close("all")


def welch_t_test(a: np.ndarray, b: np.ndarray):
    A_var = np.var(a, ddof=1)  # Aの不偏分散
    B_var = np.var(b, ddof=1)  # Bの不偏分散
    A_df = len(a) - 1  # Aの自由度
    B_df = len(b) - 1  # Bの自由度
    f = A_var / B_var  # F比の値
    one_sided_pval1 = stats.f.cdf(f, A_df, B_df)  # 片側検定のp値 1
    one_sided_pval2 = stats.f.sf(f, A_df, B_df)  # 片側検定のp値 2
    two_sided_pval = min(one_sided_pval1, one_sided_pval2) * 2  # 両側検定のp値

    # print(
    #     f"F:       {round(f, 3)}",
    # )
    # print(
    #     f"p-value: {round(two_sided_pval, 4)}, 等分散性: {'あり' if two_sided_pval > 0.05 else 'なし'} (p: 0.05)"
    # )
    print(
        f"{'有意差あり' if stats.ttest_ind(a, b, equal_var=False).pvalue < 0.05 else '有意差なし'}"
    )


def evaluate(rows, export_file_header: str):
    print(export_file_header)
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

    graph(grouped_values1, f"{export_file_header}_mos1.png", "mos1")
    graph(grouped_values2, f"{export_file_header}_mos2.png", "mos2")

    # t検定
    print("== mos1 ==")
    print("* proposed vs polyffusion")
    for i in range(grouped_values1["pr"].shape[-1]):
        print(f'** {QUESTION_NAMES["mos1"][i]}')
        welch_t_test(
            grouped_values1["pr"][:, :, i].reshape(-1),
            grouped_values1["po"][:, :, i].reshape(-1),
        )
    print("* proposed vs GT")
    for i in range(grouped_values1["pr"].shape[-1]):
        print(f'** {QUESTION_NAMES["mos1"][i]}')
        welch_t_test(
            grouped_values1["pr"][:, :, i].reshape(-1),
            grouped_values1["hu"][:, :, i].reshape(-1),
        )

    print()

    print("== mos2 ==")
    for i in range(grouped_values2["pr"].shape[-1]):
        print(f'** {QUESTION_NAMES["mos2"][i]}')
        welch_t_test(
            grouped_values2["pr"][:, :, i].reshape(-1),
            grouped_values2["hu"][:, :, i].reshape(-1),
        )
    print()


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

    evaluate(rows, f"all_{len(rows)}")

    rows_music_experienced = []
    rows_music_inexperienced = []
    for row in rows:
        if row[4] == "0" or row[5] == "0" or row[6] == "0":
            rows_music_experienced.append(row)
        else:
            rows_music_inexperienced.append(row)
    evaluate(rows_music_experienced, f"music_experienced{len(rows_music_experienced)}")
    evaluate(
        rows_music_inexperienced, f"music_inexperienced{len(rows_music_inexperienced)}"
    )
