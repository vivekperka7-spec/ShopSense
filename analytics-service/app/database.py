import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/shopsense")

client = MongoClient(MONGO_URI)
# The database name is embedded in the URI (defaults to "shopsense"), same
# database your Node/Express backend writes to - this service reads from
# the same live data, it does not duplicate it.
db = client.get_default_database()

vendors_col = db["vendors"]
products_col = db["products"]
transactions_col = db["transactions"]
