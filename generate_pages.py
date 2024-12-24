import random


def print_mos_json(
    systems: list[str], samples_per_system: int, type_: str, header: str
):
    ids = []
    for system in systems:
        ids += [system + "_" + str(i) for i in range(samples_per_system)]
    random.shuffle(ids)

    for id in ids:
        print(
            f'{{\n    "type": "{type_}",\n    "header": "{header}",\n    "music_id": "{id}"\n}},'
        )


if __name__ == "__main__":
    print_mos_json(["hu", "po", "ba", "pr"], 4, "mos1", "楽曲評価（その1）")

    print("=" * 20)

    print_mos_json(["hu", "pr"], 4, "mos2", "楽曲評価（その2）")
