import sqlite3 as sql


def listComponents():
    with sql.connect("database/data_source.db") as con:
        cur = con.cursor()
        data = cur.execute(
            """
            SELECT
                ID,
                Image_Link,
                Name,
                Complexity,
                Obtainability,
                Category,
                COALESCE(wiki_link, '#') AS wiki_link,
                COALESCE(short_description, 'No description available yet.') AS short_description,
                COALESCE(short_usage, 'No usage information available yet.') AS short_usage,
                COALESCE(crafting_recipe, '../static/images/Recipes/Not_Applicable_Recipe.png') AS crafting_recipe
            FROM components
            ORDER BY Name ASC
            """
        ).fetchall()
    return data
