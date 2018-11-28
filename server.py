import csv

from flask import Flask, render_template, request, jsonify
import pandas

app = Flask(__name__)

users = {}

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
    read_users()
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
    return "User successfully deleted."


def read_users():
    users.clear()
    with open('Data/users.csv', 'r') as file:
        read = csv.reader(file)
        for row in read:
            user = {"Name": row[1], "Language": row[2]}
            users[row[0]] = user


def write_users():
    with open('Data/users.csv', 'w') as file:
        write = csv.writer(file)
        for user_id in users:
            user = users[user_id]
            write.writerow([user_id, user["Name"], user["Language"]])


if __name__ == "__main__":
    app.run()
