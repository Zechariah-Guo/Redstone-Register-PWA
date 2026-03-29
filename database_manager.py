import sqlite3 as sql


def listComponents():
    with sql.connect("database/data_source.db") as con:
        cur = con.cursor()
        data = cur.execute("SELECT * FROM components").fetchall()
    return data
