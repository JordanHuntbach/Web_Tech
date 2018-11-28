from flask import Flask, render_template, request, jsonify
import pandas

app = Flask(__name__)

users = {1: {"Name": "Jordan", "Language": "English"}, 2: {"Name": "User 2", "Language": "English"}}

movies_data = pandas.read_csv("Data/movies.csv")
ratings_data = pandas.read_csv("Data/ratings.csv")


@app.route('/')
def output():
    # Serve index template
    return render_template('index.html')


@app.route('/movies', methods=['GET'])
def get_movies():
    index = int(request.args.get('index')) - 1
    per_page = int(request.args.get('per_page'))
    pages = len(movies_data) // per_page + 1
    result = []
    count = 0
    low = index * per_page
    high = low + per_page
    result_range = range(low, high)
    for index, row in movies_data.iterrows():
        if count in result_range:
            new = {"ID": row["movieId"], "Title": row["title"], "Genres": row["genres"]}
            result.append(new)
        elif count > high:
            break
        count += 1
    return jsonify({"pages": pages, "result": result})


@app.route('/ratings', methods=['GET'])
def get_ratings():
    index = int(request.args.get('index')) - 1
    per_page = int(request.args.get('per_page'))
    pages = len(ratings_data) // per_page + 1
    result = []
    count = 0
    low = index * per_page
    high = low + per_page
    result_range = range(low, high)
    for index, row in ratings_data.iterrows():
        if count in result_range:
            new = {"User ID": row["userId"], "Movie ID": row["movieId"], "Rating": row["rating"]}
            result.append(new)
        elif count > high:
            break
        count += 1
    return jsonify({"pages": pages, "result": result})


@app.route('/users', methods=['GET'])
def show_users():
    return jsonify(users)


@app.route('/updateUser', methods=['POST'])
def update_user():
    user_id = int(request.form['ID'])
    new_name = request.form['Name']
    users[user_id]["Name"] = new_name
    return "User successfully updated."


@app.route('/deleteUser', methods=['POST'])
def delete_user():
    user_id = int(request.form['ID'])
    del(users[user_id])
    return "User successfully deleted."


if __name__ == "__main__":
    app.run()
