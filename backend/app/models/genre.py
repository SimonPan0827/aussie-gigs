GENRE_VALUES = [
    "electronic",
    "indie",
    "pop",
    "rock",
    "hip-hop",
    "jazz",
    "dance",
    "alternative",
]


def genre_check_constraint(column_name: str) -> str:
    values = ", ".join(f"'{genre}'" for genre in GENRE_VALUES)
    return f"{column_name} IN ({values})"