var activeIndex;
var per_page;

window.onload = function() {
	activeIndex = 1;
	per_page = 100;
	updateMovies(1);

	$(function(){
    	$('.selectpicker').selectpicker();
	});
};

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
	per_page = newValue;
	$('#perPage').text(newValue);
	var wrapper = $('#perPageList');
    wrapper.find('button').removeClass('active');
    wrapper.find('button:contains("' + newValue + '")').first().addClass('active');
	activeIndex = 1;
	updateMovies(1);
	updateRatings(1);
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
	updateMovies(1);
	$('#ratingsTab').addClass('hidden');
	$('#moviesTab').removeClass('hidden');
	$('#pageBar').removeClass('hidden');
	$('#accountsTab').addClass('hidden');
}

function showRatings() {
	updateRatings(1);
	$('#moviesTab').addClass('hidden');
	$('#ratingsTab').removeClass('hidden');
	$('#pageBar').removeClass('hidden');
	$('#accountsTab').addClass('hidden');
}

function showAccounts() {
	$('#ratingsTab').addClass('hidden');
	$('#moviesTab').addClass('hidden');
	$('#pageBar').addClass('hidden');
	$('#accountsTab').removeClass('hidden');
}