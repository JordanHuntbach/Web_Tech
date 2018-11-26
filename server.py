from flask import Flask, render_template, request, redirect, Response, jsonify
import random
import json
import pandas
import numpy
import matplotlib.pyplot as plt

app = Flask(__name__)

users = {}

movies_data = pandas.read_csv("Data/movies.csv")
ratings_data = pandas.read_csv("Data/ratings.csv")


@app.route('/')
def output():
    # Serve index template
    return render_template('index.html', name='Jordan')


@app.route('/movies', methods=['GET'])
def get_movies():
    index = request.args.get('index')
    per_page = request.args.get('per_page')
    result = []
    count = 0
    low = index * per_page
    high = low + per_page
    result_range = range(low, high)
    for index, row in movies_data.iterrows():
        if count in result_range:
            result.append({"ID": row["movieId"]})
            result[index]["Title"] = row["title"]
            result[index]["Genres"] = row["genres"]
        elif count > high:
            break
        count += 1
    return jsonify(result)


@app.route('/ratings', methods=['GET'])
def get_ratings():
    result = []
    for index, row in ratings_data.iterrows():
        result.append({"User ID": row["userId"]})
        result[index]["Movie ID"] = row["movieId"]
        result[index]["Rating"] = row["rating"]
    return jsonify(result)


@app.route('/users')
def show_users():
    # Serve index template
    return render_template('index.html', name='Jordan')


if __name__ == "__main__":
    app.run()
