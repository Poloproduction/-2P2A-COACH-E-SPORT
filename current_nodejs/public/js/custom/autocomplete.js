$(function() {
    var favoriteWeapons = [
        'Fusil d\'assaut',
        'Fusil d\'assaut à rafale'
    ];

    var favoriteSkins = [
        'Patch Patroller',
        'Pathfinder'
    ]

    $('#favorite-weapon').autocomplete({
        source: favoriteWeapons
    });

    $('#favorite-skin').autocomplete({
        source: favoriteSkins
    })
});