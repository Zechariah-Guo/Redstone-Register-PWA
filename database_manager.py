from sqlalchemy import create_engine
from sqlalchemy import text

ENGINE = create_engine("sqlite:///database/data_source.db", future=True)


BASE_COMPONENT_QUERY = """
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
"""


def list_components(search_text=None):
    query = BASE_COMPONENT_QUERY
    parameters = {}

    if search_text:
        query += " WHERE lower(Name) LIKE :search_text"
        parameters["search_text"] = f"%{search_text.lower()}%"

    query += " ORDER BY Name ASC"

    with ENGINE.connect() as connection:
        rows = connection.execute(text(query), parameters).all()
    return rows


def listComponents(search_text=None):
    return list_components(search_text=search_text)
