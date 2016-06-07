

"use strict";
var initialLocations = [{
    realName: "Parcheggio Piazza Cavour",
    realAddress: "Piazza Cavour",
    realCity: "Roma",
    lat: "41.905104",
    lng: "12.470243"
}, {
    realName: "Trastevere Parking",
    realAddress: "Via Marescotti, 6",
    realCity: "Roma",
    lat: "41.8855019",
    lng: "12.4725266"
}, {
    realName: "Parking Tripoli",
    realAddress: "Via Tripoli, 144",
    realCity: "Roma",
    lat: "41.9290314",
    lng: "12.51651"
}, {
    realName: "Colonna parking",
    realAddress: "Via Santa Maria in Via 11",
    realCity: "Roma",
    lat: "41.9010506",
    lng: "12.4815397"
}, {
    realName: "Trastevere Parking",
    realAddress: "Via Marescotti, 6",
    realCity: "Roma",
    lat: "41.8855019",
    lng: "12.4725266"
}, {
    realName: "Vantaggio Parking di Settimi Carlo",
    realAddress: "Via Vantaggio, 44",
    realCity: "Roma",
    lat: "41.9085999",
    lng: "12.4754601"
}];


var map, infowindow, marker;

//This is in reference to the onerror call in the Google Maps API script. Thanks to whomever graded my code for the tip!
function googleError() {
    alert("Google Maps has failed to load at this time.");
}

//I moved the ko.applyBindings here to ensure that my viewModel will be called only after my map has been instantiated. 
function initMap() {
    map = new google.maps.Map(document.getElementById('map-canvas'), {
        center: {
            lat: 41.9027267,
            lng: 12.4881081
        },
        zoom: 11,
        scaleControl: true,
        mapTypeControl: false,
        disableDefaultUI: true

    });

    ko.applyBindings(new viewModel());
}

var createInfo = function(data, map) {
    var locationName = data.realName;
    var locationCity = data.realCity;

    function nonce_generate() {
        return (Math.floor(Math.random() * 1e12).toString());
    }

    var yelp_url = 'http://api.yelp.com/v2/search/';

    var yelp_key = "80vioFxwtHCQsZMHgSVGeA";
    var yelp_keySecret = "CU8LeQnDo4k2qx_kWLkrprBJykE";
    var yelp_token = "EynH5v43Zz-cLAUuu7k_nakZ2EnKmikF";
    var yelp_tokenSecret = "sgBfAJG8NMjQ8dutYW6D_OoN0ec";


    var parameters = {
        oauth_consumer_key: yelp_key,
        oauth_token: yelp_token,
        oauth_nonce: nonce_generate(),
        oauth_timestamp: Math.floor(Date.now() / 1000),
        oauth_signature_method: 'HMAC-SHA1',
        oauth_version: '1.0',
        callback: 'cb',
        term: locationName,
        location: locationCity,
        limit: 1
    };

    var encodedSignature = oauthSignature.generate('GET', yelp_url, parameters, yelp_keySecret, yelp_tokenSecret);

    parameters.oauth_signature = encodedSignature;

    var settings = {
        url: yelp_url,
        data: parameters,
        cache: true,
        dataType: 'jsonp',
        success: function(results) {
            var contentString = '<div>' +
                '<p align="center">' + results.businesses[0].name + '</p>' +
                '<p> Rating: <img src="' + results.businesses[0].rating_img_url + '"</p>' +
                '<p> Phone: ' + results.businesses[0].phone + '</p>' +
                '<p> Address: ' + results.businesses[0].location.display_address + '</p>' +
                '</div>';
            infowindow.setContent(contentString);
            infowindow.open(map, data.marker);
            clearTimeout(yelpTimeout);
        },
    };

    //Create an error message should the Yelp API fail to succeed.
    var yelpTimeout = setTimeout(function() {
        alert("Failed to get Yelp API response!");
    }, 8000);

    // Send AJAX query via jQuery library.
    $.ajax(settings);
};

 
var viewModel = function() {
    var that = this;
    infowindow = new google.maps.InfoWindow();
    that.searchInfo = ko.observableArray();
    that.search = ko.observable("");

    //Create a listClick function to bind the text of the location name to its marker.
    this.listClick = function(data) {
        google.maps.event.trigger(data.marker, 'click');
        
    };


this.resetMarkers = function() {
        for (var i = 0, len = that.searchInfo().length; i < len; i++) {
            that.searchInfo()[i].marker.setVisible(true);
        }
    };

//Function to match what the user inputs to the list of locations.
    this.filteredItems = ko.computed(function() {
        var filter = that.search().toLowerCase();
        if (!filter) {
            that.resetMarkers();
            return that.searchInfo();
        } else {
            that.resetMarkers();
            return ko.utils.arrayFilter(that.searchInfo(), function(item) {
                if (item.realName.toLowerCase().indexOf(that.search().toLowerCase()) >= 0) {
                    item.marker.setVisible(true);
                    return true;
                } else {
                    item.marker.setVisible(false);
                    return false;
                }
            });
        }
    }, that.searchInfo());

    //Create markers for each location in the array. Assist from @kfmahre.
    this.markers = function() {

        //Create a toggleBounce function to add animation when a marker is clicked.
        function toggleBounce(marker) {
            marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(function() {
                marker.setAnimation(null);
            }, 1500);
        }
        
         initialLocations.forEach(function(data) {
            that.searchInfo().push(data);
        });

        for (var i = 0; i < that.searchInfo().length; i++) {

            var currentMarker = that.searchInfo()[i];

            marker = new google.maps.Marker({
                map: map,
                icon: 'img/marker.png',
                position: new google.maps.LatLng(that.searchInfo()[i].lat, that.searchInfo()[i].lng),
                title: that.searchInfo().realName,
                animation: google.maps.Animation.DROP
            });
            
             //Establish an event for when the marker is clicked, the marker and var i will be set as parameters,
            //and execute the panTo, toggleBounce, and createInfo function.
            marker.addListener('click', function(marker, i) {
                return function() {
                    map.panTo(marker.position);
                    toggleBounce(marker);
                    createInfo(that.searchInfo()[i], map);
                }

            }(marker, i));
            that.searchInfo()[i].marker = marker;
        };


    };
    this.markers();
};
