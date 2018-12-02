var activeIndex;
var per_page;
var currentView;
var currentUserID;
var currentUser;
var users;

window.onload = function() {
	activeIndex = 1;
	per_page = 20;
	currentView = "Movies";
	getUsers();
	updateMovies(1);
	currentUserID = -1;
	$('#tooltip').tooltip()
};

function getUsers() {
	$.ajax({
		url: '/users',
		type: 'GET',
		success: function(response){
            users = response;
            updateUserSelector();
		},
		error: function(error){
			console.log(error);
		}
	});
}

function updateUserSelector() {
	var wrapper = $('#userSelector');
	wrapper.empty();
	for (var i in users) {
		var user = users[i];
		wrapper.append('<button onclick="switchUser(' + i + ')" class="dropdown-item" type="button">' + user["Name"] + '</button>');
	}
	if (currentUserID !== -1) {
		wrapper.find('button:contains("' + currentUser["Name"] + '")').first().addClass('active');
	}
}

function updateMovies(index) {
	activeIndex = index;
	$.ajax({
		url: '/movies?index=' + index + "&per_page=" + per_page,
		type: 'GET',
		success: function(response){
			$('#moviesTableBody').empty();
			var pages = response["pages"];
			updatePageButtons(pages, "Movies");
			var results = response["result"];
			for (var i in results) {
				var row = results[i];
				var id = row["ID"];
				var title = row["Title"];
				var genres = row["Genres"].replace(/\|/g, ", ");
				$('#moviesTable > tbody:last-child').append("<tr><td>" + id + "</td><td>" + title + "</td><td>" + genres + "</td></tr>");
			}
		},
		error: function(error){
			console.log(error);
		}
	});
}

function updatePerPage(newValue) {
	var currentItem = (per_page) * (activeIndex - 1);
    activeIndex = 1 + Math.floor(currentItem / newValue);

	per_page = newValue;
	$('#perPage').text(newValue);
	var wrapper = $('#perPageList');
    wrapper.find('button').removeClass('active');
    wrapper.find('button:contains("' + newValue + '")').first().addClass('active');

	if (currentView === "Movies") {
		updateMovies(activeIndex);
	} else if (currentView === "Ratings") {
		updateRatings(activeIndex);
	} else if (currentView === "Recommendations") {
		updateRecommendations(activeIndex);
	}
}

function updatePageButtons(pages, type) {
	var buttons = $('#pageButtons');
	buttons.empty();

	var list = pagination(activeIndex, pages);

	for (var i in list) {
		var page = list[i];
		if (page === activeIndex) {
			buttons.append('<button onclick="update' + type + '(' + page + ')" type="button" class="btn btn-outline-secondary active">' + page + '</button>')
		} else if (page === '...') {
			buttons.append('<button type="button" class="btn btn-outline-secondary disabled">...</button>')
		} else {
			buttons.append('<button onclick="update' + type + '(' + page + ')" type="button" class="btn btn-outline-secondary">' + page + '</button>')
		}
	}

}

function pagination(c, m) {
    var current = c,
        last = m,
        delta = 1,
        left = current - delta,
        right = current + delta + 1,
        range = [],
        rangeWithDots = [],
        l;

    for (var i = 1; i <= last; i++) {
        if (i === 1 || i === last || i >= left && i < right) {
            range.push(i);
        }
    }

    for (var j in range) {
    	var k = range[j];
        if (l) {
            if (k - l === 2) {
                rangeWithDots.push(l + 1);
            } else if (k - l !== 1) {
                rangeWithDots.push('...');
            }
        }
        rangeWithDots.push(k);
        l = k;
    }

    return rangeWithDots;
}

function updateRatings(index) {
	activeIndex = index;
	$.ajax({
		url: '/ratings?index=' + index + "&per_page=" + per_page,
		type: 'GET',
		success: function(response){
			$('#ratingsTableBody').empty();
			var pages = response["pages"];
			updatePageButtons(pages, "Ratings");
			var results = response["result"];
			for (var i in results) {
				var row = results[i];
				var user = row["User ID"];
				var movie = row["Movie ID"];
				var rating = row["Rating"];
				$('#ratingsTable > tbody:last-child').append("<tr><td>" + user + "</td><td>" + movie + "</td><td>" + rating + "</td></tr>");
			}
		},
		error: function(error){
			console.log(error);
		}
	});
}

function showMovies() {
	currentView = "Movies";
	updateMovies(1);
	$('#ratingsTab').addClass('hidden');
	$('#moviesTab').removeClass('hidden');
	$('#pageBar').removeClass('hidden');
	$('#accountsTab').addClass('hidden');
	$('#recommendationsTab').addClass('hidden');
}

function showRatings() {
	currentView = "Ratings";
	updateRatings(1);
	$('#moviesTab').addClass('hidden');
	$('#ratingsTab').removeClass('hidden');
	$('#pageBar').removeClass('hidden');
	$('#accountsTab').addClass('hidden');
	$('#recommendationsTab').addClass('hidden');
}

function showAccounts() {
	currentView = "Accounts";
	$('#ratingsTab').addClass('hidden');
	$('#moviesTab').addClass('hidden');
	$('#pageBar').addClass('hidden');
	$('#recommendationsTab').addClass('hidden');
	$('#accountsTab').removeClass('hidden');

	if (currentUserID === -1) {
	    $('#changeOrDelete').addClass('hidden');
	    $('#pleaseSignIn').removeClass('hidden');
	    $('#userRatingsTab').addClass('hidden');
    } else {
	    $('#changeOrDelete').removeClass('hidden');
	    $('#pleaseSignIn').addClass('hidden');
	    $('#nameEdit').val(currentUser["Name"]);
	    $('#userRatingsTab').removeClass('hidden');
	    getUserReviews();
    }
}

function showRecommendations() {
	currentView = "Recommendations";
	$('#ratingsTab').addClass('hidden');
	$('#moviesTab').addClass('hidden');
	$('#pageBar').removeClass('hidden');
	$('#accountsTab').addClass('hidden');
	$('#recommendationsTab').removeClass('hidden');

	if (currentUserID === -1) {
	    $('#notSignedIn').removeClass('hidden');
    } else {
	    $('#notSignedIn').addClass('hidden');
    }
    updateRecommendations(1);
}

function updateRecommendations(index) {
	activeIndex = index;
	$.ajax({
		url: '/getRecommendation?userId=' + currentUserID + '&index=' + index + '&per_page=' + per_page,
		type: 'GET',
		success: function(response){
			$('#recommendationsTableBody').empty();
			var pages = response["pages"];
			updatePageButtons(pages, "Recommendations");
			var results = response["result"];
			for (var i in results) {
				var row = results[i];
				var title = row["Movie Title"];
				var genres = row["Genre(s)"].replace(/\|/g, ", ");
				var rank = row["Rating"];
				if (!isNaN(rank)) {
					rank = rank.toFixed(2);
				}
				$('#recommendationsTable > tbody:last-child').append("<tr><td>" + title + "</td><td>" + genres + "</td><td>" + rank + "</td></tr>");
			}
		},
		error: function(error){
			console.log(error);
		}
	});
}

function getUserReviews() {
	$.ajax({
		url: '/userRatings?userId=' + currentUserID,
		type: 'GET',
		success: function(response){
			$('#userRatingsTableBody').empty();

			for (var i in response) {
				var row = response[i];
				var movie = row["Movie"];
				var rating = row["Rating"];
				var movieID = row["MovieID"];
				var editButton = "<td><button onclick='updateModal(" + movieID + ")' type='button' class='btn btn-secondary' data-toggle='modal' data-target='#updateRatingModal'><img src='static/images/edit.png' alt='Edit'/></button></td>";
				var deleteButton = "<td><button onclick='deleteRating(" + movieID + ")' type='button' class='btn btn-danger'><img src='static/images/delete.png' alt='Delete'/></button></td>";
				$('#userRatingsTable > tbody:last-child').append("<tr id='userRating" + movieID + "'><td>" + movie + "</td><td>" + rating + "</td>" + editButton + deleteButton + "</tr>");
			}
		},
		error: function(error){
			console.log(error);
		}
	});
}

function switchUser(id) {
    currentUserID = id;

    var wrapper = $('#userSelector');
    wrapper.find('button').removeClass('active');

    $('#userRatingsTableBody').empty();

    if (id === -1) {
    	$('#message').text("");
    	currentUser = null;
	} else {
    	currentUser = users[id];
		var name = currentUser["Name"];
		$('#message').text("Hello " + name + "!");
		wrapper.find('button:contains("' + name + '")').first().addClass('active');
	}

	if (currentView === "Accounts") {
		showAccounts();
	} else if (currentView === "Recommendations") {
		showRecommendations();
	}
}

function addUser() {
	var name = $('#addUserName').val();
	var newUser = {"Name": name, "Language": "English"};
    $.ajax({
		url: '/addUser',
		type: 'POST',
		data: newUser,
		success: function(response) {
			var newID = response["newID"];
			users[newID] = newUser;
			updateUserSelector();
			alert("Added new user: " + name);
			$('#addUserName').val("");
		},
		error: function(error){
			console.log(error);
		}
	});
}

function changeName() {
	var newName = $('#nameEdit').val();
    console.log("New name for user " + currentUserID + " is " + newName);
    $.ajax({
		url: '/updateUser',
		type: 'POST',
		data: {"ID": currentUserID, "Name": newName},
		success: function(){
			users[currentUserID]["Name"] = newName;
			currentUser = users[currentUserID];
			updateUserSelector();
			switchUser(currentUserID);
			alert("Name successfully changed to " + newName);
		},
		error: function(error){
			console.log(error);
		}
	});
}

function deleteCurrentUser() {
    console.log("Deleting user: " + currentUserID);
    $.ajax({
		url: '/deleteUser',
		type: 'POST',
		data: {"ID": currentUserID},
		success: function(){
			delete users[currentUserID];
			switchUser(-1);
			updateUserSelector();
			alert("User deleted.");
		},
		error: function(error){
			console.log(error);
		}
	});
}

function deleteRating(movieID) {
    console.log("Deleting rating with user " + currentUserID + " and movie " + movieID);
    $.ajax({
		url: '/deleteRating',
		type: 'POST',
		data: {"userId": currentUserID, "movieId": movieID},
		success: function(){
			$('#userRating' + movieID + '').remove();
		},
		error: function(error){
			console.log(error);
		}
	});
}

function updateModal(movieID) {
	var row = $('#userRating' + movieID + '');
	var text = row.find("td").first().text();
	$('#updateRatingModalLabel').text(text);
	$('#newRating').val(parseFloat(row.find("td").eq(1).text()));
	currentMovie = movieID;
}

var currentMovie;

function updateRating() {
	var rating = parseFloat($('#newRating').val());
  	if (!isNaN(rating) && rating >= 0 && rating <= 5) {
  		console.log("Updating rating with user " + currentUserID + " and movie " + currentMovie + " to " + rating);
		$.ajax({
			url: '/updateRating',
			type: 'POST',
			data: {"userId": currentUserID, "movieId": currentMovie, "rating": rating},
			success: function(){
				var row = $('#userRating' + currentMovie + '');
				row.find("td").eq(1).text(rating);
				$('#updateRatingModal').modal('hide');
				alert("Rating updated.");
			},
			error: function(error){
				console.log(error);
			}
		});
	} else {
  		alert("Please enter a number between 0 and 5.");
	}
}