window.onload = function() {
	updateMovies();
	// updateRatings();
};

function updateMovies() {
	$.ajax({
		url: '/movies',
		type: 'GET',
		success: function(response){
			$('#moviesTableBody').empty();
			for (var index in response) {
				var row = response[index];
				var id = row["ID"];
				var title = row["Title"];
				var genres = row["Genres"];
				$('#moviesTable > tbody:last-child').append("<tr><td>" + id + "</td><td>" + title + "</td><td>" + genres + "</td></tr>");
			}
		},
		error: function(error){
			console.log(error);
		}
	});
}

function updateRatings(ratings) {
	$.ajax({
		url: '/ratings',
		type: 'GET',
		success: function(response){
			$('#ratingsTableBody').empty();
			for (var index in response) {
				var row = response[index];
				var userID = row["User ID"];
				var movieID = row["Movie ID"];
				var rating = row["Rating"];
				$('#ratingsTable > tbody:last-child').append("<tr><td>" + userID + "</td><td>" + movieID + "</td><td>" + rating + "</td></tr>");
			}
		},
		error: function(error){
			console.log(error);
		}
	});
}

function showMovies() {
	$('#ratingsTable').addClass('hidden');
	$('#moviesTable').removeClass('hidden');
}

function showRatings() {
	$('#moviesTable').addClass('hidden');
	$('#ratingsTable').removeClass('hidden');
}