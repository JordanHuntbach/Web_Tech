import csv
import math
import time

from flask_babel import Babel, _
from flask import Flask, render_template, request, jsonify
import pandas
import numpy
from scipy.sparse.linalg import svds

app = Flask(__name__)
babel = Babel(app)

users = {}

movies_data = pandas.read_csv("Data/movies.csv")
ratings_data = pandas.read_csv("Data/ratings.csv")
all_data = pandas.merge(ratings_data, movies_data, on='movieId')
predicted_ratings = None

current_recommendations = True

LANGUAGES = ['en', 'es', 'fr', 'zh', 'de']
current_language = 'en'


@babel.localeselector
def get_locale():
    return current_language


@app.route('/getCurrentLanguage', methods=['GET'])
def get_language():
    return current_language


@app.route('/switchLanguage', methods=['POST'])
def update_language():
    language = request.form['Language']
    user_id = int(request.form['ID'])
    if language in LANGUAGES:
        global current_language
        current_language = language
        if user_id in users:
            users[user_id]["Language"] = language
    return "Language updated"


def translate_genres(genres):
    dictionary = {
        "Action": _('Action'),
        "Adventure": _('Adventure'),
        "Animation": _('Animation'),
        "Children": _('Children'),
        "Comedy": _('Comedy'),
        "Crime": _('Crime'),
        "Documentary": _('Documentary'),
        "Drama": _('Drama'),
        "Fantasy": _('Fantasy'),
        "Film-Noir": _('Film-Noir'),
        "Horror": _('Horror'),
        "IMAX": _('IMAX'),
        "Musical": _('Musical'),
        "Mystery": _('Mystery'),
        "Romance": _('Romance'),
        "Sci-Fi": _('Sci-Fi'),
        "Thriller": _('Thriller'),
        "War": _('War'),
        "Western": _('Western')
    }
    genre_list = []
    for genre in genres.split("|"):
        genre_list.append(dictionary[genre])
    return "|".join(genre_list)


@app.route('/')
def output():
    return render_template('index.html')


@app.route('/movies', methods=['GET'])
def get_movies():
    index = int(request.args.get('index')) - 1
    per_page = int(request.args.get('per_page'))
    pages = len(movies_data) // per_page + 1
    result = []

    low = index * per_page
    high = low + per_page

    for index, row in movies_data.iloc[low:high].iterrows():
        new = {"ID": row["movieId"], "Title": row["title"], "Genres": translate_genres(row["genres"])}
        result.append(new)
    return jsonify({"pages": pages, "result": result})


@app.route('/ratings', methods=['GET'])
def get_ratings():
    index = int(request.args.get('index')) - 1
    per_page = int(request.args.get('per_page'))
    pages = len(ratings_data) // per_page + 1
    result = []

    low = index * per_page
    high = low + per_page

    for index, row in ratings_data.iloc[low:high].iterrows():
        new = {"User ID": row["userId"], "Movie ID": row["movieId"], "Rating": row["rating"]}
        result.append(new)
    return jsonify({"pages": pages, "result": result})


@app.route('/users', methods=['GET'])
def show_users():
    return jsonify(users)


@app.route('/addUser', methods=['POST'])
def add_user():
    name = request.form['Name']
    language = request.form['Language']
    new_id = max(users.keys()) + 1
    users[new_id] = {"Name": name, "Language": language}
    write_users()
    return jsonify({"newID": new_id})


@app.route('/updateUser', methods=['POST'])
def update_user():
    user_id = int(request.form['ID'])
    new_name = request.form['Name']
    users[user_id]["Name"] = new_name
    write_users()
    return "User successfully updated."


@app.route('/deleteUser', methods=['POST'])
def delete_user():
    user_id = int(request.form['ID'])
    del(users[user_id])
    write_users()
    return "User successfully deleted."


def read_users():
    users.clear()
    with open('Data/users.csv', 'r') as file:
        read = csv.reader(file)
        for row in read:
            user = {"Name": row[1], "Language": row[2]}
            users[int(row[0])] = user


def write_users():
    with open('Data/users.csv', 'w') as file:
        write = csv.writer(file)
        for user_id in users:
            user = users[user_id]
            write.writerow([user_id, user["Name"], user["Language"]])


@app.route('/userRatings', methods=['GET'])
def user_ratings():
    user_id = int(request.args.get('userId'))
    result = []
    user_rating_df = all_data.loc[all_data['userId'] == user_id]
    for index, row in user_rating_df.iterrows():
        new = {"Movie": row["title"], "Rating": row["rating"], "MovieID": row["movieId"]}
        result.append(new)
    result.sort(key=lambda i: i['Movie'])
    result.sort(key=lambda i: i['Rating'], reverse=True)
    return jsonify(result)


@app.route('/deleteRating', methods=['POST'])
def delete_rating():
    user_id = int(request.form['userId'])
    movie_id = int(request.form['movieId'])

    global ratings_data, all_data
    ratings_data = ratings_data[(ratings_data.userId != user_id) | (ratings_data.movieId != movie_id)]
    all_data = pandas.merge(ratings_data, movies_data, on='movieId')

    ratings_data.to_csv("Data/ratings.csv", index=False)

    global current_recommendations
    current_recommendations = False

    return "Rating successfully deleted."


class InvalidUsage(Exception):
    status_code = 400

    def __init__(self, message, status_code=None, payload=None):
        Exception.__init__(self)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['message'] = self.message
        return rv


@app.errorhandler(InvalidUsage)
def handle_invalid_usage(error):
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response


@app.route('/updateRating', methods=['POST'])
def update_rating():
    user_id = int(request.form['userId'])
    movie_id = int(request.form['movieId'])
    rating = float(request.form['rating'])

    global ratings_data, all_data, movies_data
    if len(movies_data.loc[movies_data['movieId'] == movie_id]) == 0:
        raise InvalidUsage('No Movie Found', status_code=400)
    elif len(ratings_data.loc[(ratings_data.userId == user_id) & (ratings_data.movieId == movie_id)]) == 0:
        ratings_data.loc[len(ratings_data)] = {"userId": user_id, "movieId": movie_id,
                                               "rating": rating, "timestamp": time.time()}
    else:
        ratings_data.loc[(ratings_data.userId == user_id) & (ratings_data.movieId == movie_id), 'rating'] = rating
    all_data = pandas.merge(ratings_data, movies_data, on='movieId')

    ratings_data.to_csv("Data/ratings.csv", index=False)

    global current_recommendations
    current_recommendations = False

    return "Rating successfully updated."


def predict_ratings():
    global predicted_ratings
    results_df = all_data.pivot_table(index='userId', columns='movieId', values='rating').fillna(0)
    results_matrix = results_df.as_matrix()
    user_ratings_mean = numpy.mean(results_matrix, axis=1)
    results = results_matrix - user_ratings_mean.reshape(-1, 1)
    k = 50
    u, sigma, v = svds(results, k)
    sigma = numpy.diag(sigma)

    all_user_predictions = numpy.dot(numpy.dot(u, sigma), v) + user_ratings_mean.reshape(-1, 1)
    predicted_ratings = pandas.DataFrame(all_user_predictions, columns=results_df.columns)
    global current_recommendations
    current_recommendations = True


@app.route('/getRecommendation', methods=['GET'])
def get_recommendation():
    global current_recommendations
    if not current_recommendations:
        predict_ratings()

    user_id = int(request.args.get('userId'))
    user_list = set(ratings_data.get('userId'))

    if user_id == -1 or user_id not in user_list:
        results = pandas.DataFrame(all_data.groupby('title')['rating'].mean())
        results['rating_counts'] = pandas.DataFrame(all_data.groupby('title')['rating'].count())
        results = results[results['rating_counts'] > 50].sort_values('rating', ascending=False)
        results = pandas.merge(results, movies_data, on='title', how='inner')
    else:
        results = movies_data.join(predicted_ratings.loc[user_id - 1].rename("rating"),
                                   on='movieId').sort_values('rating', ascending=False)

    index = int(request.args.get('index')) - 1
    per_page = int(request.args.get('per_page'))
    length = len(results)
    pages = length // per_page + 1
    result = []

    low = index * per_page
    high = low + per_page

    for index, row in results.iloc[low:high].iterrows():
        rating = row["rating"]
        if math.isnan(rating):
            rating = "None"
        new = {"Movie Title": row["title"], "Genre(s)": translate_genres(row["genres"]), "Rating": rating}
        result.append(new)
    return jsonify({"pages": pages, "result": result})


if __name__ == "__main__":
    predict_ratings()
    read_users()
    app.run()
