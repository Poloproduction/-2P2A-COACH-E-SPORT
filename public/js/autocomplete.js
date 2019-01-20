$(function() {
    /* Weapons : Image name */
    var weapons = {
        'Fusil d\'assaut (SCAR)': 'scar',
        'Fusil d\'assaut (M4)': 'm4'
    };

    /* Add weapons in an array for autocomplete */
    var favoriteWeapons = [];

    for (var weaponName in weapons) {
        favoriteWeapons.push(weaponName);
    }

    var favoriteCities = [
        'Junk Junction',
        'Haunted Hills',
        'Pleasant Park',
        'Lazy Links',
        'Loot Lake',
        'Snobby Shores',
        'Tilted Towers',
        'Shifty Shafts',
        'Polar Peak',
        'Frosty Flights',
        'Happy Hamlet',
        'Risky Reels',
        'Wailing Woods',
        'Tomato Temple',
        'Dsuty Divot',
        'Lonely Lodge',
        'Retail Row',
        'Salty Springs',
        'Fatal Fiels',
        'Paradise Palms',
        'Lucky Landing'
    ];

    $('#favorite-weapon').autocomplete({
        source: favoriteWeapons,
        select: function (event, ui) {
            var $avatarImg = $('.avatar img');

            if($avatarImg.hasClass('default')) {
                $avatarImg.removeClass('default');
            }
            
            $avatarImg.attr('src', '/public/img/weapons/' + weapons[ui.item.value] + '.png');
        }
    });

    

    $('#favorite-city').autocomplete({
        source: favoriteCities
    })
});